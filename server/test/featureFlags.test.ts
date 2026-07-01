import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isBffEnabled } from '../src/featureFlags'

const API_URL = 'https://consent.example.org'

function mockFetchOnce(response: { ok: boolean, json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn(async () => response))
}

describe('isBffEnabled', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when no API URL is configured', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ value: 'true' }) })
    expect(await isBffEnabled(undefined)).toBe(false)
  })

  it('returns true when the flag value is the string "true"', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ id: 'BFF_ENABLED', value: 'true', createDate: 0, updateDate: 0 }) })
    expect(await isBffEnabled(API_URL)).toBe(true)
  })

  it('returns false when the flag value is "false"', async () => {
    mockFetchOnce({ ok: true, json: async () => ({ id: 'BFF_ENABLED', value: 'false', createDate: 0, updateDate: 0 }) })
    expect(await isBffEnabled(API_URL)).toBe(false)
  })

  it('returns false on a non-2xx response (e.g. the flag does not exist yet)', async () => {
    mockFetchOnce({ ok: false })
    expect(await isBffEnabled(API_URL)).toBe(false)
  })

  it('returns false when the request throws (e.g. network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network error')
    }))
    expect(await isBffEnabled(API_URL)).toBe(false)
  })

  it('queries the feature flag endpoint for BFF_ENABLED', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ value: 'true' }) }))
    vi.stubGlobal('fetch', fetchMock)
    await isBffEnabled(API_URL)
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/feature/BFF_ENABLED`)
  })
})
