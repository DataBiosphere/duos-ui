import type { FastifyReply, FastifyRequest } from 'fastify'
import { establishSession } from '../session/rotation.js'

/** BEEs also render env=dev. Never use NODE_ENV: deployed dev runs production builds. */
export function testSigninEmails(config: Record<string, unknown>): ReadonlySet<string> | undefined {
  if (process.env.DUOS_TEST_SIGNIN_ENABLED !== 'true') return undefined
  if (config.env !== 'dev') {
    throw new Error('DUOS_TEST_SIGNIN_ENABLED requires config.json env=dev (dev or BEE only)')
  }
  // The route registers only in BFF mode, so fail loudly rather than ignore the flag.
  // index.ts already requires DUOS_DB_HOST whenever bffEnabled is true.
  if (config.bffEnabled !== true) {
    throw new Error('DUOS_TEST_SIGNIN_ENABLED requires bffEnabled')
  }
  const emails = new Set((process.env.DUOS_TEST_SIGNIN_EMAILS ?? '').split(',').map(email => email.trim()).filter(Boolean))
  if (emails.size === 0 || [...emails].some(email => !/^[a-z\d-]+@[a-z\d-]+\.iam\.gserviceaccount\.com$/.test(email))) {
    throw new Error('DUOS_TEST_SIGNIN_EMAILS must list the automation service-account emails')
  }
  return emails
}

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const TIMEOUT_MS = 3000

/**
 * Google's tokeninfo endpoint accepts the access token by GET query string or by
 * form-encoded POST body; the body keeps the token out of URLs and proxy logs.
 * For an access token it answers with `email`, `email_verified` (the string
 * "true"), `scope` and `expires_in` (a string of seconds) — the shape the CI
 * Playwright job exercises against real service-account tokens.
 * Credentials are sent only in the POST body; never log the token or provider body/errors.
 */
async function tokenInfo(accessToken: string, request: FastifyRequest): Promise<Record<string, unknown> | undefined> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(TOKENINFO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: accessToken }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      })
      if (response.status !== 200) {
        request.log.warn({ reason: 'tokeninfo_status', status: response.status, attempt }, '[test-signin] rejected')
        // Retry a provider 5xx once. Every 4xx is final: invalid credentials
        // cannot heal, and an immediate retry of a 429 only adds to the load
        // Google is already shedding.
        if (response.status >= 500) continue
        return undefined
      }
      // A body of the wrong shape fails the claim checks in the handler.
      return await response.json() as Record<string, unknown> | undefined
    }
    catch {
      request.log.warn({ reason: 'tokeninfo_network_timeout_or_json', attempt }, '[test-signin] rejected')
    }
  }
  return undefined
}

/** A token must have at least this long left, so a run never starts on a token about to expire. */
const MIN_EXPIRES_IN_SECONDS = 300

export type ClaimCheck
  = { ok: true, email: string, expiresIn: number }
    | { ok: false, claim: string }

/**
 * Checks the tokeninfo claims in order and names the first one that fails, so
 * the server log says which check rejected a token without echoing any value.
 * Tokeninfo sends expires_in as a string; anything that is not a whole number fails.
 */
export function checkClaims(info: Record<string, unknown> | undefined, emails: ReadonlySet<string>): ClaimCheck {
  if (!info) return { ok: false, claim: 'tokeninfo_unavailable' }
  if (typeof info.email !== 'string' || !emails.has(info.email)) return { ok: false, claim: 'email_not_allowlisted' }
  if (info.email_verified !== true && info.email_verified !== 'true') return { ok: false, claim: 'email_not_verified' }
  const scopes = typeof info.scope === 'string' ? new Set(info.scope.split(/\s+/)) : new Set<string>()
  if (!scopes.has('email') && !scopes.has('https://www.googleapis.com/auth/userinfo.email')) return { ok: false, claim: 'email_scope_missing' }
  if (!scopes.has('profile') && !scopes.has('https://www.googleapis.com/auth/userinfo.profile')) return { ok: false, claim: 'profile_scope_missing' }
  const expiresIn = Number(info.expires_in)
  if (!Number.isSafeInteger(expiresIn)) return { ok: false, claim: 'expires_in_invalid' }
  if (expiresIn < MIN_EXPIRES_IN_SECONDS) return { ok: false, claim: 'expires_in_too_short' }
  return { ok: true, email: info.email, expiresIn }
}

export function createTestSigninHandler(emails: ReadonlySet<string>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.header('cache-control', 'no-store')
    const accessToken = (request.body as { accessToken?: unknown } | null)?.accessToken
    if (typeof accessToken !== 'string' || !accessToken.trim() || accessToken.length > 8192) {
      reply.status(401).send()
      return
    }
    // Anchor expiry before the network call so latency never extends a token's lifetime.
    const startedAt = Math.floor(Date.now() / 1000)
    const info = await tokenInfo(accessToken, request)
    const checked = checkClaims(info, emails)
    if (!checked.ok) {
      request.log.warn({ reason: 'tokeninfo_claims', claim: checked.claim }, '[test-signin] rejected')
      reply.status(401).send()
      return
    }

    await establishSession(request, {
      accessToken,
      tokenExpiry: startedAt + checked.expiresIn,
      userId: checked.email,
      idp: 'google',
      testFixture: true,
    })
    reply.status(204).send()
  }
}
