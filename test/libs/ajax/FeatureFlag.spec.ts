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

const authHeaders = { headers: { Authorization: 'Bearer test' } } as ReturnType<typeof Config.authOpts>

const CONSENT = 'https://consent.dsde-dev.broadinstitute.org'

describe('FeatureFlag ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getUpstreamApiUrl').mockResolvedValue('')
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
    vi.spyOn(Config, 'authOpts').mockReturnValue(authHeaders)
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
      expect(fetchGet).toHaveBeenCalledWith('/feature', authHeaders)
    })
  })

  describe('getFeatureFlag', () => {
    it('returns the per-key value when available', async () => {
      const mockFlag: FeatureFlag = { id: 'someFlag', value: 'enabled', createDate: 123, updateDate: 456 }
      vi.mocked(fetchGet).mockResolvedValue({ data: mockFlag } as FetchData<FeatureFlag>)

      const result = await getFeatureFlag('someFlag')

      expect(result).toEqual(mockFlag)
      expect(fetchGet).toHaveBeenCalledWith('/feature/someFlag', authHeaders)
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

  /**
   * These four cases are the only proof the client and server halves of story
   * 5-F6 line up: nothing in src/ calls this module, so no test that exercises
   * the app can reach either URL. The paths asserted here must match the routes
   * server/src/proxy/publicProxy.ts registers.
   */
  describe('URL selection', () => {
    it('calls the absolute Consent URL in legacy mode, which is what the legacy client has always done', async () => {
      vi.spyOn(Config, 'getUpstreamApiUrl').mockResolvedValue(CONSENT)
      vi.mocked(fetchGet).mockResolvedValue({ data: {} } as FetchData<object>)

      await getAllFeatureFlags()

      expect(fetchGet).toHaveBeenCalledWith(`${CONSENT}/feature`, authHeaders)
    })

    it('calls the public BFF endpoint under bffEnabled, so the read is same-origin and needs no connect-src entry', async () => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
      vi.mocked(fetchGet).mockResolvedValue({ data: {} } as FetchData<object>)

      await getAllFeatureFlags()

      expect(fetchGet).toHaveBeenCalledWith('/public/features', authHeaders)
    })

    it('reads a single flag through the same public endpoint', async () => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
      vi.mocked(fetchGet).mockResolvedValue({ data: undefined } as unknown as FetchData<FeatureFlag>)

      await getFeatureFlag('NHGRI_RESTRICTED_DAC')

      expect(fetchGet).toHaveBeenCalledWith('/public/features/NHGRI_RESTRICTED_DAC', authHeaders)
    })

    it('never reaches the session-guarded /duos-api proxy, which would 401 a pre-login read', async () => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
      vi.mocked(fetchGet).mockResolvedValue({ data: {} } as FetchData<object>)

      await getAllFeatureFlags()

      expect(vi.mocked(fetchGet).mock.calls[0][0]).not.toContain('/duos-api')
    })
  })
})
