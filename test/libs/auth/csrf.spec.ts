import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CSRF_HEADER, getCsrfToken, resetCsrfToken } from 'src/libs/auth/csrf'

describe('csrf token cache', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    resetCsrfToken()
  })

  afterEach(() => {
    resetCsrfToken()
    vi.unstubAllGlobals()
  })

  it('fetches the token from /auth/csrf-token', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok-1' }), { status: 200 }),
    )

    await expect(getCsrfToken()).resolves.toBe('tok-1')
    expect(fetchMock).toHaveBeenCalledWith('/auth/csrf-token', { credentials: 'include' })
  })

  it('caches the token across calls', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok-1' }), { status: 200 }),
    )

    await getCsrfToken()
    await getCsrfToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refetches after resetCsrfToken', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'tok-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'tok-2' }), { status: 200 }))

    await expect(getCsrfToken()).resolves.toBe('tok-1')
    resetCsrfToken()
    await expect(getCsrfToken()).resolves.toBe('tok-2')
  })

  it('exports the single header spelling the BFF reads', () => {
    expect(CSRF_HEADER).toBe('X-CSRF-Token')
  })
})
