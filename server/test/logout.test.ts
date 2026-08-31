import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Configuration } from 'openid-client'
import { handleLogout } from '../src/auth/logout.js'

// Mock getOidcConfig() (network) — tokenRevocation() is also mocked since it
// would otherwise perform a real network call.
vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return { ...actual, getOidcConfig: vi.fn() }
})

vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return { ...actual, tokenRevocation: vi.fn(), buildEndSessionUrl: vi.fn() }
})

function makeConfig(revocationEndpoint?: string): Configuration {
  return { serverMetadata: () => ({ revocation_endpoint: revocationEndpoint }) } as unknown as Configuration
}

function makeRequest(overrides: {
  accessToken?: string
  refreshToken?: string
  sessionId?: string
  idToken?: string
} = {}) {
  const query = vi.fn().mockResolvedValue({ rows: [] })
  const destroy = vi.fn().mockResolvedValue(undefined)
  const logError = vi.fn()
  const request = {
    session: {
      accessToken: overrides.accessToken,
      refreshToken: overrides.refreshToken,
      idToken: overrides.idToken,
      sessionId: overrides.sessionId ?? 'test-sid',
      destroy,
    },
    server: { pg: { query } },
    log: { error: logError },
  }
  return { request: request as unknown as FastifyRequest, query, destroy, logError }
}

