import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Configuration } from 'openid-client'
import { handleCallback } from '../src/auth/callback.js'

// Mock getOidcConfig() (network) but keep the real requireEnv() so its
// env-var validation is exercised for real.
vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return { ...actual, getOidcConfig: vi.fn() }
})

vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return { ...actual, authorizationCodeGrant: vi.fn() }
})

const AZURE_ENV = {
  DUOS_OAUTH_REDIRECT_URI: 'https://local.dsde-dev.broadinstitute.org:3000/auth/callback',
}

function makeTokens(claims: Record<string, unknown> | undefined, options: { expiresIn?: number } = {}) {
  const expiresIn = 'expiresIn' in options ? options.expiresIn : 3600
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    id_token: 'test-id-token',
    claims: () => claims,
    expiresIn: () => expiresIn,
  } as never
}

function makeRequest(overrides: {
  url?: string
  pkceVerifier?: string
  pkceState?: string
  returnTo?: string
  destroyError?: Error
} = {}): FastifyRequest {
  const session: Record<string, unknown> = {
    sessionId: 'pre-auth-sid',
    pkceVerifier: 'pkceVerifier' in overrides ? overrides.pkceVerifier : 'test-verifier',
    pkceState: 'pkceState' in overrides ? overrides.pkceState : 'test-state',
    returnTo: overrides.returnTo,
    save: vi.fn().mockResolvedValue(undefined),
  }
  // Emulate @fastify/session's regenerate(): request.session becomes a NEW,
  // EMPTY session with a new sid. Emptying the data fields here is load-bearing
  // for the tests: any field the handler reads or writes on the WRONG side of
  // the rotation (returnTo read after, tokens written before) is lost, exactly
  // as in production.
  session.regenerate = vi.fn().mockImplementation(async () => {
    for (const key of Object.keys(session)) {
      if (key !== 'sessionId' && key !== 'save' && key !== 'regenerate') delete session[key]
    }
    session.sessionId = 'post-auth-sid'
  })
  return {
    url: overrides.url ?? '/auth/callback?code=test-code&state=test-state',
    session,
    sessionStore: {
      destroy: vi.fn((_sid: string, callback: (err?: Error | null) => void) =>
        callback(overrides.destroyError ?? null)),
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as FastifyRequest
}

function makeReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    redirect: vi.fn(),
  } as unknown as FastifyReply & { status: ReturnType<typeof vi.fn>, send: ReturnType<typeof vi.fn>, redirect: ReturnType<typeof vi.fn> }
}

