import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isBffEnabled } from '../src/featureFlags'

const API_URL = 'https://consent.example.org'
const log = { warn: vi.fn() }

function mockFetchOnce(response: { ok: boolean, json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn(async () => response))
}

describe('isBffEnabled', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    log.warn.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false and warns when no API URL is configured', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ value: 'true' }) })
    expect(await isBffEnabled(log, undefined)).toBe(false)
    expect(log.warn).toHaveBeenCalledTimes(1)
  })

  it('returns true when the flag value is the string "true"', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ id: 'BFF_ENABLED', value: 'true', createDate: 0, updateDate: 0 }) })
    expect(await isBffEnabled(log, API_URL)).toBe(true)
    expect(log.warn).not.toHaveBeenCalled()
  })

  it('returns false when the flag value is "false"', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ id: 'BFF_ENABLED', value: 'false', createDate: 0, updateDate: 0 }) })
    expect(await isBffEnabled(log, API_URL)).toBe(false)
  })

  it('returns false and warns on a non-2xx response (e.g. the flag does not exist yet)', async () => {
    mockFetchOnce({ ok: false })
    expect(await isBffEnabled(log, API_URL)).toBe(false)
    expect(log.warn).toHaveBeenCalledTimes(1)
  })

  it('returns false and warns when the request throws (e.g. network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network error')
    }))
    expect(await isBffEnabled(log, API_URL)).toBe(false)
    expect(log.warn).toHaveBeenCalledTimes(1)
  })

  it('queries the feature flag endpoint for BFF_ENABLED with a bounded timeout', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ value: 'true' }) }))
    vi.stubGlobal('fetch', fetchMock)
    await isBffEnabled(log, API_URL)
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/feature/BFF_ENABLED`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })
})