function makeReply() {
  const reply = { clearCookie: vi.fn(), status: vi.fn(), send: vi.fn() }
  reply.clearCookie.mockReturnValue(reply)
  reply.status.mockReturnValue(reply)
  return reply as unknown as FastifyReply & {
    clearCookie: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

/*
  Both suites below need exactly this setup, so the hooks live at file level
  rather than being repeated per describe.
*/
beforeEach(async () => {
  const oidcClient = await import('../src/auth/oidcClient.js')
  vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(makeConfig(undefined))

  const oidc = await import('openid-client')
  vi.mocked(oidc.tokenRevocation).mockReset().mockResolvedValue(undefined)
  // Defaults to the happy path: B2C exposes an end_session_endpoint.
  vi.mocked(oidc.buildEndSessionUrl).mockReset().mockReturnValue(
    new URL('https://terradevb2c.b2clogin.com/logout?id_token_hint=the-id-token'),
  )
  process.env.DUOS_POST_LOGOUT_REDIRECT_URI = 'https://duos.example.org/post-logout'
  delete process.env.NODE_ENV
})

afterEach(() => {
  delete process.env.DUOS_POST_LOGOUT_REDIRECT_URI
  delete process.env.NODE_ENV
})

describe('handleLogout', () => {
  it('stamps the audit record for the session sid, destroys the session, and clears the cookie', async () => {
    const { request, query, destroy } = makeRequest({ sessionId: 'the-sid' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_session_audit'),
      ['the-sid'],
    )
    expect(query.mock.calls[0][0]).toContain('end_reason = \'logout\'')
    expect(query.mock.calls[0][0]).toContain('sid_hash = encode(sha256($1::bytea), \'hex\')')
    expect(destroy).toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(204)
    expect(reply.send).toHaveBeenCalled()
  })

  it('stamps the audit record before destroying the session', async () => {
    const { request, query, destroy } = makeRequest()

    await handleLogout(request, makeReply())

    const queryOrder = query.mock.invocationCallOrder[0]
    const destroyOrder = destroy.mock.invocationCallOrder[0]
    expect(queryOrder).toBeLessThan(destroyOrder)
  })

  it('does not attempt token revocation when B2C exposes no revocation_endpoint', async () => {
    const { request } = makeRequest({ accessToken: 'access', refreshToken: 'refresh' })

    await handleLogout(request, makeReply())

    const oidc = await import('openid-client')
    expect(oidc.tokenRevocation).not.toHaveBeenCalled()
  })

  it('revokes both access and refresh tokens when a revocation_endpoint is present', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockResolvedValue(makeConfig('https://duosdev.b2clogin.com/revoke'))
    const config = await oidcClient.getOidcConfig()
    const { request } = makeRequest({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    await handleLogout(request, makeReply())

    const oidc = await import('openid-client')
    expect(oidc.tokenRevocation).toHaveBeenCalledWith(config, 'access-token')
    expect(oidc.tokenRevocation).toHaveBeenCalledWith(config, 'refresh-token')
    expect(oidc.tokenRevocation).toHaveBeenCalledTimes(2)
  })

  it('skips revocation for tokens absent from the session', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockResolvedValue(makeConfig('https://duosdev.b2clogin.com/revoke'))
    const { request } = makeRequest({ accessToken: 'access-token' }) // no refreshToken

    await handleLogout(request, makeReply())

    const oidc = await import('openid-client')
    expect(oidc.tokenRevocation).toHaveBeenCalledTimes(1)
    expect(oidc.tokenRevocation).toHaveBeenCalledWith(expect.anything(), 'access-token')
  })

  it('completes logout even when token revocation rejects', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockResolvedValue(makeConfig('https://duosdev.b2clogin.com/revoke'))
    const oidc = await import('openid-client')
    vi.mocked(oidc.tokenRevocation).mockRejectedValue(new Error('revocation endpoint unreachable'))
    const { request, destroy } = makeRequest({ accessToken: 'access-token' })
    const reply = makeReply()

    await expect(handleLogout(request, reply)).resolves.toBeUndefined()

    expect(destroy).toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(204)
  })

  it('completes logout (session destroy, cookie clear) even when the audit UPDATE rejects', async () => {
    const { request, query, destroy } = makeRequest({ sessionId: 'the-sid' })
    query.mockRejectedValue(new Error('connection terminated unexpectedly'))
    const reply = makeReply()

    await expect(handleLogout(request, reply)).resolves.toBeUndefined()

    expect(query).toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(204)
  })

  it('completes logout (audit stamp, session destroy, cookie clear) even when getOidcConfig() rejects', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockRejectedValue(new Error('B2C discovery unreachable'))
    const { request, query, destroy } = makeRequest({ sessionId: 'the-sid' })
    const reply = makeReply()

    await expect(handleLogout(request, reply)).resolves.toBeUndefined()

    const oidc = await import('openid-client')
    expect(oidc.tokenRevocation).not.toHaveBeenCalled()
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE user_session_audit'), ['the-sid'])
    expect(destroy).toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(204)
  })
})

describe('handleLogout — front-channel (B2C) logout, story 5-E', () => {
  it('answers 200 with the discovered end-session URL when the session holds an id token', async () => {
    const { request, destroy } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    const oidc = await import('openid-client')
    expect(oidc.buildEndSessionUrl).toHaveBeenCalledWith(expect.anything(), {
      id_token_hint: 'the-id-token',
      post_logout_redirect_uri: 'https://duos.example.org/post-logout',
    })
    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith({
      redirectUrl: 'https://terradevb2c.b2clogin.com/logout?id_token_hint=the-id-token',
    })
    expect(destroy).toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
  })

  it('reads the id token BEFORE the session is destroyed', async () => {
    const { request, destroy } = makeRequest({ idToken: 'the-id-token' })

    await handleLogout(request, makeReply())

    const oidc = await import('openid-client')
    const buildOrder = vi.mocked(oidc.buildEndSessionUrl).mock.invocationCallOrder[0]
    expect(buildOrder).toBeLessThan(destroy.mock.invocationCallOrder[0])
  })

  it('answers 204 when the session holds no id token, without touching B2C', async () => {
    const { request, destroy } = makeRequest() // no idToken
    const reply = makeReply()

    await handleLogout(request, reply)

    const oidc = await import('openid-client')
    expect(oidc.buildEndSessionUrl).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(204)
    expect(destroy).toHaveBeenCalled()
  })

  it('answers 204 and still destroys the session when DUOS_POST_LOGOUT_REDIRECT_URI is unset', async () => {
    delete process.env.DUOS_POST_LOGOUT_REDIRECT_URI
    const { request, destroy, logError } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(reply.status).toHaveBeenCalledWith(204)
    expect(destroy).toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(logError).toHaveBeenCalled()
  })

  it('answers 204 and still destroys the session when buildEndSessionUrl throws (no end_session_endpoint)', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.buildEndSessionUrl).mockImplementation(() => {
      throw new TypeError('authorization server metadata does not contain end_session_endpoint')
    })
    const { request, destroy, logError } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(reply.status).toHaveBeenCalledWith(204)
    expect(destroy).toHaveBeenCalled()
    expect(logError).toHaveBeenCalled()
  })

  it('answers 204 and still destroys the session when discovery fails', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockRejectedValue(new Error('B2C discovery unreachable'))
    const { request, destroy } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(reply.status).toHaveBeenCalledWith(204)
    expect(destroy).toHaveBeenCalled()
  })

  it('rejects a non-HTTPS end-session URL in production and falls back to 204', async () => {
    process.env.NODE_ENV = 'production'
    const oidc = await import('openid-client')
    vi.mocked(oidc.buildEndSessionUrl).mockReturnValue(new URL('http://b2c.example.org/logout'))
    const { request, destroy, logError } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(reply.status).toHaveBeenCalledWith(204)
    expect(destroy).toHaveBeenCalled()
    expect(logError).toHaveBeenCalled()
  })

  it('allows a plain-HTTP end-session URL outside production (local development)', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.buildEndSessionUrl).mockReturnValue(new URL('http://localhost:9000/logout'))
    const { request } = makeRequest({ idToken: 'the-id-token' })
    const reply = makeReply()

    await handleLogout(request, reply)

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith({ redirectUrl: 'http://localhost:9000/logout' })
  })
})
