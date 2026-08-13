import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DAC, DacDashboardSummary } from 'src/libs/ajax/DAC'
import { Config } from 'src/libs/config'
import type { DacObject, Dataset, DuosUser } from 'src/types/model'
import type { DACbotRule } from 'src/components/dac_bot/DACBotComponent'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet, fetchPost, fetchPut, fetchDelete } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchPut: vi.fn(),
  fetchDelete: vi.fn(),
}))

const apiUrl = 'https://api.example.test'

const mockDac: DacObject = {
  dacId: 42,
  name: 'Test DAC',
  description: 'Test DAC description',
  email: 'dac@example.test',
  chairpersons: [],
  members: [],
}

const mockDataset: Dataset = {
  name: 'Dataset Alpha',
  datasetId: 101,
  createUserId: 1001,
  createUser: {
    createDate: '2024-01-01T00:00:00.000Z' as unknown as Date,
    displayName: 'Dataset Owner',
    email: 'owner@example.test',
    emailPreference: true,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: true,
    isMember: false,
    isResearcher: false,
    isSigningOfficial: false,
    roles: [],
    userId: 1001,
  },
  createDate: '2024-01-01T00:00:00.000Z' as unknown as Date,
  dacId: 42,
  translatedDataUse: 'General Research Use',
  deletable: true,
  properties: [],
  study: {
    studyId: 501,
    name: 'Study Alpha',
    description: 'Example study',
    dataTypes: [],
    piName: 'Principal Investigator',
    publicVisibility: false,
    datasetIds: [101],
    datasets: [],
    properties: [],
    createDate: '2024-01-01T00:00:00.000Z',
    createUserId: 1001,
  },
  alias: 7,
  datasetIdentifier: 'DUOS-DS-101',
  dataUse: { generalUse: true },
}

const mockUsers: DuosUser[] = [
  {
    userId: 2001,
    displayName: 'Test User',
    email: 'user@example.test',
    createDate: '2026-01-01' as unknown as Date,
    emailPreference: false,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: false,
    isSigningOfficial: false,
    roles: [],
  },
]

const mockRule: DACbotRule = {
  id: 9,
  ruleType: 'GRU_V1',
  description: 'Auto-approve GRU datasets',
  ruleState: 'AVAILABLE' as DACbotRule['ruleState'],
  activationDate: 1712345678901,
  enabledByUserId: 2001,
  displayName: 'Chair User',
  userEmail: 'chair@example.test',
}

