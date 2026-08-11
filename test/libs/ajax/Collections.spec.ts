import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Collections } from 'src/libs/ajax/Collections'
import { Config } from 'src/libs/config'
import type { DarCollection, DarCollectionSummary, UserRoleName } from 'src/types/model'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet, fetchPost, fetchPut } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchPut: vi.fn(),
}))

const apiUrl = 'https://api.example.test'
const roleName: UserRoleName = 'Researcher'

const mockCollection: DarCollection = {
  darCollectionId: 1,
  darCode: 'DAR-0001',
  createDate: 1700000000000,
  createUserId: 10,
  dars: {} as DarCollection['dars'],
  datasets: [],
}

const mockSummary: DarCollectionSummary = {
  actions: ['cancel', 'revise'],
  dacNames: ['Test DAC'],
  dacCode: 'DAC-0001',
  darCode: 'DAR-0001',
  darCollectionId: 1,
  datasetCount: 2,
  datasetIds: [101, 102],
  expired: false,
  expiresAt: 1900000000000,
  institutionName: 'Test Institution',
  latestReferenceId: 'ref-0001',
  name: 'Test Project',
  progressReport: false,
  referenceIds: ['ref-0001', 'ref-0002'],
  requiresSOApproval: false,
  researcherName: 'Test Researcher',
  status: 'In Progress',
  submissionDate: 1700000000000,
}

describe('Collections ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('cancelCollection', () => {
    it('sends a PUT request to the cancel endpoint with roleName param', async () => {
      vi.mocked(fetchPut).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.cancelCollection(1, roleName)

      expect(result).toEqual(mockCollection)
      expect(fetchPut).toHaveBeenCalledWith(
        `${apiUrl}/api/collections/1/cancel`,
        {},
        expect.objectContaining({ params: { roleName: 'Researcher' } }),
      )
    })

    it('throws on a non-200 response', async () => {
      vi.mocked(fetchPut).mockRejectedValue(new Error('Internal Server Error'))

      await expect(Collections.cancelCollection(1, roleName)).rejects.toThrow('Internal Server Error')
    })
  })

  describe('reviseCollection', () => {
    it('sends a PUT request to the resubmit endpoint', async () => {
      vi.mocked(fetchPut).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.reviseCollection(1)

      expect(result).toEqual(mockCollection)
      expect(fetchPut).toHaveBeenCalledWith(
        `${apiUrl}/api/collections/1/resubmit`,
        {},
      )
    })

    it('throws on a 404 response', async () => {
      vi.mocked(fetchPut).mockRejectedValue(new Error('Not Found'))

      await expect(Collections.reviseCollection(1)).rejects.toThrow('Not Found')
    })
  })

  describe('getCollectionById', () => {
    it('sends a GET request and returns the collection', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.getCollectionById(1)

      expect(result).toEqual(mockCollection)
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/collections/1`)
    })

    it('throws on a 403 response', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Forbidden'))

      await expect(Collections.getCollectionById(1)).rejects.toThrow('Forbidden')
    })
  })

  describe('getCollectionByIdWithElectionHistory', () => {
    it('sends a GET request to the electionHistory endpoint', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.getCollectionByIdWithElectionHistory(1)

      expect(result).toEqual(mockCollection)
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/collections/1/electionHistory`)
    })

    it('throws on a 500 response', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Server Error'))

      await expect(Collections.getCollectionByIdWithElectionHistory(1)).rejects.toThrow('Server Error')
    })
  })

  describe('getCollectionSummariesByRoleName', () => {
    it('sends a GET request and returns an array of summaries', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [mockSummary] } as FetchData<DarCollectionSummary[]>)

      const result = await Collections.getCollectionSummariesByRoleName(roleName)

      expect(result).toEqual([mockSummary])
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/collections/role/Researcher/summary`)
    })

    it('returns an empty array when the server returns []', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [] } as FetchData<DarCollectionSummary[]>)

      const result = await Collections.getCollectionSummariesByRoleName(roleName)

      expect(result).toEqual([])
    })
  })

  describe('getCollectionSummaryByRoleNameAndId', () => {
    it('sends a GET request with roleName and id in the path', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockSummary } as FetchData<DarCollectionSummary>)

      const result = await Collections.getCollectionSummaryByRoleNameAndId({ roleName, id: 1 })

      expect(result).toEqual(mockSummary)
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/collections/role/Researcher/summary/1`)
    })

    it('throws on a 404 response', async () => {
      vi.mocked(fetchGet).mockRejectedValue(new Error('Not Found'))

      await expect(Collections.getCollectionSummaryByRoleNameAndId({ roleName, id: 1 })).rejects.toThrow('Not Found')
    })
  })

  describe('openElectionsById', () => {
    it('sends a POST request to the election endpoint with empty body', async () => {
      vi.mocked(fetchPost).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.openElectionsById(1)

      expect(result).toEqual(mockCollection)
      expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/collections/1/election`, {})
    })

    it('throws on a 500 response', async () => {
      vi.mocked(fetchPost).mockRejectedValue(new Error('Internal Server Error'))

      await expect(Collections.openElectionsById(1)).rejects.toThrow('Internal Server Error')
    })
  })

  describe('approveCollectionById', () => {
    it('sends a POST request to the approve endpoint with empty body', async () => {
      vi.mocked(fetchPost).mockResolvedValue({ data: mockCollection } as FetchData<DarCollection>)

      const result = await Collections.approveCollectionById(1)

      expect(result).toEqual(mockCollection)
      expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/collections/1/approve`, {})
    })

    it('throws on a 403 response', async () => {
      vi.mocked(fetchPost).mockRejectedValue(new Error('Forbidden'))

      await expect(Collections.approveCollectionById(1)).rejects.toThrow('Forbidden')
    })
  })
})
