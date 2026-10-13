import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { DatasetStatisticsDar } from 'src/types/model'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const buildDar = (darCode: string): DatasetStatisticsDar => ({
  updateDate: 1700000000000,
  projectTitle: `Project ${darCode}`,
  darCode,
  nonTechRus: `Summary for ${darCode}`,
  referenceId: `ref-${darCode}`,
  expired: false,
})

describe('DatasetMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: [] })
  })

  describe('getDatasetStats', () => {
    it('gets from the dar-summaries endpoint with auth options and returns the data', async () => {
      const dars = [buildDar('DAR-1'), buildDar('DAR-2')]
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: dars })

      const result = await DatasetMetrics.getDatasetStats(123)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/metrics/dar-summaries/123',
        headers,
      )
      expect(result).toEqual(dars)
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))

      await expect(DatasetMetrics.getDatasetStats(123)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 123 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await DatasetMetrics.getDatasetStats(123).then(
        () => {
          throw new Error('expected getDatasetStats to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 123 not found')
    })
  })

  describe('getStudyStats', () => {
    it('requests the study-scoped DAR summaries', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: [] })

      await DatasetMetrics.getStudyStats(42)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/metrics/dar-summaries/study/42',
        headers,
      )
    })

    it('returns the summaries the endpoint sends', async () => {
      const summaries = [buildDar('DAR-001'), buildDar('DAR-002')]
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: summaries })

      expect(await DatasetMetrics.getStudyStats(42)).toEqual(summaries)
    })

    /** The study page distinguishes a refusal from a fault, so the status has to survive. */
    it('propagates a rejection with its status intact', async () => {
      const forbidden = Object.assign(new Error('User does not have permission'), {
        response: { status: 403 },
      })
      vi.mocked(fetchGet).mockRejectedValueOnce(forbidden)

      await expect(DatasetMetrics.getStudyStats(42)).rejects.toMatchObject({
        response: { status: 403 },
      })
    })
  })

  describe('getResearchOutputs', () => {
    it('requests the study-scoped research outputs', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: { presentations: [], publications: [], intellectualProperties: [] },
      })

      await DatasetMetrics.getResearchOutputs(42)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/metrics/research-outputs/study/42',
        headers,
      )
    })

    it('returns the three grouped lists as sent', async () => {
      const outputs = {
        presentations: [{ title: 'A talk', url: 'https://example.org/talk' }],
        publications: [{ title: 'A paper', url: '' }],
        intellectualProperties: [],
      }
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: outputs })

      expect(await DatasetMetrics.getResearchOutputs(42)).toEqual(outputs)
    })

    it('propagates a failure rather than returning empty groups', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('outputs unavailable'))

      await expect(DatasetMetrics.getResearchOutputs(42)).rejects.toThrow('outputs unavailable')
    })
  })
})
