import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Match } from 'src/libs/ajax/Match'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'
import type { MatchResult } from 'src/types/model'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const matchResult: MatchResult = {
  consent: 'consent-001',
  match: true,
  abstain: false,
  algorithmVersion: 'v2',
  rationales: ['rationale A'],
  createDate: '2024-01-01',
  failed: false,
  id: 'match-001',
}

describe('Match', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(fetchGet).mockResolvedValue({ data: [matchResult] })
  })

  describe('findMatchBatch', () => {
    it('fetches match results for the given purpose IDs', async () => {
      const result = await Match.findMatchBatch(['ref-001', 'ref-002'])

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/match/purpose/batch',
        { params: { purposeIds: 'ref-001,ref-002' } },
      )
      expect(result).toEqual([matchResult])
    })

    it('deduplicates purpose IDs before sending the request', async () => {
      await Match.findMatchBatch(['ref-001', 'ref-001', 'ref-002'])

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/match/purpose/batch',
        { params: { purposeIds: 'ref-001,ref-002' } },
      )
    })

    it('uses an empty string for purposeIds when called with no arguments', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [] })

      const result = await Match.findMatchBatch()

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/match/purpose/batch',
        { params: { purposeIds: '' } },
      )
      expect(result).toEqual([])
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))

      await expect(Match.findMatchBatch(['ref-001'])).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Match lookup failed for purpose ref-001', code: 400 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await Match.findMatchBatch(['ref-001']).then(
        () => {
          throw new Error('expected findMatchBatch to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Match lookup failed for purpose ref-001')
    })
  })
})
