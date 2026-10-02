import { JWT } from 'google-auth-library'
import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const ROLES = ['ADMIN', 'CHAIR', 'MEMBER', 'RESEARCHER', 'SIGNING_OFFICIAL'] as const
export type Role = typeof ROLES[number]

// Google-signed access token from a per-role service account key (no interactive
// OIDC redirect needed), for submission into the app's /backgroundsignin route.
export const getAccessToken = async (role: Role): Promise<string> => {
  const envVar = `DUOS_AUTOMATION_${role}_SA`
  const keysJson = process.env[envVar]
  if (!keysJson) {
    throw new Error(`Missing service account key env var ${envVar}`)
  }

  // DUOS_AUTOMATION_*_SA holds whatever Secret Manager returns for these accounts, which
  // is the service account key JSON wrapped in a { key: {...} } envelope, not the bare key.
  const parsed = JSON.parse(keysJson)
  const serviceAccountKey = parsed.key ?? parsed

  // Construct JWT directly; DUOS_AUTOMATION_*_SA is always a service account key, so the
  // credential-type-specific constructor is the right fit.
  const client = new JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: ['email', 'profile'],
  })
  await client.authorize()

  const accessToken = client.credentials.access_token
  if (!accessToken) {
    throw new Error(`Failed to obtain access token for role ${role}`)
  }
  return accessToken
}

export const SIGN_IN_ATTEMPTS = 3
const SIGN_IN_BACKOFF_MS = 1_000
const SIGN_IN_ATTEMPT_TIMEOUT_MS = 8_000

const firstLine = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).split('\n')[0]

interface SignInRetryOptions {
  attempts?: number
  backoffMs?: number
}

/**
 * Runs sign-in attempts until one succeeds. Each attempt mints a new token and submits it.
 * Dev Consent keeps the claims of the first request that carries a token, so a token that
 * met a bad first request stays refused for minutes, and only a new token can recover.
 * Returns the number of attempts it used.
 */
export async function signInWithRetry(
  attemptSignIn: (accessToken: string) => Promise<void>,
  mintToken: () => Promise<string>,
  { attempts = SIGN_IN_ATTEMPTS, backoffMs = SIGN_IN_BACKOFF_MS }: SignInRetryOptions = {},
): Promise<number> {
  const failures: string[] = []
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await attemptSignIn(await mintToken())
      return attempt
    }
    catch (error) {
      failures.push(`attempt ${attempt}: ${firstLine(error)}`)
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, backoffMs * attempt))
    }
  }
  throw new Error(`Sign-in failed after ${attempts} attempts\n${failures.join('\n')}`)
}

/** What the sign-in form shows, such as the reason the app gave for a refusal. */
const formNotice = async (page: Page): Promise<string> => {
  const text = await page.locator('form[name="accessTokenForm"]').innerText({ timeout: 1_000 }).catch(() => 'no form on the page')
  return text.replace(/\s+/g, ' ').trim()
}

async function submitToken(page: Page, accessToken: string): Promise<void> {
  await page.goto('/backgroundsignin')
  await page.locator('textarea[name="accessToken"]').fill(accessToken)
  await page.locator('input[type="submit"]').click()
  try {
    // Sign-in redirects client-side to whichever console the role lands on
    // (Navigation.console), so assert we've left this page rather than guessing the
    // destination or waiting on network idle.
    await expect(page).not.toHaveURL(/backgroundsignin/, { timeout: SIGN_IN_ATTEMPT_TIMEOUT_MS })
  }
  catch {
    throw new Error(`still on the sign-in page: ${await formNotice(page)}`)
  }
}

type AuthFixtures = {
  signInAs: (role: Role) => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  // Playwright passes this callback positionally; it's named `provideSignIn` rather than
  // the conventional `use` so linters don't mistake the call for React's `use()` hook.
  signInAs: async ({ page }, provideSignIn) => {
    await provideSignIn(async (role: Role) => {
      const attempts = await signInWithRetry(token => submitToken(page, token), () => getAccessToken(role))
      // A retry hides a refused sign-in, so the report records each one.
      if (attempts > 1) {
        base.info().annotations.push({ type: 'sign-in-retries', description: `${role}: ${attempts - 1}` })
      }
    })
  },
})

export { expect } from '@playwright/test'
