import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import { Storage } from 'src/libs/storage'
import { applyForAccess } from 'src/utils/accessUtils'
import { DuosUser, LibraryCard } from 'src/types/model'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ElasticsearchQuery } from 'src/types/elastic'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
    getTerraUrl: vi.fn().mockResolvedValue('http://terra.localhost'),
  },
  getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
}))

vi.mock('src/libs/ajax/TerraDataRepo', () => ({
  TerraDataRepo: {
    listSnapshotsByDatasetIds: vi.fn().mockResolvedValue({ filteredTotal: 0, items: [], roleMap: {} }),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndexV2: vi.fn(),
  },
}))

vi.mock('src/utils/accessUtils', () => ({
  applyForAccess: vi.fn(),
}))

import { DataSet } from 'src/libs/ajax/DataSet'

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    datasetName: 'Some Dataset 1',
    participantCount: 1,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'controlled',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
  {
    datasetId: 123457,
    datasetIdentifier: 'DUOS-123457',
    datasetName: 'Some Dataset 2',
    participantCount: 2,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'external',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
  {
    datasetId: 123458,
    datasetIdentifier: 'DUOS-123458',
    datasetName: 'Some Dataset 3',
    participantCount: 3,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'open',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
]

const makeSearchResponse = (
  pageDatasets = datasets,
  total = pageDatasets.length,
  participantCount = pageDatasets.reduce((sum, dataset) => sum + dataset.participantCount, 0),
) => ({
  hits: {
    total: { value: total },
    hits: pageDatasets.map(dataset => ({ _source: dataset })),
  },
  aggregations: {
    study_details: {
      hits: {
        hits: pageDatasets.length > 0
          ? [{ _source: { study: pageDatasets[0].study } }]
          : [],
      },
    },
    total_participants: { value: participantCount },
  },
})

const StudySwitcher = () => {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/studies/2')}>View study 2</button>
}

let queryClient: QueryClient

const mountComponent = (withStudySwitcher = false) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/studies/1']}>
        {withStudySwitcher && <StudySwitcher />}
        <Routes>
          <Route path="/studies/:studyId" element={<StudyDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(makeSearchResponse() as never)
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({
    userId: 42,
    libraryCard: {} as LibraryCard,
  } as DuosUser)
})

