import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSessionInfo, resetSessionCache, userIsLogged } from 'src/libs/auth/session'
import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'

vi.mock('src/libs/config', async importOriginal => ({
  ...(await importOriginal<typeof import('src/libs/config')>()),
  Config: {
    isBffEnabled: vi.fn(),
  },
}))

describe('session probe', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(Config.isBffEnabled).mockResolvedValue(true)
    resetSessionCache()
  })

  afterEach(() => {
    resetSessionCache()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
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

  it('returns unauthenticated when the config lookup itself fails', async () => {
    vi.mocked(Config.isBffEnabled).mockRejectedValue(new Error('config unavailable'))

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
    expect(fetchMock).not.toHaveBeenCalled()
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

  it('userIsLogged reflects the probe result', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
    )

    await expect(userIsLogged()).resolves.toBe(true)
  })

  describe('legacy mode (BFF disabled)', () => {
    beforeEach(() => {
      vi.mocked(Config.isBffEnabled).mockResolvedValue(false)
    })

    it('derives auth state from the legacy localStorage token, never calling /auth/me', async () => {
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)

      await expect(getSessionInfo()).resolves.toEqual({ authenticated: true })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('reports signed out when the legacy token is absent or expired', async () => {
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await expect(userIsLogged()).resolves.toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
