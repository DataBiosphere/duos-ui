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
import { StudyComments } from 'src/libs/ajax/StudyComments'
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
  COMMENTS_PAGE_SIZE: 25,
  MAX_COMMENT_LENGTH: 2000,
  StudyComments: {
    listComments: vi.fn().mockResolvedValue({
      comments: [], averageRating: undefined, total: 0, yourComment: undefined,
    }),
    postComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Study', () => ({
  Study: {
    getStudyNames: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('src/utils/accessUtils', () => ({
  applyForAccess: vi.fn(),
}))

import { DataSet } from 'src/libs/ajax/DataSet'
import { Study } from 'src/libs/ajax/Study'

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

  it('shows relational study metadata when the study has no dataset search documents', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValueOnce(makeSearchResponse([]) as never)
    vi.mocked(Study.getById).mockResolvedValueOnce({
      studyId: 1,
      name: 'Study without datasets',
      description: 'Study metadata from the relational store',
      dataTypes: ['Genomic'],
      piName: 'Dr. Example',
    } as never)

    mountComponent()

    expect(await screen.findByRole('heading', { name: 'Study without datasets' })).toBeInTheDocument()
    expect(screen.getByText('Study metadata from the relational store')).toBeInTheDocument()
    expect(screen.getByText('Genomic')).toBeInTheDocument()
    expect(screen.getByText('Dr. Example')).toBeInTheDocument()
    expect(screen.getByText('No datasets found matching your criteria')).toBeInTheDocument()
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

  it('does not overwrite a user selection when the study-wide default arrives later', async () => {
    let resolveStudyWideIds!: (value: ReturnType<typeof makeSearchResponse>) => void
    const studyWideIds = new Promise<ReturnType<typeof makeSearchResponse>>((resolve) => {
      resolveStudyWideIds = resolve
    })
    const offPageDatasets = [4, 5].map(index => ({
      ...datasets[0],
      datasetId: 200000 + index,
      datasetIdentifier: `DUOS-20000${index}`,
      datasetName: `Off Page Dataset ${index}`,
    }))
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) =>
      query.size === 5 ? studyWideIds as never : makeSearchResponse(datasets, 5) as never)

    const user = userEvent.setup()
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    const controlledCheckbox = container
      .querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(controlledCheckbox)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    resolveStudyWideIds(makeSearchResponse([...datasets, ...offPageDatasets], 5))
    await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalledWith(
      expect.objectContaining({ size: 5 }),
    ))
    expect(screen.getByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()
    expect(screen.queryByText(/3 datasets selected from 1 study/i)).not.toBeInTheDocument()
  })

  it('does not default to a partial page when the study-wide selection fails', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
      if (query.size === 5) throw new Error('selection lookup failed')
      return makeSearchResponse(datasets, 5) as never
    })

    mountComponent()
    expect(await screen.findByText(/unable to select every controlled dataset automatically/i)).toBeInTheDocument()
    expect(screen.queryByText(/dataset selected from/i)).not.toBeInTheDocument()
  })
  it('keeps the per-dataset request path available for the default selection', async () => {
    // Auto-selecting the study's single controlled dataset must not disable the row's own
    // request button: clicking it submits exactly what 'Apply for Access' would.
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    await screen.findByText(/1 dataset selected from 1 study/i)

    expect(screen.getByRole('button', { name: 'Request Now' })).not.toBeDisabled()
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

  it('appends the next page of comments rather than replacing the one on screen', async () => {
    const page = (ids: number[], total: number) => ({
      total,
      averageRating: 4,
      yourComment: undefined,
      comments: ids.map(id => ({
        studyCommentId: id, studyId: 1, userId: 100 + id, rating: 4,
        commentText: `Comment ${id}`, createDate: '', updateDate: '',
        displayName: `Reviewer ${id}`, institutionName: 'Broad',
      })),
    })
    vi.mocked(StudyComments.listComments)
      .mockResolvedValueOnce(page([1], 2) as never)
      .mockResolvedValueOnce(page([2], 2) as never)
    const user = userEvent.setup()
    mountComponent()

    expect(await screen.findByText('Comment 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Show more comments \(1 of 2\)/ }))

    // The first page is still there; the second was appended, not swapped in
    expect(await screen.findByText('Comment 2')).toBeInTheDocument()
    expect(screen.getByText('Comment 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show more comments/ })).not.toBeInTheDocument()
  })

  it('treats the reader\'s own comment as an edit even when it is not on the loaded page', async () => {
    // The whole reason the backend carries yourComment separately: paging can hide it.
    vi.mocked(StudyComments.listComments).mockResolvedValueOnce({
      total: 40,
      averageRating: 4,
      comments: [],
      yourComment: {
        studyCommentId: 99, studyId: 1, userId: 42, rating: 3, commentText: 'Mine',
        createDate: '', updateDate: '', displayName: 'Me', institutionName: 'Broad',
      },
    } as never)
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    expect(await screen.findByText('Edit your comment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByLabelText('Comment')).toHaveValue('Mine')
  })

  it('stops the composer at the length the backend accepts', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    const field = await screen.findByLabelText('Comment')
    expect(field).toHaveAttribute('maxlength', '2000')
  })

  it('reports a failed comment fetch instead of showing an empty comment list', async () => {
    vi.mocked(StudyComments.listComments).mockRejectedValueOnce(new Error('comments unavailable'))
    mountComponent()

    expect(await screen.findByText('Unable to load comments and ratings.')).toBeInTheDocument()
    // The composer is what an empty-but-loaded section shows, so its absence is what
    // distinguishes a failure from a study nobody has commented on yet.
    expect(screen.queryByText('Add your comment')).not.toBeInTheDocument()
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
})
