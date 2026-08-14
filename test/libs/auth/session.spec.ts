import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSessionInfo, resetSessionCache, revalidateSessionInfo, userIsLogged } from 'src/libs/auth/session'
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

  it('returns unauthenticated on 401 and caches it — "no session" is a real answer', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), { status: 401 }),
    )

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns unauthenticated on upstream outage (502) but retries on the next ask', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: false, error: 'upstream_unavailable' }), { status: 502 }),
    )
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: true, idp: 'google' }), { status: 200 }),
    )

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })

    // The outage was transient — the next ask must not be pinned signed-out.
    const recovered = await getSessionInfo()
    expect(recovered.authenticated).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns unauthenticated on network failure but retries on the next ask', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
    )

    await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })

    const recovered = await getSessionInfo()
    expect(recovered.authenticated).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
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

  it('expires the cached answer after the TTL — an 8h session can die under a long-lived tab', async () => {
    vi.useFakeTimers()
    try {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
      )

      await getSessionInfo()
      vi.advanceTimersByTime(4 * 60 * 1000)
      await getSessionInfo()
      expect(fetchMock).toHaveBeenCalledTimes(1) // within TTL — cached

      vi.advanceTimersByTime(2 * 60 * 1000)
      await getSessionInfo()
      expect(fetchMock).toHaveBeenCalledTimes(2) // past TTL — re-probed
    }
    finally {
      vi.useRealTimers()
    }
  })

  describe('revalidateSessionInfo', () => {
    it('drops the cache and probes fresh — another tab may have signed in or out', async () => {
      vi.useFakeTimers()
      try {
        fetchMock.mockResolvedValueOnce(
          new Response(JSON.stringify({ authenticated: false }), { status: 401 }),
        )
        fetchMock.mockResolvedValueOnce(
          new Response(JSON.stringify({ authenticated: true, idp: 'microsoft' }), { status: 200 }),
        )

        await expect(getSessionInfo()).resolves.toEqual({ authenticated: false })

        vi.advanceTimersByTime(10 * 1000)
        const revalidated = await revalidateSessionInfo()

        expect(revalidated.authenticated).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(2)
      }
      finally {
        vi.useRealTimers()
      }
    })

    it('throttles bursts — simultaneous revalidations share one probe', async () => {
      vi.useFakeTimers()
      try {
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
        )

        await getSessionInfo()
        vi.advanceTimersByTime(10 * 1000)
        // A focus event fans out to every mounted hook; only the first re-probes.
        await Promise.all([revalidateSessionInfo(), revalidateSessionInfo(), revalidateSessionInfo()])

        expect(fetchMock).toHaveBeenCalledTimes(2)
      }
      finally {
        vi.useRealTimers()
      }
    })
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

    it('re-reads legacy state on every call — no stale cache after a popup or background sign-in', async () => {
      const legacyCheck = vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await expect(userIsLogged()).resolves.toBe(false)

      // The popup flow and /backgroundsignin mutate localStorage without a
      // page load; the next ask must see it.
      legacyCheck.mockReturnValue(true)

      await expect(userIsLogged()).resolves.toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
