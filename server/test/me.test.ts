import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getMe } from '../src/auth/me.js'

const ENV = { DUOS_API_URL: 'https://consent.dsde-dev.broadinstitute.org' }

function makeRequest(overrides: { accessToken?: string, idp?: 'google' | 'microsoft' } = {}) {
  const destroy = vi.fn().mockResolvedValue(undefined)
  const request = {
    session: { accessToken: overrides.accessToken, idp: overrides.idp, destroy },
  }
  return { request: request as unknown as FastifyRequest, destroy }
}

function makeReply() {
  const reply = { status: vi.fn(), send: vi.fn() }
  reply.status.mockReturnValue(reply)
  return reply as unknown as FastifyReply & { status: ReturnType<typeof vi.fn>, send: ReturnType<typeof vi.fn> }
}

function makeFetchResponse(status: number, body: unknown) {
  return { status, json: vi.fn().mockResolvedValue(body) }
}

describe('getMe', () => {
  beforeEach(() => {
    Object.assign(process.env, ENV)
    vi.stubGlobal('fetch', vi.fn())
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
      { headers: { Authorization: 'Bearer test-access-token' } },
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

  it('destroys the session and returns 401 when the upstream API rejects the token', async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(401, {}) as never)
    const { request, destroy } = makeRequest({ accessToken: 'stale-access-token' })
    const reply = makeReply()

    await getMe(request, reply)

    expect(destroy).toHaveBeenCalled()
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ authenticated: false })
  })

  it('rejects with an error naming DUOS_API_URL when it is unset', async () => {
    delete process.env.DUOS_API_URL
    const { request } = makeRequest({ accessToken: 'test-access-token' })

    await expect(getMe(request, makeReply())).rejects.toThrow('DUOS_API_URL')
    expect(fetch).not.toHaveBeenCalled()
  })
})
