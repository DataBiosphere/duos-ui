import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  return { ...actual, tokenRevocation: vi.fn() }
})

function makeConfig(revocationEndpoint?: string): Configuration {
  return { serverMetadata: () => ({ revocation_endpoint: revocationEndpoint }) } as unknown as Configuration
}

function makeRequest(overrides: {
  accessToken?: string
  refreshToken?: string
  sessionId?: string
} = {}) {
  const query = vi.fn().mockResolvedValue({ rows: [] })
  const destroy = vi.fn().mockResolvedValue(undefined)
  const request = {
    session: {
      accessToken: overrides.accessToken,
      refreshToken: overrides.refreshToken,
      sessionId: overrides.sessionId ?? 'test-sid',
      destroy,
    },
    server: { pg: { query } },
  }
  return { request: request as unknown as FastifyRequest, query, destroy }
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

describe('handleLogout', () => {
  beforeEach(async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(makeConfig(undefined))

    const oidc = await import('openid-client')
    vi.mocked(oidc.tokenRevocation).mockReset().mockResolvedValue(undefined)
  })

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
