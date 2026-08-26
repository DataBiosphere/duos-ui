import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getMe } from '../src/auth/me.js'
import { RefreshFailedError, refreshAccessToken } from '../src/auth/refresh.js'

// refreshAccessToken is replaced so the tests never reach B2C; RefreshFailedError
// stays the real class so the instanceof branch is exercised rather than stubbed.
vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

const ENV = { DUOS_API_URL: 'https://consent.dsde-dev.broadinstitute.org' }

// A default expiry comfortably outside the refresh window, so pre-existing
// tests exercise the forward path untouched.
const FRESH_EXPIRY = () => Math.floor(Date.now() / 1000) + 3600

function makeRequest(overrides: { accessToken?: string, idp?: 'google' | 'microsoft', tokenExpiry?: number } = {}) {
  const destroy = vi.fn().mockResolvedValue(undefined)
  const request = {
    session: {
      accessToken: overrides.accessToken,
      idp: overrides.idp,
      tokenExpiry: overrides.tokenExpiry ?? FRESH_EXPIRY(),
      destroy,
    },
    log: { error: vi.fn(), info: vi.fn() },
  }
  return { request: request as unknown as FastifyRequest, destroy }
}

function makeReply() {
  const reply = { clearCookie: vi.fn(), status: vi.fn(), send: vi.fn(), header: vi.fn() }
  reply.clearCookie.mockReturnValue(reply)
  reply.status.mockReturnValue(reply)
  reply.header.mockReturnValue(reply)
  return reply as unknown as FastifyReply & {
    clearCookie: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    header: ReturnType<typeof vi.fn>
  }
}

function makeFetchResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: vi.fn().mockResolvedValue(body) }
}

