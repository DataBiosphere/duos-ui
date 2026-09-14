import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CSRF_ERROR_CODE, CsrfTokenSessionExpiredError, getCsrfToken, isCsrfRejection, resetCsrfToken } from 'src/libs/ajax/csrf'

describe('csrf', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // The token cache is module-level — clear it so tests are independent
    resetCsrfToken()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const tokenResponse = (token: string) => ({
    ok: true,
    json: () => Promise.resolve({ token }),
  })

  it('fetches the token from /auth/csrf-token with credentials', async () => {
    fetchMock.mockResolvedValue(tokenResponse('csrf-abc'))

    expect(await getCsrfToken()).toBe('csrf-abc')
    expect(fetchMock).toHaveBeenCalledWith('/auth/csrf-token', { credentials: 'include' })
  })

  it('caches the token across calls', async () => {
    fetchMock.mockResolvedValue(tokenResponse('csrf-abc'))

    expect(await getCsrfToken()).toBe('csrf-abc')
    expect(await getCsrfToken()).toBe('csrf-abc')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shares one request between concurrent callers', async () => {
    fetchMock.mockResolvedValue(tokenResponse('csrf-abc'))

    const [first, second] = await Promise.all([getCsrfToken(), getCsrfToken()])

    expect(first).toBe('csrf-abc')
    expect(second).toBe('csrf-abc')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resetCsrfToken forces a refetch', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('csrf-one'))
      .mockResolvedValueOnce(tokenResponse('csrf-two'))

    expect(await getCsrfToken()).toBe('csrf-one')
    resetCsrfToken()
    expect(await getCsrfToken()).toBe('csrf-two')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not cache network failures', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(tokenResponse('csrf-after-recovery'))

    await expect(getCsrfToken()).rejects.toThrow('network down')
    expect(await getCsrfToken()).toBe('csrf-after-recovery')
  })

  it('rejects on a non-ok response without caching it', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce(tokenResponse('csrf-after-recovery'))

    await expect(getCsrfToken()).rejects.toThrow('500')
    expect(await getCsrfToken()).toBe('csrf-after-recovery')
  })

  // /auth/csrf-token is gated on an authenticated session (story 5-B), so its
  // 401 is a session-expired signal, not a generic failure — the adapter keys
  // its redirect handling on this type.
  it('throws the typed session-expired error on a 401, without caching it', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'unauthenticated' }) })
      .mockResolvedValueOnce(tokenResponse('csrf-after-login'))

    await expect(getCsrfToken()).rejects.toBeInstanceOf(CsrfTokenSessionExpiredError)
    expect(await getCsrfToken()).toBe('csrf-after-login')
  })

  it('does not use the typed error for other non-ok statuses', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: () => Promise.resolve({}) })

    const failure = await getCsrfToken().catch((e: unknown) => e)

    expect(failure).toBeInstanceOf(Error)
    expect(failure).not.toBeInstanceOf(CsrfTokenSessionExpiredError)
  })

  describe('isCsrfRejection', () => {
    const response = (body: string, status: number) =>
      new Response(body, { status, headers: { 'content-type': 'application/json' } })

    it('recognizes the BFF rejection body on a 403', async () => {
      expect(await isCsrfRejection(response(JSON.stringify({ error: CSRF_ERROR_CODE, reason: 'missing_secret' }), 403))).toBe(true)
    })

    it('does not match an ordinary 403 (upstream authorization denial)', async () => {
      expect(await isCsrfRejection(response(JSON.stringify({ message: 'Forbidden' }), 403))).toBe(false)
    })

    it('does not match other statuses even with the code in the body', async () => {
      expect(await isCsrfRejection(response(JSON.stringify({ error: CSRF_ERROR_CODE }), 401))).toBe(false)
    })

    it('does not match a non-JSON 403 body', async () => {
      expect(await isCsrfRejection(response('Forbidden', 403))).toBe(false)
    })

    it('leaves the response body readable for the caller', async () => {
      const res = response(JSON.stringify({ message: 'Forbidden' }), 403)
      await isCsrfRejection(res)
      expect(await res.json()).toEqual({ message: 'Forbidden' })
    })
  })
})
