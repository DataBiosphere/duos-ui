import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCsrfToken, resetCsrfToken } from 'src/libs/ajax/csrf'

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
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce(tokenResponse('csrf-after-login'))

    await expect(getCsrfToken()).rejects.toThrow('401')
    expect(await getCsrfToken()).toBe('csrf-after-login')
  })
})
