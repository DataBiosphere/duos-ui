import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
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

vi.mock('src/libs/ajax/StudyComments', () => ({
  StudyComments: {
    listComments: vi.fn().mockResolvedValue({ comments: [], averageRating: undefined }),
    postComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DatasetMetrics', () => ({
  DatasetMetrics: {
    getDatasetStats: vi.fn().mockResolvedValue([]),
    getStudyStats: vi.fn().mockResolvedValue([]),
    getResearchOutputs: vi.fn().mockResolvedValue({ presentations: [], publications: [], intellectualProperties: [] }),
  },
}))

vi.mock('src/libs/ajax/StudyRecommendations', () => ({
  StudyRecommendations: {
    getSimilar: vi.fn().mockResolvedValue([]),
    getFrequentlyRequestedWith: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('src/libs/ajax/Study', () => ({
  Study: {
    getStudyNames: vi.fn().mockResolvedValue([]),
    getModels: vi.fn().mockResolvedValue([]),
    getWorkspaces: vi.fn().mockResolvedValue([]),
    getPresentations: vi.fn().mockResolvedValue([]),
    getPublications: vi.fn().mockResolvedValue([]),
    getClinicalTrials: vi.fn().mockResolvedValue([]),
    getIntellectualProperty: vi.fn().mockResolvedValue([]),
    getFundingResources: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('src/utils/accessUtils', () => ({
  applyForAccess: vi.fn(),
}))

import { DataSet } from 'src/libs/ajax/DataSet'
import { Study } from 'src/libs/ajax/Study'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'

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

  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver
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
      // Not auto-selectable, so selection state after navigating is unambiguous
      accessManagement: 'open',
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

    mountComponent(true)
    await screen.findByText(datasets[0].datasetName)
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

    const queries = () => vi.mocked(DataSet.searchDatasetIndexV2).mock.calls.map(call => call[0] as ElasticsearchQuery)
    const initialQuery = queries().find(query => query.from === 0 && query.size === 25)!
    expect(initialQuery).toBeDefined()
    expect(initialQuery.size).not.toBe(10000)
    expect(initialQuery.query?.bool.must).toContainEqual({ match: { 'study.studyId': '1' } })
    expect(initialQuery.aggs).toHaveProperty('study_details')
    expect(initialQuery.aggs).toHaveProperty('total_participants')

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await waitFor(() => expect(queries().some(query => query.from === 25)).toBe(true))
    expect(queries().find(query => query.from === 25)!.size).toBe(25)
  })

  it('uses the dataset asset server-side sort mapping with one active sort', async () => {
    const user = userEvent.setup()
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    const sorts = () => vi.mocked(DataSet.searchDatasetIndexV2).mock.calls
      .map(call => (call[0] as ElasticsearchQuery).sort)
      .filter(Boolean)

    await user.click(screen.getByRole('columnheader', { name: /Dataset Name/ }))
    await waitFor(() => expect(sorts()).toContainEqual([{ 'datasetName.keyword': { order: 'asc' } }]))

    await user.keyboard('{Shift>}')
    await user.click(screen.getByRole('columnheader', { name: /Identifier/ }))
    await user.keyboard('{/Shift}')
    await waitFor(() => expect(sorts()).toContainEqual([{ 'datasetIdentifier.keyword': { order: 'asc' } }]))
    expect(screen.getByRole('columnheader', { name: /Dataset Name/ })).toHaveAttribute('aria-sort', 'none')
    expect(screen.getByRole('columnheader', { name: /Identifier/ })).toHaveAttribute('aria-sort', 'ascending')
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

    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(await screen.findByText('Next Page Dataset')).toBeInTheDocument()
    expect(screen.getByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()
  })

  it('does not re-seed the default selection after the user clears it', async () => {
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
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    const controlledCheckbox = container
      .querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(controlledCheckbox)
    await waitFor(() => expect(screen.queryByText(/dataset selected from/i)).not.toBeInTheDocument())

    // The next page re-runs the search, so the default-selection seeding gets another chance to
    // run. It must stay latched rather than reinstating what the user just cleared.
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(await screen.findByText('Next Page Dataset')).toBeInTheDocument()
    expect(screen.queryByText(/dataset selected from/i)).not.toBeInTheDocument()
  })

  it('selects controlled datasets by default and applies for access from the sidebar', async () => {
    const user = userEvent.setup()
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(applyForAccess).toHaveBeenCalledWith([123456], expect.any(Function))
  })

  it('does not select open or externally managed datasets by default', async () => {
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    await screen.findByText(/1 dataset selected from 1 study/i)

    const externalCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123457"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    const openCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123458"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    expect(externalCheckbox).not.toBeChecked()
    expect(openCheckbox).not.toBeChecked()
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

  it('keeps the DAR, publication, and recommendation sections visible when empty', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    expect(screen.getByRole('heading', { name: 'Data Access Requests for this Study' })).toBeInTheDocument()
    expect(screen.getByText('No granted data access requests yet.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Primary Study Publications' })).toBeInTheDocument()
    expect(screen.getByText('No primary study publications have been added yet.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Studies often Requested with this Study' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recommended Studies based on Data Type' })).toBeInTheDocument()
    expect(await screen.findAllByText('No study recommendations yet.')).toHaveLength(2)
  })

  it('shows primary study publications as cards, linking only plain http urls', async () => {
    vi.mocked(Study.getPublications).mockResolvedValueOnce([
      {
        publicationId: 'pub-1', title: 'Genomic variation at scale', authorNames: ['Ada Lovelace', 'Alan Turing'],
        journal: 'Nature Genetics', publishedDate: '2025-04-01', doi: '10.1000/xyz123', url: 'https://example.org/pub-1',
      },
      {
        publicationId: 'pub-2', title: 'Follow-up analysis', authorNames: [],
        journal: 'Cell', publishedDate: '2026-01-15', url: 'javascript:alert(document.cookie)',
      },
    ] as never)
    mountComponent()

    expect(await screen.findByText('Genomic variation at scale')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Genomic variation at scale' }))
      .toHaveAttribute('href', 'https://example.org/pub-1')
    expect(screen.getByText('Ada Lovelace, Alan Turing')).toBeInTheDocument()
    expect(screen.getByText('Nature Genetics · 2025-04-01')).toBeInTheDocument()
    expect(screen.getByText('DOI: 10.1000/xyz123')).toBeInTheDocument()
    // A submitter-supplied url that is not http(s) renders as plain text
    expect(screen.getByText('Follow-up analysis')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Follow-up analysis' })).not.toBeInTheDocument()
    expect(screen.queryByText('No primary study publications have been added yet.')).not.toBeInTheDocument()
  })

  it('groups self-reported secondary research outputs by type', async () => {
    vi.mocked(DatasetMetrics.getResearchOutputs).mockResolvedValueOnce({
      presentations: [{ title: 'ASHG 2025 talk', url: 'https://example.org/talk' }],
      publications: [{ title: 'Downstream findings' }, { title: 'Second downstream paper' }],
      intellectualProperties: [{ title: 'Assay patent' }],
    } as never)
    const user = userEvent.setup()
    mountComponent()

    // Each type is its own group, labelled with its own count
    expect(await screen.findByText('Presentations (1)')).toBeInTheDocument()
    expect(screen.getByText('Publications (2)')).toBeInTheDocument()
    expect(screen.getByText('Intellectual Property (1)')).toBeInTheDocument()

    // The groups start collapsed, so their entries are only reachable once expanded
    await user.click(screen.getByText('Presentations (1)'))
    expect(await screen.findByRole('link', { name: 'ASHG 2025 talk' }))
      .toHaveAttribute('href', 'https://example.org/talk')
    await user.click(screen.getByText('Publications (2)'))
    expect(await screen.findByText('Downstream findings')).toBeInTheDocument()
    expect(screen.getByText('Second downstream paper')).toBeInTheDocument()
    await user.click(screen.getByText('Intellectual Property (1)'))
    expect(await screen.findByText('Assay patent')).toBeInTheDocument()
  })

  it('shows the PI profile links even when the search index has no PI name', async () => {
    vi.mocked(Study.getById).mockResolvedValueOnce({
      piOrcid: '0000-0001-2345-6789',
    } as never)
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(
      makeSearchResponse(datasets.map(dataset => ({ ...dataset, study: { ...dataset.study, piName: '' } }))) as never,
    )
    mountComponent()

    expect(await screen.findByRole('link', { name: 'ORCID profile' })).toBeInTheDocument()
    expect(screen.getByText('PI Name')).toBeInTheDocument()
  })

  it('omits the PI row entirely when there is neither a name nor a profile link', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(
      makeSearchResponse(datasets.map(dataset => ({ ...dataset, study: { ...dataset.study, piName: '' } }))) as never,
    )
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    expect(screen.queryByText('PI Name')).not.toBeInTheDocument()
  })

  it('does not link a PI website that is not a plain http url', async () => {
    vi.mocked(Study.getById).mockResolvedValueOnce({
      piInstitution: { id: 7, name: 'Broad Institute' },
      piWebsiteUrl: 'javascript:alert(document.cookie)',
    } as never)
    mountComponent()

    await screen.findByText('Broad Institute')
    expect(screen.queryByRole('link', { name: 'PI website' })).not.toBeInTheDocument()
  })

  it('shows PI institution and external profile links', async () => {
    vi.mocked(Study.getById).mockResolvedValueOnce({
      piInstitution: { id: 7, name: 'Broad Institute' },
      piOrcid: '0000-0001-2345-6789',
      piLinkedinUrl: 'https://linkedin.com/in/example',
      piWebsiteUrl: 'https://example.org',
    } as never)
    mountComponent()

    expect(await screen.findByText('Broad Institute')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ORCID profile' })).toHaveAttribute('href', 'https://orcid.org/0000-0001-2345-6789')
    expect(screen.getByRole('link', { name: 'LinkedIn profile' })).toHaveAttribute('href', 'https://linkedin.com/in/example')
    expect(screen.getByRole('link', { name: 'PI website' })).toHaveAttribute('href', 'https://example.org')
  })

  it('shows granted DAR details and expands the research use statement', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockResolvedValueOnce([{
      projectTitle: 'Cancer genomics', referenceId: 'dar-1', darCode: 'DAR-1',
      nonTechRus: 'Study cancer outcomes.', expired: false, piName: 'Dr Researcher',
      institutionName: 'Research University', submissionDate: Date.now(), updateDate: Date.now(),
    }])
    const user = userEvent.setup()
    mountComponent()

    expect(await screen.findByText('Cancer genomics')).toBeInTheDocument()
    expect(screen.getByText('PI: Dr Researcher')).toBeInTheDocument()
    expect(screen.getByText('Institution: Research University')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show research use statement' }))
    expect(screen.getByText('Study cancer outcomes.')).toBeInTheDocument()
  })

  it('shows the public identity disclosure to active researchers before posting', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    expect(await screen.findByText('Your name and institution will be shared publicly with this comment.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled()
  })

  it('requires the Researcher role in addition to Active Researcher Status', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: false, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    expect(await screen.findByText('Active Researcher Status is required to comment or rate this study.'))
      .toBeInTheDocument()
    expect(screen.queryByText('Add your comment')).not.toBeInTheDocument()
  })

  it('requires an active library card in addition to the Researcher role', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 42, isResearcher: true } as DuosUser)
    mountComponent()

    expect(await screen.findByText('Active Researcher Status is required to comment or rate this study.'))
      .toBeInTheDocument()
    expect(screen.queryByText('Add your comment')).not.toBeInTheDocument()
  })

  it('does not let the sidebar start a request without Active Researcher Status', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 42 } as DuosUser)
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    await screen.findByText(/1 dataset selected from 1 study/i)

    const applyButton = screen.getByRole('button', { name: 'Apply for Access' })
    expect(applyButton).toBeDisabled()
    // fireEvent, not userEvent: a disabled button has pointer-events none, which userEvent
    // refuses to click at all, so it could never observe the handler not running.
    fireEvent.click(applyButton)
    expect(applyForAccess).not.toHaveBeenCalled()

    fireEvent.mouseOver(applyButton.parentElement as HTMLElement)
    expect(await screen.findByRole('tooltip'))
      .toHaveTextContent('Active Researcher Status is required to apply for data access')
  })

  it('selects every controlled dataset in the study, not just the visible page', async () => {
    const offPageDatasets = [4, 5].map(index => ({
      ...datasets[0],
      datasetId: 200000 + index,
      datasetIdentifier: `DUOS-20000${index}`,
      datasetName: `Off Page Dataset ${index}`,
    }))
    // The grid page holds three of the study's five datasets; the study-wide id lookup asks
    // for all five, so the default selection covers the three controlled ones.
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) =>
      (query.size === 5
        ? makeSearchResponse([...datasets, ...offPageDatasets], 5)
        : makeSearchResponse(datasets, 5)) as never)

    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(await screen.findByText(/3 datasets selected from 1 study/i)).toBeInTheDocument()
  })

  it('reports a failed asset fetch instead of an empty section', async () => {
    vi.mocked(Study.getModels).mockRejectedValueOnce(new Error('models unavailable'))
    mountComponent()

    expect(await screen.findByText('Unable to load AI models.')).toBeInTheDocument()
    expect(screen.queryByText('No AI models have been added yet.')).not.toBeInTheDocument()
  })

  it('keeps the per-dataset request path available for the default selection', async () => {
    // Auto-selecting the study's single controlled dataset must not disable the row's own
    // request button: clicking it submits exactly what 'Apply for Access' would.
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    await screen.findByText(/1 dataset selected from 1 study/i)

    expect(screen.getByRole('button', { name: 'Request Now' })).not.toBeDisabled()
  })
})
