import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OntologyService, OntologyEntry } from 'src/libs/ontologyService'
import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const mockApiUrl = 'https://consent.example.org'

const mockOntologyResults: OntologyEntry[] = [
  { id: 'DOID_0001', label: 'test disease alpha' },
  { id: 'DOID_0002', label: 'test disease beta' },
]

const doidUrls = [
  'https://purl.obolibrary.org/obo/DOID_0001',
  'https://purl.obolibrary.org/obo/DOID_0002',
]

const nonDoidUrls = [
  'https://purl.obolibrary.org/obo/HP_0001250',
  'https://example.com/no-doid',
]

const mixedDoidUrls = [
  'https://purl.obolibrary.org/obo/DOID_0001',
  'https://purl.obolibrary.org/obo/HP_0001250',
  'https://purl.obolibrary.org/obo/DOID_0002',
]

const midPathDoidUrl = 'https://purl.obolibrary.org/obo/extra/path/DOID_0003/suffix'

describe('OntologyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(mockApiUrl)
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('searchOntology', () => {
    it('should return an empty array when obolibraryURL is empty', async () => {
      expect(await OntologyService.searchOntology('')).toEqual([])
    })

    it('should fetch from API and return results when cache is empty', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockOntologyResults })

      const result = await OntologyService.searchOntology('DOID_0001')

      expect(result).toEqual(mockOntologyResults)
      expect(fetchGet).toHaveBeenCalledWith(
        `${mockApiUrl}/ontology/search`,
        { params: { ids: 'DOID_0001' } },
      )
    })

    it('should return cached results without making another API call', async () => {
      Storage.setData('DOID_0001', mockOntologyResults)

      const result = await OntologyService.searchOntology('DOID_0001')

      expect(result).toEqual(mockOntologyResults)
      expect(fetchGet).not.toHaveBeenCalled()
    })

    it('should store API results in cache after fetching', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockOntologyResults })

      await OntologyService.searchOntology('DOID_0001')

      expect(Storage.getData<OntologyEntry[]>('DOID_0001')).toEqual(mockOntologyResults)
    })

    it('should show error notification and return empty array on API failure', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Internal Server Error'))
      const showError = vi.spyOn(Notifications, 'showError')

      const result = await OntologyService.searchOntology('DOID_0001')

      expect(result).toEqual([])
      expect(showError).toHaveBeenCalledOnce()
    })

    it('should pass the ids param to the API', async () => {
      const ontologyId = 'DOID_0001,DOID_0002'
      vi.mocked(fetchGet).mockResolvedValue({ data: mockOntologyResults })

      await OntologyService.searchOntology(ontologyId)

      expect(fetchGet).toHaveBeenCalledWith(
        `${mockApiUrl}/ontology/search`,
        { params: { ids: ontologyId } },
      )
    })
  })

  describe('extractDOIDFromUrl', () => {
    it.each([
      ['DOID URLs', doidUrls, ['DOID_0001', 'DOID_0002']],
      ['non-DOID URLs', nonDoidUrls, []],
      ['empty input', [], []],
      ['mixed URLs', mixedDoidUrls, ['DOID_0001', 'DOID_0002']],
      ['DOID mid-path', [midPathDoidUrl], ['DOID_0003/suffix']],
    ] as const)('should handle %s', (_label, input, expected) => {
      expect(OntologyService.extractDOIDFromUrl([...input])).toEqual(expected)
    })
  })
})