describe('getMe', () => {
  beforeEach(() => {
    Object.assign(process.env, ENV)
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    for (const key of Object.keys(ENV)) delete process.env[key]
    vi.unstubAllGlobals()
  })

  it('returns 401 without calling the upstream API when there is no access token', async () => {
    const { request } = makeRequest()
    const reply = makeReply()

    await getMe(request, reply)

    expect(fetch).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false })
  })

  it('calls the upstream /api/user/me with a Bearer token from the session', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, { email: 'user@example.com' }) as never)
    const { request } = makeRequest({ accessToken: 'test-access-token' })

    await getMe(request, makeReply())

    expect(fetch).toHaveBeenCalledWith(
      `${ENV.DUOS_API_URL}/api/user/me`,
      {
        headers: {
          'Authorization': 'Bearer test-access-token',
          'Accept': 'application/json',
          'X-App-ID': 'DUOS',
        },
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('returns the user profile and idp on success', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, { email: 'user@example.com' }) as never)
    const { request } = makeRequest({ accessToken: 'test-access-token', idp: 'google' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(reply.send).toHaveBeenCalledWith({
      authenticated: true,
      user: { email: 'user@example.com' },
      idp: 'google',
    })
  })

  it('destroys the session on an upstream 401', async () => {
    // A registered user's token revoked mid-lifetime forwards (no refresh due)
    // and 401s. Answering "authenticated, no user" here sent the client into
    // re-registering an existing account; the terminal 401 is the honest end.
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(401, {}) as never)
    const { request, destroy } = makeRequest({ accessToken: 'fresh-access-token', idp: 'google' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).toHaveBeenCalledOnce()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false })
  })

  it('still answers 401 when the rejected session cannot be destroyed', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(401, {}) as never)
    const { request, destroy } = makeRequest({ accessToken: 'fresh-access-token' })
    destroy.mockRejectedValue(new Error('store unavailable'))
    const reply = makeReply()

    await getMe(request, reply)

    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false })
  })

  it('marks every answer uncacheable — the profile must never be replayed across sessions', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, { email: 'user@example.com' }) as never)
    const { request } = makeRequest({ accessToken: 'test-access-token', idp: 'google' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(reply.header).toHaveBeenCalledWith('cache-control', 'no-store')
    expect(reply.header).toHaveBeenCalledWith('vary', 'Cookie')
  })

  it('marks the unauthenticated answer uncacheable too', async () => {
    const { request } = makeRequest({})
    const reply = makeReply()

    await getMe(request, reply)

    expect(reply.header).toHaveBeenCalledWith('cache-control', 'no-store')
  })

  it('forwards the upstream 409 message and destroys the session — a Sam sub-provider conflict cannot be registered through', async () => {
    const message = 'Email: user@example.com. You may have previously signed in with a different authentication provider (Google or Microsoft). Please sign in with that provider.'
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(409, { message, code: 409 }) as never)
    const { request, destroy } = makeRequest({ accessToken: 'fresh-access-token', idp: 'microsoft' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).toHaveBeenCalledOnce()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(409)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false, error: 'provider_conflict', message })
  })

  it('answers the 409 with a fallback message when the upstream body is unusable', async () => {
    const badBody = { status: 409, ok: false, json: vi.fn().mockRejectedValue(new Error('invalid JSON')) }
    vi.mocked(fetch).mockResolvedValue(badBody as never)
    const { request, destroy } = makeRequest({ accessToken: 'fresh-access-token' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).toHaveBeenCalledOnce()
    expect(reply.status).toHaveBeenCalledWith(409)
    expect(reply.send).toHaveBeenCalledWith({
      authenticated: false,
      error: 'provider_conflict',
      message: expect.stringContaining('different authentication provider'),
    })
  })

  it('does not refresh when the access token is comfortably fresh', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, { email: 'user@example.com' }) as never)
    const { request } = makeRequest({ accessToken: 'fresh-token' })

    await getMe(request, makeReply())

    expect(refreshAccessToken).not.toHaveBeenCalled()
  })

  it('refreshes an expired access token before forwarding instead of letting the upstream 401 kill the session', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, { email: 'user@example.com' }) as never)
    const { request, destroy } = makeRequest({ accessToken: 'stale-token', tokenExpiry: 0 })
    // The real refreshAccessToken mutates the session in place.
    vi.mocked(refreshAccessToken).mockImplementation(async (req) => {
      req.session.accessToken = 'refreshed-token'
    })
    const reply = makeReply()

    await getMe(request, reply)

    expect(refreshAccessToken).toHaveBeenCalledOnce()
    expect(destroy).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer refreshed-token' }) }),
    )
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true }))
  })

  it('returns 401 and clears the cookie on a terminal refresh failure', async () => {
    const { request } = makeRequest({ accessToken: 'stale-token', tokenExpiry: 0 })
    vi.mocked(refreshAccessToken).mockRejectedValue(new RefreshFailedError('refresh_failed'))
    const reply = makeReply()

    await getMe(request, reply)

    expect(fetch).not.toHaveBeenCalled()
    expect(reply.clearCookie).toHaveBeenCalledWith('sessionId')
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false })
  })

  it('returns 502 without destroying the session on a transient refresh failure', async () => {
    const { request, destroy } = makeRequest({ accessToken: 'stale-token', tokenExpiry: 0 })
    vi.mocked(refreshAccessToken).mockRejectedValue(new TypeError('fetch failed'))
    const reply = makeReply()

    await getMe(request, reply)

    expect(fetch).not.toHaveBeenCalled()
    expect(destroy).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(502)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false, error: 'upstream_unavailable' })
  })

  it('reports authenticated with no user when the upstream has no profile yet (404 = unregistered)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(404, { message: 'Unable to find user' }) as never)
    const { request, destroy } = makeRequest({ accessToken: 'test-access-token', idp: 'microsoft' })
    const reply = makeReply()

    await getMe(request, reply)

    // The session is valid; the client's post-sign-in bootstrap needs
    // authenticated:true (with user absent) to reach its registration flow.
    expect(destroy).not.toHaveBeenCalled()
    expect(reply.status).not.toHaveBeenCalledWith(502)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: true, idp: 'microsoft' })
  })

  it('returns 502 without destroying the session when the upstream API errors with an unmapped status', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(503, {}) as never)
    const { request, destroy } = makeRequest({ accessToken: 'test-access-token' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(502)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false, error: 'upstream_unavailable' })
  })

  it('returns 502 without destroying the session when the upstream fetch rejects (network failure or timeout)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('the operation was aborted'))
    const { request, destroy } = makeRequest({ accessToken: 'test-access-token' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(502)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false, error: 'upstream_unavailable' })
  })

  it('returns 502 without destroying the session when the upstream body fails to parse as JSON', async () => {
    const badBody = { status: 200, ok: true, json: vi.fn().mockRejectedValue(new Error('invalid JSON')) }
    vi.mocked(fetch).mockResolvedValue(badBody as never)
    const { request, destroy } = makeRequest({ accessToken: 'test-access-token' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).not.toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(502)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false, error: 'upstream_unavailable' })
  })

  it('rejects with an error naming DUOS_API_URL when it is unset', async () => {
    delete process.env.DUOS_API_URL
    const { request } = makeRequest({ accessToken: 'test-access-token' })

    await expect(getMe(request, makeReply())).rejects.toThrow('DUOS_API_URL')
    expect(fetch).not.toHaveBeenCalled()
  })
})
