import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Study } from 'src/libs/ajax/Study'
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

describe('Study', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: [] })
  })

  describe('getStudyNames', () => {
    it('fetches study names and returns the data array', async () => {
      const names = ['Study A', 'Study B']
      vi.mocked(fetchGet).mockResolvedValue({ data: names })

      const result = await Study.getStudyNames()

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/studyNames',
        headers,
      )
      expect(result).toEqual(names)
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))

      await expect(Study.getStudyNames()).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Unauthorized access to study names', code: 401 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await Study.getStudyNames().then(
        () => {
          throw new Error('expected getStudyNames to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Unauthorized access to study names')
    })
  })

  describe('getPublications', () => {
    it('requests the study\'s publications', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: [] })

      await Study.getPublications(42)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/42/assets/publications',
        headers,
      )
    })

    /**
     * The payload carries authors either flattened as authorNames or structured as authors[],
     * depending on how the study was registered. The cards read authorNames, so the structured
     * shape has to be flattened here or the byline renders empty.
     */
    it('flattens authors[] when authorNames is absent', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: [{
          title: 'A paper',
          authors: [{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }],
        }],
      })

      const [publication] = await Study.getPublications(42)

      expect(publication.authorNames).toEqual(['Ada Lovelace', 'Alan Turing'])
    })

    it('keeps authorNames when the payload already carries them', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: [{ title: 'A paper', authorNames: ['Grace Hopper'], authors: [{ name: 'ignored' }] }],
      })

      const [publication] = await Study.getPublications(42)

      expect(publication.authorNames).toEqual(['Grace Hopper'])
    })

    it('leaves an empty byline when the payload carries neither', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: [{ title: 'A paper' }] })

      const [publication] = await Study.getPublications(42)

      expect(publication.authorNames).toEqual([])
      expect(publication.studyName).toBe('')
    })

    it('drops an author entry with no name rather than rendering a blank', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({
        data: [{ title: 'A paper', authors: [{ name: 'Ada Lovelace' }, { name: '' }] }],
      })

      const [publication] = await Study.getPublications(42)

      expect(publication.authorNames).toEqual(['Ada Lovelace'])
    })
  })
})