describe('handleCallback', () => {
  const fakeConfig = {} as Configuration

  beforeEach(async () => {
    Object.assign(process.env, AZURE_ENV)

    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(fakeConfig)

    const oidc = await import('openid-client')
    vi.mocked(oidc.authorizationCodeGrant).mockReset()
      .mockResolvedValue(makeTokens({ email: 'user@example.com' }))
  })

  afterEach(() => {
    for (const key of Object.keys(AZURE_ENV)) delete process.env[key]
  })

  it('passes the session PKCE verifier/state to authorizationCodeGrant', async () => {
    const request = makeRequest()
    await handleCallback(request, makeReply())

    const oidc = await import('openid-client')
    expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
      fakeConfig,
      expect.any(URL),
      { pkceCodeVerifier: 'test-verifier', expectedState: 'test-state' },
    )
    const [, url] = vi.mocked(oidc.authorizationCodeGrant).mock.calls[0]
    expect((url as URL).href).toBe('https://local.dsde-dev.broadinstitute.org:3000/auth/callback?code=test-code&state=test-state')
  })

  it('stores tokens, userId, and computed tokenExpiry in the session, and clears the PKCE fields', async () => {
    const request = makeRequest()
    const before = Math.floor(Date.now() / 1000)

    await handleCallback(request, makeReply())

    expect(request.session.accessToken).toBe('test-access-token')
    expect(request.session.refreshToken).toBe('test-refresh-token')
    expect(request.session.idToken).toBe('test-id-token')
    expect(request.session.userId).toBe('user@example.com')
    expect(request.session.tokenExpiry).toBeGreaterThanOrEqual(before + 3600)
    expect(request.session.tokenExpiry).toBeLessThanOrEqual(before + 3600 + 5)
    expect(request.session.pkceVerifier).toBeUndefined()
    expect(request.session.pkceState).toBeUndefined()
  })

  it('falls back to 0 for tokenExpiry when expiresIn() is undefined', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens({ email: 'user@example.com' }, { expiresIn: undefined }))
    const request = makeRequest()
    const before = Math.floor(Date.now() / 1000)

    await handleCallback(request, makeReply())

    expect(request.session.tokenExpiry).toBeGreaterThanOrEqual(before)
    expect(request.session.tokenExpiry).toBeLessThanOrEqual(before + 5)
  })

  it('derives idp=\'google\' when the B2C idp claim is google.com', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens({ email: 'user@example.com', idp: 'google.com' }))
    const request = makeRequest()

    await handleCallback(request, makeReply())

    expect(request.session.idp).toBe('google')
  })

  it('derives idp=\'microsoft\' when the idp claim is absent', async () => {
    const request = makeRequest()

    await handleCallback(request, makeReply())

    expect(request.session.idp).toBe('microsoft')
  })

  it('responds 400 token_missing_email_claim when the id_token has no email claim', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens({ sub: 'abc123' }))
    const reply = makeReply()

    await handleCallback(makeRequest(), reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({ error: 'token_missing_email_claim' })
    expect(reply.redirect).not.toHaveBeenCalled()
  })

  it('responds 400 token_missing_email_claim when there is no id_token at all', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens(undefined))
    const reply = makeReply()

    await handleCallback(makeRequest(), reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({ error: 'token_missing_email_claim' })
  })

  it('redirects to the session returnTo when set', async () => {
    const reply = makeReply()

    await handleCallback(makeRequest({ returnTo: '/datalibrary?filter=x' }), reply)

    expect(reply.redirect).toHaveBeenCalledWith('/datalibrary?filter=x')
  })

  it('redirects to / when returnTo is not set', async () => {
    const reply = makeReply()

    await handleCallback(makeRequest(), reply)

    expect(reply.redirect).toHaveBeenCalledWith('/')
  })

  it('persists the session before redirecting (guards the ERR_HTTP_HEADERS_SENT double-send fix)', async () => {
    const request = makeRequest()
    const reply = makeReply()

    await handleCallback(request, reply)

    // Saving before responding makes @fastify/session's onSend save synchronous,
    // so Fastify does not fire a second reply.send(). If the save moves after
    // the redirect (or is removed), the async onSend race returns.
    const save = vi.mocked(request.session.save as () => Promise<void>)
    expect(save).toHaveBeenCalled()
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(reply.redirect.mock.invocationCallOrder[0])
  })

  describe('session fixation protection (story 5-C)', () => {
    it('rotates the session before writing tokens, and saves before destroying the old row', async () => {
      const request = makeRequest()
      const reply = makeReply()

      await handleCallback(request, reply)

      // Tokens survived makeRequest's field-clearing regenerate() emulation,
      // so the handler wrote them AFTER the rotation.
      const regenerate = vi.mocked(request.session.regenerate as () => Promise<void>)
      expect(regenerate).toHaveBeenCalledOnce()
      expect(request.session.accessToken).toBe('test-access-token')
      expect(request.session.userId).toBe('user@example.com')

      // Order: regenerate → save → destroy → redirect. Once save() succeeds
      // the login has succeeded; destroy is cleanup of the pre-auth row.
      const save = vi.mocked(request.session.save as () => Promise<void>)
      const destroy = vi.mocked(request.sessionStore.destroy)
      expect(regenerate.mock.invocationCallOrder[0]).toBeLessThan(save.mock.invocationCallOrder[0])
      expect(save.mock.invocationCallOrder[0]).toBeLessThan(destroy.mock.invocationCallOrder[0])
      expect(destroy.mock.invocationCallOrder[0]).toBeLessThan(reply.redirect.mock.invocationCallOrder[0])
    })

    it('destroys the PRE-AUTH sid via the session store, not the new session', async () => {
      const request = makeRequest()

      await handleCallback(request, makeReply())

      expect(request.sessionStore.destroy).toHaveBeenCalledWith('pre-auth-sid', expect.any(Function))
      expect(request.session.sessionId).toBe('post-auth-sid')
    })

    it('logs but does not fail the login when destroying the pre-auth row errors', async () => {
      const request = makeRequest({ destroyError: new Error('pg down'), returnTo: '/datalibrary' })
      const reply = makeReply()

      await handleCallback(request, reply)

      expect(request.log.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        expect.stringContaining('destroy'),
      )
      expect(reply.redirect).toHaveBeenCalledWith('/datalibrary')
    })

    it('redirects to the returnTo captured BEFORE rotation (the field dies with the pre-auth session)', async () => {
      // makeRequest's regenerate() emulation deletes returnTo, so this passes
      // only when the handler captures it before rotating.
      const reply = makeReply()

      await handleCallback(makeRequest({ returnTo: '/datalibrary?filter=x' }), reply)

      expect(reply.redirect).toHaveBeenCalledWith('/datalibrary?filter=x')
    })
  })

  it('rejects with an error naming DUOS_OAUTH_REDIRECT_URI when it is unset', async () => {
    delete process.env.DUOS_OAUTH_REDIRECT_URI

    await expect(handleCallback(makeRequest(), makeReply())).rejects.toThrow('DUOS_OAUTH_REDIRECT_URI')
  })
})