afterEach(() => {
  queryClient.clear()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Study details test', () => {
  it('does not show a participant total while datasets are loading', () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockReturnValueOnce(new Promise(() => {}) as never)
    mountComponent()

    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
    expect(screen.queryByText('Participants:')).not.toBeInTheDocument()
  })

  it('clears stale data and selection while navigating to another study', async () => {
    const user = userEvent.setup()
    const nextStudyDatasets = [{
      ...datasets[0],
      datasetId: 223456,
      datasetIdentifier: 'DUOS-223456',
      datasetName: 'Study 2 Dataset',
      study: {
        ...datasets[0].study,
        studyId: 2,
        studyName: 'second study',
      },
    }]
    let resolveNextStudy: (response: ReturnType<typeof makeSearchResponse>) => void = () => {}
    const nextStudyRequest = new Promise<ReturnType<typeof makeSearchResponse>>((resolve) => {
      resolveNextStudy = resolve
    })
    vi.mocked(DataSet.searchDatasetIndexV2)
      .mockResolvedValueOnce(makeSearchResponse() as never)
      .mockReturnValueOnce(nextStudyRequest as never)

    const { container } = mountComponent(true)
    await screen.findByText(datasets[0].datasetName)
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View study 2' }))
    expect(screen.queryByText(datasets[0].datasetName)).not.toBeInTheDocument()
    expect(screen.queryByText('Participants:')).not.toBeInTheDocument()
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/1 dataset selected from 1 study/i)).not.toBeInTheDocument())

    resolveNextStudy(makeSearchResponse(nextStudyDatasets))
    expect(await screen.findByText('Study 2 Dataset')).toBeInTheDocument()
    expect(screen.getAllByText('second study')).toHaveLength(2)
    expect(screen.queryByText(/dataset selected from/i)).not.toBeInTheDocument()
  })

  it('ignores exportable snapshots returned for a previous study', async () => {
    const user = userEvent.setup()
    const nextStudyDatasets = [{
      ...datasets[0],
      datasetId: 223456,
      datasetIdentifier: 'DUOS-223456',
      datasetName: 'Study 2 Dataset',
      study: { ...datasets[0].study, studyId: 2, studyName: 'second study' },
    }]
    let resolvePreviousSnapshots: (response: unknown) => void = () => {}
    const previousSnapshotRequest = new Promise((resolve) => {
      resolvePreviousSnapshots = resolve
    })
    vi.mocked(DataSet.searchDatasetIndexV2)
      .mockResolvedValueOnce(makeSearchResponse() as never)
      .mockResolvedValueOnce(makeSearchResponse(nextStudyDatasets) as never)
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds)
      .mockReturnValueOnce(previousSnapshotRequest as never)
      .mockResolvedValueOnce({ filteredTotal: 0, items: [], roleMap: {} } as never)

    mountComponent(true)
    await screen.findByText(datasets[0].datasetName)
    await waitFor(() => expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'View study 2' }))
    await screen.findByText('Study 2 Dataset')
    await waitFor(() => expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledTimes(2))

    resolvePreviousSnapshots({
      filteredTotal: 1,
      items: [{ id: 'old-snapshot', name: 'Old Snapshot', duosId: 'DUOS-123456' }],
      roleMap: { 'old-snapshot': ['reader'] },
    })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Export to...' })).not.toBeInTheDocument())
  })

  it('shows the appropriate data for fields', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(screen.getByText(`DUOS-S${datasets[0].study.studyId}`)).toBeInTheDocument()
    expect(screen.getAllByText(datasets[0].study.studyName)[0]).toBeInTheDocument()
    expect(screen.getAllByText(datasets[0].study.description)[0]).toBeInTheDocument()
    expect(screen.getByText(datasets.reduce((total, dataset) => total + dataset.participantCount, 0).toString())).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.phenotype)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.species)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.piName)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.dataCustodianEmail.join(', '))).toBeInTheDocument()
    expect(screen.getByRole('grid').closest('.MuiDataGrid-root')).toBeInTheDocument()
    expect(document.querySelectorAll('[role=row]')).toHaveLength(datasets.length + 1)
  })

  it('requests server-side pages for the current study without a fixed result cap', async () => {
    const user = userEvent.setup()
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(makeSearchResponse(datasets, 26) as never)
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    const initialQuery = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls[0][0] as ElasticsearchQuery
    expect(initialQuery.from).toBe(0)
    expect(initialQuery.size).toBe(25)
    expect(initialQuery.size).not.toBe(10000)
    expect(initialQuery.query?.bool.must).toContainEqual({ match: { 'study.studyId': '1' } })
    expect(initialQuery.aggs).toHaveProperty('study_details')
    expect(initialQuery.aggs).toHaveProperty('total_participants')

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalledTimes(2))
    const nextPageQuery = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls[1][0] as ElasticsearchQuery
    expect(nextPageQuery.from).toBe(25)
    expect(nextPageQuery.size).toBe(25)
  })

  it('uses the dataset asset server-side sort mapping', async () => {
    const user = userEvent.setup()
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    await user.click(screen.getByRole('columnheader', { name: /Dataset Name/ }))
    await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalledTimes(2))
    const sortQuery = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls[1][0] as ElasticsearchQuery
    expect(sortQuery.sort).toEqual([{ 'datasetName.keyword': { order: 'asc' } }])
  })

  it('preserves selected datasets across server-side pages', async () => {
    const user = userEvent.setup()
    const nextPageDatasets = [{
      ...datasets[0],
      datasetId: 223456,
      datasetIdentifier: 'DUOS-223456',
      datasetName: 'Next Page Dataset',
    }]
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) =>
      (query.from === 25
        ? makeSearchResponse(nextPageDatasets, 26, 6)
        : makeSearchResponse(datasets, 26, 6)) as never)

    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(await screen.findByText('Next Page Dataset')).toBeInTheDocument()
    expect(screen.getByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()
  })

  it('selects controlled datasets, displays LibraryFooter, and applies for access', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(applyForAccess).toHaveBeenCalledWith([123456], expect.any(Function))
  })

  it('does not allow open or externally managed datasets to be selected', async () => {
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)

    const externalCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123457"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    const openCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123458"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    expect(externalCheckbox).toBeDisabled()
    expect(openCheckbox).toBeDisabled()
  })

  it('allows navigation back to datalibrary', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(document.getElementById('link_datalibrary')).toHaveAttribute('href', '/datalibrary')
  })

  it('shows the grid empty state and an error instead of remaining in loading state when loading fails', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockRejectedValueOnce(new Error('search failed'))
    mountComponent()

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load datasets: search failed')
    expect(screen.getByText('No datasets found matching your criteria')).toBeInTheDocument()
    expect(screen.queryByText('Participants:')).not.toBeInTheDocument()
    expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument()
  })

  it('shows a non-duplicated fallback message for non-Error rejections', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockRejectedValueOnce('unexpected rejection')
    mountComponent()

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load datasets: Unknown error')
    expect(screen.getByRole('alert')).not.toHaveTextContent('Unable to load datasets: Unable to load datasets')
  })
})
