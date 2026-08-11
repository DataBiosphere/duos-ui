import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSessionInfo, resetSessionCache } from 'src/libs/auth/session'

describe('session probe', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    resetSessionCache()
  })

  afterEach(() => {
    resetSessionCache()
    vi.unstubAllGlobals()
  })

  it('returns the /auth/me payload when authenticated', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, idp: 'google', user: { userId: 1 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const info = await getSessionInfo()

    expect(fetchMock).toHaveBeenCalledWith('/auth/me', { credentials: 'include' })
    expect(info.authenticated).toBe(true)
    expect(info.idp).toBe('google')
  })

  it('returns unauthenticated on 401 without throwing', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), { status: 401 }),
    )

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
  })

  it('returns unauthenticated on upstream outage (502) without throwing', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false, error: 'upstream_unavailable' }), { status: 502 }),
    )

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
  })

  it('returns unauthenticated on network failure without throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'))

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
  })

  it('caches the probe per page load', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
    )

    await getSessionInfo()
    await getSessionInfo()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('probes again after resetSessionCache', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
    )

    await getSessionInfo()
    resetSessionCache()
    await getSessionInfo()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
