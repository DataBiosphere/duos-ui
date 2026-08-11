import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FeatureFlag,
  getAllFeatureFlags,
  getFeatureFlag,
  getFlagNhgriDacId,
  resetNhgriDacIdPromise,
} from 'src/libs/ajax/FeatureFlag'
import { Config } from 'src/libs/config'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const consentUrl = 'https://consent.example.test'

describe('FeatureFlag ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // /feature is unauthenticated and pre-login, so it stays on the absolute
    // Consent URL rather than the BFF proxy
    vi.spyOn(Config, 'getConsentApiUrl').mockResolvedValue(consentUrl)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllFeatureFlags', () => {
    it('returns a map of flags', async () => {
      const response = { featureAlpha: 'on', featureBeta: 'off' }
      vi.mocked(fetchGet).mockResolvedValue({ data: response } as FetchData<typeof response>)

      const result = await getAllFeatureFlags()

      expect(result).toEqual(response)
      expect(fetchGet).toHaveBeenCalledWith(`${consentUrl}/feature`)
    })
  })

  describe('getFeatureFlag', () => {
    it('returns the per-key value when available', async () => {
      const mockFlag: FeatureFlag = { id: 'someFlag', value: 'enabled', createDate: 123, updateDate: 456 }
      vi.mocked(fetchGet).mockResolvedValue({ data: mockFlag } as FetchData<FeatureFlag>)

      const result = await getFeatureFlag('someFlag')

      expect(result).toEqual(mockFlag)
      expect(fetchGet).toHaveBeenCalledWith(`${consentUrl}/feature/someFlag`)
    })

    it('returns undefined when per-key endpoint errors', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Not found'))

      const result = await getFeatureFlag('missingFlag')

      expect(result).toBeUndefined()
    })
  })

  describe('getFlagNhgriDacId', () => {
    const mockFlag: FeatureFlag = { id: 'NHGRI_RESTRICTED_DAC', value: 'dac-id', createDate: 123, updateDate: 456 }

    beforeEach(() => {
      resetNhgriDacIdPromise()
    })

    it('returns the value when available', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockFlag } as FetchData<FeatureFlag>)

      const result = await getFlagNhgriDacId()

      expect(result).toBe('dac-id')
    })

    it('returns undefined when the flag fetch errors', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Not found'))

      const result = await getFlagNhgriDacId()

      expect(result).toBeUndefined()
    })

    it('caches the promise and does not refetch on subsequent calls', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockFlag } as FetchData<FeatureFlag>)

      await getFlagNhgriDacId()
      await getFlagNhgriDacId()

      expect(fetchGet).toHaveBeenCalledOnce()
    })
  })
})