describe('DAC ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('list', () => {
    it('requests the DAC collection without query params when withUsers is omitted', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [mockDac] } as FetchData<DacObject[]>)

      const result = await DAC.list()

      expect(result).toEqual([mockDac])
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac`)
    })

    it('includes withUsers query param when it is provided', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [mockDac] } as FetchData<DacObject[]>)

      const result = await DAC.list(true)

      expect(result).toEqual([mockDac])
      expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac?withUsers=true`)
    })
  })

  it('create sends the DAC payload and returns the created DAC', async () => {
    vi.mocked(fetchPost).mockResolvedValue({ data: mockDac } as FetchData<DacObject>)

    const result = await DAC.create(mockDac.name!, mockDac.description!, mockDac.email!)

    expect(result).toEqual(mockDac)
    expect(fetchPost).toHaveBeenCalledWith(
      `${apiUrl}/api/dac`,
      { name: mockDac.name, description: mockDac.description, email: mockDac.email },
    )
  })

  it('update sends the DAC id and mutable fields', async () => {
    vi.mocked(fetchPut).mockResolvedValue({ data: mockDac } as FetchData<DacObject>)

    const result = await DAC.update(mockDac.dacId!, mockDac.name!, mockDac.description!, mockDac.email!)

    expect(result).toEqual(mockDac)
    expect(fetchPut).toHaveBeenCalledWith(
      `${apiUrl}/api/dac`,
      { dacId: mockDac.dacId, name: mockDac.name, description: mockDac.description, email: mockDac.email },
    )
  })

  it('delete returns a backward-compatible status object', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({} as FetchData<void>)

    const result = await DAC.delete(mockDac.dacId!)

    expect(result).toEqual({ status: 200 })
    expect(fetchDelete).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}`)
  })

  it('get retrieves a single DAC', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: mockDac } as FetchData<DacObject>)

    const result = await DAC.get(mockDac.dacId!)

    expect(result).toEqual(mockDac)
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}`)
  })

  it('datasets retrieves the DAC datasets', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: [mockDataset] } as FetchData<Dataset[]>)

    const result = await DAC.datasets(mockDac.dacId!)

    expect(result).toEqual([mockDataset])
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/datasets`)
  })

  it('autocompleteUsers retrieves matching users', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: mockUsers } as FetchData<DuosUser[]>)

    const result = await DAC.autocompleteUsers('chair')

    expect(result).toEqual(mockUsers)
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac/users/chair`)
  })

  it('addDacChair posts to the chair endpoint and returns 200', async () => {
    vi.mocked(fetchPost).mockResolvedValue({} as FetchData<void>)

    const result = await DAC.addDacChair(mockDac.dacId!, 2001)

    expect(result).toBe(200)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/chair/2001`, undefined)
  })

  it('removeDacChair deletes from the chair endpoint and returns 200', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({} as FetchData<void>)

    const result = await DAC.removeDacChair(mockDac.dacId!, 2001)

    expect(result).toBe(200)
    expect(fetchDelete).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/chair/2001`)
  })

  it('updateApprovalStatus sends the approval payload and returns the updated dataset', async () => {
    vi.mocked(fetchPut).mockResolvedValue({ data: { ...mockDataset, dacApproval: true } } as FetchData<Dataset>)

    const result = await DAC.updateApprovalStatus(mockDac.dacId!, mockDataset.datasetId, true)

    expect(result).toEqual({ ...mockDataset, dacApproval: true })
    expect(fetchPut).toHaveBeenCalledWith(
      `${apiUrl}/api/dac/${mockDac.dacId}/dataset/${mockDataset.datasetId}`,
      { approval: true },
    )
  })

  it('addDacMember posts to the member endpoint and returns 200', async () => {
    vi.mocked(fetchPost).mockResolvedValue({} as FetchData<void>)

    const result = await DAC.addDacMember(mockDac.dacId!, 2001)

    expect(result).toBe(200)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/member/2001`, undefined)
  })

  it('removeDacMember deletes from the member endpoint and returns 200', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({} as FetchData<void>)

    const result = await DAC.removeDacMember(mockDac.dacId!, 2001)

    expect(result).toBe(200)
    expect(fetchDelete).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/member/2001`)
  })

  it('fetchDACbotRules returns the rules list', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: [mockRule] } as FetchData<DACbotRule[]>)

    const result = await DAC.fetchDACbotRules(mockDac.dacId!)

    expect(result).toEqual([mockRule])
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/dac/${mockDac.dacId}/rules`)
  })

  it('toggleDACbotRule toggles a rule and returns the updated rule', async () => {
    const toggled = { ...mockRule, enabledByUserId: null }
    vi.mocked(fetchPut).mockResolvedValue({ data: toggled } as FetchData<DACbotRule>)

    const result = await DAC.toggleDACbotRule(mockDac.dacId!, mockRule.id)

    expect(result).toEqual(toggled)
    expect(fetchPut).toHaveBeenCalledWith(
      `${apiUrl}/api/dac/${mockDac.dacId}/rules/${mockRule.id}/toggle`,
      undefined,
    )
  })

  it('surfaces JSON error responses from the API', async () => {
    vi.mocked(fetchPost).mockRejectedValue(new Error('Create DAC failed'))

    await expect(DAC.create('Broken DAC', 'desc', 'broken@example.test')).rejects.toThrow('Create DAC failed')
  })

  it('gets and returns the DAC dashboard summary', async () => {
    const summary: DacDashboardSummary = {
      darRequests: { total: 8, approved: 3, pending: 5, awaitingMyVote: 2 },
      dacs: { total: 4 },
      dacDatasets: { total: 6 },
      dataLibrary: { studies: 7, datasets: 12, models: 3, workspaces: 1 },
    }
    vi.mocked(fetchGet).mockResolvedValue({ data: summary } as FetchData<DacDashboardSummary>)

    await expect(DAC.getDashboardSummary()).resolves.toEqual(summary)
    expect(fetchGet).toHaveBeenCalledWith(
      `${apiUrl}/api/dac/dashboard-summary`,
      authHeaders,
    )
  })
})
