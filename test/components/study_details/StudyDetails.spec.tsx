import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import ScrollToTopOnNavigate from 'src/components/ScrollToTopOnNavigate'
import { Storage } from 'src/libs/storage'
import { applyForAccess } from 'src/utils/accessUtils'
import { DuosUser, LibraryCard, StudyRecommendation } from 'src/types/model'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { StudyComments } from 'src/libs/ajax/StudyComments'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ElasticsearchQuery } from 'src/types/elastic'

// Spread the real module so the mock only overrides what these tests control. A hand-listed mock
// breaks whenever anything this page imports reads a config export at load time - fetchAdapter
// does, and that is how this spec stopped importing once the page reached it.
vi.mock('src/libs/config', async importOriginal => ({
  ...(await importOriginal<typeof import('src/libs/config')>()),
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

vi.mock('src/libs/ajax/DatasetMetrics', () => ({
  DatasetMetrics: {
    getDatasetStats: vi.fn().mockResolvedValue([]),
    getStudyStats: vi.fn().mockResolvedValue([]),
    getResearchOutputs: vi.fn().mockResolvedValue({ presentations: [], publications: [], intellectualProperties: [] }),
  },
}))

// The trend reports the page asks consent for, each empty unless a test says otherwise
vi.mock('src/libs/ajax/DarMetrics', () => {
  const emptyReport = () => Promise.resolve({
    from: '2026-01-01', to: '2026-03-31', bucket: 'QUARTER', total: 0, unmeasured: 0, buckets: [], rows: [],
  })
  return {
    DarMetrics: {
      getVolume: vi.fn(emptyReport),
      getDecisions: vi.fn(emptyReport),
      getDatasetDecisions: vi.fn(emptyReport),
      getDecisionTurnaround: vi.fn(emptyReport),
      getDatasetDecisionTurnaround: vi.fn(emptyReport),
      getExpirations: vi.fn(emptyReport),
      getRenewals: vi.fn(emptyReport),
    },
  }
})

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
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { StudyRecommendations } from 'src/libs/ajax/StudyRecommendations'

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    datasetName: 'Some Dataset 1',
    participantCount: 1,
    dacId: 0,
    dacApproval: true,
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

const recommendation = (overrides: Partial<StudyRecommendation>): StudyRecommendation => ({
  studyId: 7,
  studyName: 'Neighbouring study',
  studyDescription: '',
  piName: 'Dr Other',
  species: 'Human',
  phenotype: '',
  dataTypes: [],
  dataUseCodes: [],
  accessTypes: [],
  datasetCount: 1,
  totalParticipants: 10,
  datasetIds: [2],
  modelCount: 0,
  workspaceCount: 0,
  ...overrides,
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
        {/* The scroll reset lives at the router now, not in this page */}
        <ScrollToTopOnNavigate />
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
  // Nothing resets mocks between tests here, so a history one test refuses would stay refused for
  // the next.
  vi.mocked(DatasetMetrics.getStudyStats).mockReset().mockResolvedValue([])
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({
    userId: 42,
    libraryCard: {} as LibraryCard,
  } as DuosUser)
  vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  queryClient.clear()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Study details test', () => {
  it('scrolls to the overview when navigating directly between studies', async () => {
    const user = userEvent.setup()
    mountComponent(true)
    await screen.findByText(datasets[0].datasetName)
    vi.mocked(globalThis.scrollTo).mockClear()

    await user.click(screen.getByRole('button', { name: 'View study 2' }))

    await waitFor(() => expect(globalThis.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 }))
  })

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

  /**
   * The apply-for-access control is the sidebar on a wide viewport and LibraryFooter on a narrow
   * one, and the split is the only thing standing between a phone-sized reader and no way to
   * apply at all. useMediaQuery reads window.matchMedia, which jsdom does not implement, so the
   * desktop path is what every other test exercises by default.
   */
  it('swaps the sidebar for the footer on a narrow viewport', async () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      // MUI asks breakpoints.down('md'); answer yes so the component takes the narrow path
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMedia)
    try {
      const { container } = mountComponent()
      await screen.findByText(datasets[0].datasetName)

      // LibraryFooter is there. Asserting it by its own marker rather than by the selection text,
      // which the sidebar renders too - so the text alone would pass on either viewport.
      await waitFor(() =>
        expect(container.querySelector('[data-cy="library-footer"]')).toBeInTheDocument())
      // ...and StudySidebar is not. It is the only <aside> on the page, and the table of contents
      // it carries goes with it.
      expect(container.querySelector('aside')).not.toBeInTheDocument()
      expect(screen.queryByText('On this page')).not.toBeInTheDocument()
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  /** The counterpart: on a wide viewport the sidebar carries the control and no footer appears. */
  it('keeps the sidebar and no footer on a wide viewport', async () => {
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    await screen.findByText('On this page')

    expect(container.querySelector('aside')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="library-footer"]')).not.toBeInTheDocument()
  })

  it('keeps the DAR, publication, and recommendation sections visible when empty', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    expect(screen.getByRole('heading', { name: 'Data Access Requests for this Study (0)' })).toBeInTheDocument()
    expect(screen.getByText('No granted data access requests yet.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Primary Study Publications' })).toBeInTheDocument()
    expect(screen.getByText('No primary study publications have been added yet.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Studies often Requested with this Study' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recommended Studies by Data Type or PI' })).toBeInTheDocument()
    expect(await screen.findAllByText('No study recommendations yet.')).toHaveLength(2)
  })

  /**
   * A refetch failing after a good load - the query going stale and being refreshed, say - used
   * to replace cards that were on screen and correct with "Unable to load publications." The
   * section reports a failure only when it has nothing else to show.
   */
  it('keeps publication cards up when a refetch fails', async () => {
    vi.mocked(Study.getPublications)
      .mockResolvedValueOnce([
        { publicationId: 'pub-1', title: 'Genomic variation at scale', authorNames: [], journal: 'Nature', publishedDate: '2025-04-01' },
      ] as never)
      .mockRejectedValue(new Error('refresh failed'))
    mountComponent()
    await screen.findByText('Genomic variation at scale')

    // A real refetch, not just the first render: invalidating is what a post-mutation refresh
    // or a stale query does.
    await queryClient.invalidateQueries()

    await waitFor(() =>
      expect(screen.getByText('Genomic variation at scale')).toBeInTheDocument())
    expect(screen.queryByText('Unable to load publications.')).not.toBeInTheDocument()
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

  /**
   * publicationId is submitter-supplied, so blanks and repeats both reach us. React warns on
   * duplicate keys rather than throwing, so the warning itself is the assertion - without it a
   * regression to keying straight off publicationId would render two cards and pass silently.
   */
  it('keeps publications with blank or repeated ids distinct', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(Study.getPublications).mockResolvedValueOnce([
      { publicationId: '', title: 'First untitled submission', authorNames: [], journal: 'Cell', publishedDate: '2025-01-01' },
      { publicationId: '', title: 'Second untitled submission', authorNames: [], journal: 'Cell', publishedDate: '2025-02-01' },
      { publicationId: 'dup', title: 'Shared id, first', authorNames: [], journal: 'Nature', publishedDate: '2025-03-01' },
      { publicationId: 'dup', title: 'Shared id, second', authorNames: [], journal: 'Nature', publishedDate: '2025-04-01' },
    ] as never)
    try {
      mountComponent()

      expect(await screen.findByText('First untitled submission')).toBeInTheDocument()
      expect(screen.getByText('Second untitled submission')).toBeInTheDocument()
      expect(screen.getByText('Shared id, first')).toBeInTheDocument()
      expect(screen.getByText('Shared id, second')).toBeInTheDocument()

      const duplicateKeyWarnings = consoleError.mock.calls
        .filter(call => String(call[0]).includes('same key'))
      expect(duplicateKeyWarnings).toEqual([])
    }
    finally {
      consoleError.mockRestore()
    }
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

  /**
   * The index document exists but carries '' / [] for fields it never populated. Under `??` those
   * empty values won, so the relational payload - the whole reason the fallback is there - was
   * suppressed exactly when it was needed.
   */
  it('falls back to the relational payload when the index carries empty values', async () => {
    vi.mocked(Study.getById).mockResolvedValueOnce({
      piName: 'Ada Lovelace',
      dataTypes: ['Genomic'],
    } as never)
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(
      makeSearchResponse(datasets.map(dataset => ({
        ...dataset,
        study: { ...dataset.study, piName: '', dataTypes: [] },
      }))) as never,
    )
    mountComponent()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Genomic')).toBeInTheDocument()
  })

  /**
   * The index document is external data: its types assert string[] but a field it never filled
   * can arrive as null. Anything that reads .length off it, or hands it to a `= []` default that
   * only fires on undefined, blanks the whole page.
   */
  it('survives an index document whose fields are null', async () => {
    vi.mocked(Study.getById).mockResolvedValueOnce({ piName: null, dataTypes: null } as never)
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(
      // Cast because the declared types forbid null - which is the point: the index supplies it
      // anyway, and the types are an assertion about external data rather than a guarantee.
      makeSearchResponse(datasets.map(dataset => ({
        ...dataset,
        study: { ...dataset.study, piName: null, dataTypes: null },
      })) as never) as never,
    )
    mountComponent()

    expect(await screen.findByText(datasets[0].datasetName)).toBeInTheDocument()
  })

  /**
   * The dataset page tells a refusal apart from a fault; this section did not, so one
   * authorization decision was described two different ways depending on where you read it.
   */
  it('describes a refused study history as a refusal, not a failure', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockRejectedValue(
      Object.assign(new Error('User does not have permission'), { response: { status: 403 } }),
    )
    mountComponent()

    expect(await screen.findByText(/do not have access to this study's data access request history/i))
      .toBeInTheDocument()
    expect(screen.queryByText('Unable to load data access requests.')).not.toBeInTheDocument()
    expect(screen.queryByText('No granted data access requests yet.')).not.toBeInTheDocument()
  })

  const grantedDar = (referenceId: string) => ({
    projectTitle: `Project ${referenceId}`, referenceId, darCode: referenceId.toUpperCase(),
    nonTechRus: '', expired: false, updateDate: Date.now(),
  })
  const darHistoryHeading = () => screen.getByRole('heading', { name: /^Data Access Requests for this Study/ })
  const forbidden = () => Object.assign(new Error('User does not have permission'), { response: { status: 403 } })
  // The page's datasets are under DAC 0. The signed-in user of these tests holds no role at all.
  const viewAs = (user: Partial<DuosUser>) =>
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 42, libraryCard: {} as LibraryCard, ...user } as DuosUser)
  const viewAsAdmin = () => viewAs({ isAdmin: true })
  const viewAsChairOf = (dacId: number) =>
    viewAs({ isAdmin: false, roles: [{ name: 'Chairperson', dacId, roleId: 2, userId: 42 }] })
  const requestActivityReports = [
    DarMetrics.getVolume, DarMetrics.getDatasetDecisions, DarMetrics.getDatasetDecisionTurnaround,
  ]

  it('counts the granted requests in the section heading, and not in the table of contents', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockResolvedValueOnce([grantedDar('dar-1'), grantedDar('dar-2')])
    mountComponent()

    expect(await screen.findByRole('heading', { name: 'Data Access Requests for this Study (2)' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Data Access Requests for this Study' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /\(2\)/ })).not.toBeInTheDocument()
  })

  it('shows no count while the request history is loading', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockReturnValueOnce(new Promise(() => {}))
    mountComponent()
    await screen.findByText(datasets[0].datasetName)

    expect(darHistoryHeading().textContent).toBe('Data Access Requests for this Study')
  })

  /** A refusal or a failure is not "no requests", so neither may read as "(0)". */
  it.each([
    ['is refused', 403, /do not have access to this study's data access request history/i],
    ['fails to load', 500, 'Unable to load data access requests.'],
  ])('shows no count when the request history %s', async (_outcome, status, message) => {
    vi.mocked(DatasetMetrics.getStudyStats).mockRejectedValue(
      Object.assign(new Error('nope'), { response: { status } }),
    )
    mountComponent()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(darHistoryHeading().textContent).toBe('Data Access Requests for this Study')
  })

  it('shows an admin the study\'s DAR trends once its request history has loaded', async () => {
    viewAsAdmin()
    mountComponent()

    expect(await screen.findByRole('heading', { name: 'Data Access Request Trends' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Data Access Request Trends' })).toHaveAttribute('href', '#dar-trends')
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1, target: { kind: 'study', id: '1' } }),
    ))
    expect(await screen.findByRole('tab', { name: 'Decisions' })).toBeInTheDocument()
    // The trends follow the history in the table of contents, as they do on the page
    const contents = screen.getAllByRole('link').map(link => link.textContent)
    expect(contents.indexOf('Data Access Request Trends'))
      .toBe(contents.indexOf('Data Access Requests for this Study') + 1)
  })

  /**
   * Consent gates the trends as it gates the history. Whoever is refused the history is not shown
   * trends, and is not the cause of requests that could only be refused too.
   */
  it('asks for no trends, and says who can see them, when the request history is refused', async () => {
    viewAsAdmin()
    vi.mocked(DatasetMetrics.getStudyStats).mockRejectedValue(forbidden())
    mountComponent()

    const note = await screen.findByText(
      /Trends are shown to those who can see this study's data access request history/,
    )
    expect(screen.queryByRole('tab', { name: 'Volume' })).not.toBeInTheDocument()
    expect(Object.values(DarMetrics).every(report => vi.mocked(report).mock.calls.length === 0)).toBe(true)
    // The history section announces the refusal; the trends note must not announce it a second time
    expect(note.closest('[role="alert"], [role="status"], output')).toBeNull()
  })

  it('asks for no trends when the request history fails to load', async () => {
    viewAsAdmin()
    vi.mocked(DatasetMetrics.getStudyStats).mockRejectedValue(
      Object.assign(new Error('boom'), { response: { status: 500 } }),
    )
    mountComponent()

    const note = await screen.findByText(
      /Trends are unavailable because this study's data access request history could not be loaded just now/,
    )
    expect(screen.queryByRole('tab', { name: 'Volume' })).not.toBeInTheDocument()
    expect(Object.values(DarMetrics).every(report => vi.mocked(report).mock.calls.length === 0)).toBe(true)
    // The history section announces the failure; the trends note must not announce it a second time
    expect(screen.getByText('Unable to load data access requests.')).toHaveAttribute('role', 'alert')
    expect(note.closest('[role="alert"], [role="status"], output')).toBeNull()
  })

  /**
   * A failure may keep an earlier history on the page, but it is not an answer that the reader
   * may see it now, so the trends go and are not asked for again until the history loads.
   */
  it.each([
    ['requests', [grantedDar('dar-1')]],
    ['no requests', []],
  ])('takes the trends off the page when a refetch of a history with %s fails', async (_what, history) => {
    viewAsAdmin()
    vi.mocked(DatasetMetrics.getStudyStats)
      .mockResolvedValueOnce(history)
      .mockRejectedValue(Object.assign(new Error('boom'), { response: { status: 500 } }))
    mountComponent()
    await screen.findByRole('tab', { name: 'Volume' })
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalled())
    vi.mocked(DarMetrics.getVolume).mockClear()

    await queryClient.invalidateQueries({ queryKey: ['study-dar-history'] })

    expect(await screen.findByText(/Trends are unavailable because this study's data access request history could not be loaded just now/))
      .toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Volume' })).not.toBeInTheDocument()
    expect(DarMetrics.getVolume).not.toHaveBeenCalled()
  })

  /** A refetch that hasn't answered is not a failure: the open tab and its figures stay put. */
  it('keeps the trends, and the open tab, up while the history refetches', async () => {
    viewAsAdmin()
    let answer: (history: never[]) => void = () => {}
    vi.mocked(DatasetMetrics.getStudyStats)
      .mockResolvedValueOnce([])
      .mockReturnValueOnce(new Promise((resolve) => {
        answer = resolve
      }))
    mountComponent()
    fireEvent.click(await screen.findByRole('tab', { name: 'Decisions' }))
    const refetch = queryClient.invalidateQueries({ queryKey: ['study-dar-history'] })
    await waitFor(() => expect(DatasetMetrics.getStudyStats).toHaveBeenCalledTimes(2))

    // In flight: nothing has been taken down
    expect(screen.getByRole('tab', { name: 'Decisions' })).toHaveAttribute('aria-selected', 'true')

    answer([])
    await refetch
    expect(screen.getByRole('tab', { name: 'Decisions' })).toHaveAttribute('aria-selected', 'true')
  })

  it('brings the trends back once the history loads again after a failure', async () => {
    viewAsAdmin()
    let failNext = false
    vi.mocked(DatasetMetrics.getStudyStats).mockImplementation(() =>
      (failNext ? Promise.reject(Object.assign(new Error('boom'), { response: { status: 500 } })) : Promise.resolve([])))
    mountComponent()
    await screen.findByRole('tab', { name: 'Volume' })

    failNext = true
    await queryClient.invalidateQueries({ queryKey: ['study-dar-history'] })
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Volume' })).not.toBeInTheDocument())

    failNext = false
    await queryClient.invalidateQueries({ queryKey: ['study-dar-history'] })
    expect(await screen.findByRole('tab', { name: 'Volume' })).toBeInTheDocument()
  })

  it('takes the trends off the page when the server refuses the history on refetch', async () => {
    viewAsAdmin()
    vi.mocked(DatasetMetrics.getStudyStats)
      .mockResolvedValueOnce([grantedDar('dar-1')])
      .mockRejectedValue(forbidden())
    mountComponent()
    await screen.findByRole('tab', { name: 'Volume' })
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalled())
    vi.mocked(DarMetrics.getVolume).mockClear()

    await queryClient.invalidateQueries({ queryKey: ['study-dar-history'] })

    const note = await screen.findByText(
      /Trends are shown to those who can see this study's data access request history/,
    )
    expect(note.closest('[role="alert"], [role="status"], output')).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Volume' })).not.toBeInTheDocument()
    expect(DarMetrics.getVolume).not.toHaveBeenCalled()
    expect(darHistoryHeading().textContent).toBe('Data Access Requests for this Study')
  })

  /**
   * Volume, decisions and turnaround count requests that were denied or are still pending. Those
   * are for admins and the DAC in charge; reading the study is not enough to be offered them.
   */
  it('offers a reader who is neither an admin nor on the DAC only the report on granted access', async () => {
    mountComponent()

    expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    await waitFor(() => expect(DarMetrics.getRenewals).toHaveBeenCalledWith(
      expect.objectContaining({ target: { kind: 'study', id: '1' } }),
    ))
    expect(DarMetrics.getExpirations).toHaveBeenCalled()
    requestActivityReports.forEach(report => expect(report).not.toHaveBeenCalled())
  })

  it('offers every report to a chair of the DAC in charge of the study\'s datasets', async () => {
    viewAsChairOf(0)
    mountComponent()

    expect(await screen.findByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('tab').map(tab => tab.textContent))
      .toEqual(['Volume', 'Decisions', 'Expiration & Renewal', 'DAC Turnaround'])
    await waitFor(() => expect(DarMetrics.getVolume).toHaveBeenCalled())
    // A study can be shared between DACs, so the page says whose datasets a chair's figures cover
    expect(screen.getByText(/count requests for the datasets your DACs are in charge of/)).toBeInTheDocument()
    // The section waited to learn which DAC is in charge: it never showed the open report first
    expect(DarMetrics.getExpirations).not.toHaveBeenCalled()
  })

  it('says nothing about scope to an admin, whose figures cover the whole study', async () => {
    viewAsAdmin()
    mountComponent()
    await screen.findByRole('tab', { name: 'Volume' })

    expect(screen.queryByText(/count requests for the datasets your DACs are in charge of/)).not.toBeInTheDocument()
  })

  /**
   * Only a chair or member has to wait on which DACs are in charge. Until the study's datasets
   * load, the section shows neither the tabs they may get nor the single report they may be left
   * with, so it never shows one and then the other.
   */
  it('waits for the study\'s datasets before deciding what to offer a chair', async () => {
    let answer: (response: never) => void = () => {}
    vi.mocked(DataSet.searchDatasetIndexV2).mockReturnValue(new Promise((resolve) => {
      answer = resolve
    }))
    viewAsChairOf(0)
    mountComponent()
    await screen.findByRole('heading', { name: 'Data Access Requests for this Study (0)' })

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Expiration and renewal' })).not.toBeInTheDocument()
    expect(Object.values(DarMetrics).every(report => vi.mocked(report).mock.calls.length === 0)).toBe(true)

    answer(makeSearchResponse() as never)

    expect(await screen.findByRole('tab', { name: 'Volume' })).toBeInTheDocument()
  })

  it('does not make a reader on no DAC wait for the study\'s datasets', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockReturnValue(new Promise(() => {}))
    mountComponent()

    expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
  })

  it('offers a chair of another DAC only the report on granted access', async () => {
    viewAsChairOf(9)
    mountComponent()

    expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    requestActivityReports.forEach(report => expect(report).not.toHaveBeenCalled())
  })

  /**
   * The grid holds one page of the study. A DAC in charge of a dataset on a later page is still in
   * charge, so a chair or member is checked against the whole study.
   */
  it('finds the DAC in charge on a later page of a study larger than one page', async () => {
    const onLaterPage = { ...datasets[0], datasetId: 999, datasetIdentifier: 'DUOS-000999', dacId: 7 }
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) =>
      (query.size === 30
        ? makeSearchResponse([...datasets, onLaterPage], 30)
        : makeSearchResponse(datasets, 30)) as never)
    viewAsChairOf(7)
    mountComponent()

    expect(await screen.findByRole('tab', { name: 'Decisions' })).toBeInTheDocument()
  })

  /** The answer can only change for a chair or member, so no one else pays for the lookup. */
  it.each([
    ['an admin', { isAdmin: true }],
    ['a reader on no DAC', { isAdmin: false, roles: [] }],
  ])('does not look across a larger study for %s', async (_who, user) => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async () => makeSearchResponse(datasets, 30) as never)
    viewAs(user as Partial<DuosUser>)
    mountComponent()
    await screen.findByRole('region', { name: user.isAdmin ? 'Volume' : 'Expiration and renewal' })

    const studyWide = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls
      .filter(([query]) => (query as ElasticsearchQuery).size === 30)
    // The one study-wide request is the selection's, which every reader makes
    expect(studyWide).toHaveLength(1)
  })

  /** A lookup that fails leaves the reports unoffered; consent would have been asked otherwise. */
  it('offers a chair only the report on granted access when the study-wide lookup fails', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
      if (query.size === 30) throw new Error('lookup failed')
      return makeSearchResponse(datasets, 30) as never
    })
    // In charge of the datasets on the grid page, so only the failed lookup withholds the reports
    viewAsChairOf(0)
    mountComponent()

    expect(await screen.findByRole('region', { name: 'Expiration and renewal' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    requestActivityReports.forEach(report => expect(report).not.toHaveBeenCalled())
  })

  /**
   * React Query keeps the last good data while reporting a failed background refetch. A transient
   * failure is not a reason to take correct rows off the page - unlike a 403, which is.
   */
  it('keeps loaded request history when a background refetch fails', async () => {
    vi.mocked(DatasetMetrics.getStudyStats)
      .mockResolvedValueOnce([{
        projectTitle: 'Cancer genomics', referenceId: 'dar-1', darCode: 'DAR-1',
        nonTechRus: 'Study cancer outcomes.', expired: false,
        institutionName: 'Research University', submissionDate: Date.now(), updateDate: Date.now(),
      }] as never)
      .mockRejectedValue(Object.assign(new Error('boom'), { response: { status: 500 } }))
    mountComponent()
    await screen.findByText('Cancer genomics')

    await queryClient.invalidateQueries()

    await waitFor(() => expect(screen.getByText('Cancer genomics')).toBeInTheDocument())
    expect(screen.queryByText('Unable to load data access requests.')).not.toBeInTheDocument()
  })

  /** A refusal is different: once the server says no, the cached history comes off the page. */
  it('drops loaded request history when the server refuses on refetch', async () => {
    vi.mocked(DatasetMetrics.getStudyStats)
      .mockResolvedValueOnce([{
        projectTitle: 'Cancer genomics', referenceId: 'dar-1', darCode: 'DAR-1',
        nonTechRus: 'Study cancer outcomes.', expired: false,
        institutionName: 'Research University', submissionDate: Date.now(), updateDate: Date.now(),
      }] as never)
      .mockRejectedValue(Object.assign(new Error('nope'), { response: { status: 403 } }))
    mountComponent()
    await screen.findByText('Cancer genomics')

    await queryClient.invalidateQueries()

    await waitFor(() =>
      expect(screen.queryByText('Cancer genomics')).not.toBeInTheDocument())
    expect(await screen.findByText(/do not have access to this study's data access request history/i))
      .toBeInTheDocument()
  })

  /** Same rule for the research outputs section. */
  /**
   * The same rule for the recommendation sections, driven through a real failed refetch rather
   * than by handing the component both props at once - the carousel is presentational, so this is
   * what proves the wiring in StudyDetails hands it cached data alongside the error.
   */
  /**
   * A similarity query matches the current study perfectly, so it can come back among its own
   * results. That card would link to the page already open: the route never changes, so nothing
   * happens and the click looks broken.
   */
  it('does not recommend the study being viewed', async () => {
    vi.mocked(StudyRecommendations.getSimilar).mockResolvedValue([
      recommendation({ studyId: 1, studyName: 'This very study', piName: 'Dr Self', datasetIds: [1] }),
      recommendation({ studyId: 7, studyName: 'Neighbouring study', datasetIds: [2] }),
    ])
    mountComponent()

    expect(await screen.findByText('Neighbouring study')).toBeInTheDocument()
    expect(screen.queryByText('This very study')).not.toBeInTheDocument()
  })

  it('keeps loaded recommendations when a background refetch fails', async () => {
    vi.mocked(StudyRecommendations.getSimilar)
      .mockResolvedValueOnce([recommendation({
        studyDescription: 'About genes', piName: 'Dr Adjacent', datasetCount: 2, datasetIds: [1, 2],
      })])
      .mockRejectedValue(new Error('boom'))
    mountComponent()
    await screen.findByText('Neighbouring study')

    await queryClient.invalidateQueries()

    await waitFor(() => expect(screen.getByText('Neighbouring study')).toBeInTheDocument())
    expect(screen.queryByText('Unable to load study recommendations.')).not.toBeInTheDocument()
  })

  it('keeps loaded research outputs when a background refetch fails', async () => {
    vi.mocked(DatasetMetrics.getResearchOutputs)
      .mockResolvedValueOnce({
        presentations: [{ title: 'ASHG 2025 talk' }], publications: [], intellectualProperties: [],
      } as never)
      .mockRejectedValue(new Error('boom'))
    mountComponent()
    // The group label, not an entry: the groups start collapsed
    await screen.findByText('Presentations (1)')

    await queryClient.invalidateQueries()

    await waitFor(() => expect(screen.getByText('Presentations (1)')).toBeInTheDocument())
    expect(screen.queryByText('Unable to load secondary research outputs.')).not.toBeInTheDocument()
  })

  it('still reports a genuine failure of the study history as an error', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockRejectedValue(
      Object.assign(new Error('boom'), { response: { status: 500 } }),
    )
    mountComponent()

    expect(await screen.findByText('Unable to load data access requests.')).toBeInTheDocument()
    expect(screen.queryByText(/do not have access to this study's/i)).not.toBeInTheDocument()
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

  /**
   * Paging used to refetch every loaded page first, which cost a request per page on every click
   * and left more chances to fail. The id-keyed dedupe is what actually protects the list from a
   * boundary comment repeating, so this pins both: one request per click, and a repeat that
   * neither duplicates a row nor hides the rest.
   */
  it('asks only for the next page, and survives a repeated boundary comment', async () => {
    const comment = (id: number) => ({
      studyCommentId: id, studyId: 1, userId: 100 + id, rating: 4,
      commentText: `Comment ${id}`, createDate: '', updateDate: '',
      displayName: `Reviewer ${id}`, institutionName: 'Broad',
    })
    vi.mocked(StudyComments.listComments)
      .mockResolvedValueOnce({ comments: [comment(2)], averageRating: 4, total: 3 } as never)
      // Someone posts mid-paging, so the server repeats comment 2 on the next offset.
      .mockResolvedValueOnce({ comments: [comment(2), comment(1)], averageRating: 4, total: 3 } as never)
    const user = userEvent.setup()
    mountComponent()

    await screen.findByText('Comment 2')
    await user.click(screen.getByRole('button', { name: /Show more comments/ }))

    expect(await screen.findByText('Comment 1')).toBeInTheDocument()
    expect(screen.getAllByText('Comment 2')).toHaveLength(1)
    // One request per click - offset 0, then offset 1 - not a refetch of everything loaded.
    expect(vi.mocked(StudyComments.listComments).mock.calls.map(([, offset]) => offset))
      .toEqual([0, 1])
    // Three rows have been handed over but only two are distinct, and the study has three. Counted
    // raw, that reads as complete and 'Show more' disappears with a comment still unseen.
    expect(screen.getByRole('button', { name: /Show more comments/ })).toBeInTheDocument()
  })

  /**
   * A refetch failing in the background - the one after a successful post, for instance - used to
   * swap the whole section for an error, discarding the loaded comments and whatever the reader
   * had typed but not yet saved.
   */
  it('keeps loaded comments and the draft when a background refetch fails', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    vi.mocked(StudyComments.listComments)
      .mockResolvedValueOnce({
        total: 2,
        averageRating: 4,
        comments: [{
          studyCommentId: 1, studyId: 1, userId: 7, rating: 4, commentText: 'Comment 1',
          createDate: '', updateDate: '', displayName: 'Reviewer', institutionName: 'Broad',
        }],
      } as never)
      .mockRejectedValueOnce(new Error('refresh failed'))
    const user = userEvent.setup()
    mountComponent()

    await screen.findByText('Comment 1')
    await user.type(screen.getByLabelText('Comment'), 'my draft')
    await user.click(screen.getByRole('button', { name: /Show more comments/ }))

    expect(await screen.findByText(/Couldn't refresh comments just now/i)).toBeInTheDocument()
    expect(screen.getByText('Comment 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Comment')).toHaveValue('my draft')
    expect(screen.queryByText('Unable to load comments and ratings.')).not.toBeInTheDocument()
  })

  /** onSuccess re-seeds both fields from the saved copy, so typing mid-flight was thrown away. */
  it('freezes the composer while the comment is being posted', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    vi.mocked(StudyComments.postComment).mockReturnValue(new Promise(() => {}) as never)
    const user = userEvent.setup()
    mountComponent()

    await screen.findByLabelText('Comment')
    fireEvent.click(screen.getByRole('radio', { name: '4 Stars' }))
    await user.click(screen.getByRole('button', { name: 'Post comment' }))

    await waitFor(() => expect(screen.getByLabelText('Comment')).toBeDisabled())
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

  it('shows granted DAR details and expands the research use statement and summary', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockResolvedValueOnce([{
      projectTitle: 'Cancer genomics', referenceId: 'dar-1', darCode: 'DAR-1',
      rus: 'Whole-genome association analysis of tumour samples.',
      nonTechRus: 'Study cancer outcomes.', expired: false,
      institutionName: 'Research University', submissionDate: Date.now(), updateDate: Date.now(),
    }])
    const user = userEvent.setup()
    mountComponent()

    expect(await screen.findByText('Cancer genomics')).toBeInTheDocument()
    expect(screen.getByText('Institution: Research University')).toBeInTheDocument()
    // The card names the institution a grant went to. That it names no requester is enforced where
    // it can actually fail - MetricsResourceTest pins the served field set - rather than here,
    // where the type no longer has the field and any assertion would be restating the compiler.
    expect(screen.getByText('Current')).toBeInTheDocument()
    // Both stay hidden until asked for, then each appears under its own label
    expect(screen.queryByText('Whole-genome association analysis of tumour samples.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show research use statement and summary' }))
    expect(screen.getByText('Research Use Statement')).toBeInTheDocument()
    expect(screen.getByText('Whole-genome association analysis of tumour samples.')).toBeInTheDocument()
    expect(screen.getByText('Non-Technical Summary')).toBeInTheDocument()
    expect(screen.getByText('Study cancer outcomes.')).toBeInTheDocument()
  })

  it('offers the research use statement when a grant has no non-technical summary', async () => {
    vi.mocked(DatasetMetrics.getStudyStats).mockResolvedValueOnce([{
      projectTitle: 'Cancer genomics', referenceId: 'dar-1', darCode: 'DAR-1',
      rus: 'Whole-genome association analysis of tumour samples.',
      nonTechRus: '', expired: false,
      institutionName: 'Research University', submissionDate: Date.now(), updateDate: Date.now(),
    }])
    const user = userEvent.setup()
    mountComponent()

    await user.click(await screen.findByRole('button', { name: 'Show research use statement and summary' }))
    expect(screen.getByText('Whole-genome association analysis of tumour samples.')).toBeInTheDocument()
    expect(screen.queryByText('Non-Technical Summary')).not.toBeInTheDocument()
  })

  it('shows the public identity disclosure to active researchers before posting', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    expect(await screen.findByText('Your name and institution will be shared publicly with this comment.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled()
  })

  /**
   * A chairperson or signing official can hold a library card without the Researcher role. Naming
   * only the card would tell them they lack a status they already have, so the notice names the
   * requirement that is actually missing.
   */
  /** The core write path: nothing else in the suite invokes the mutation. */
  it('posts a new comment with the rating and text the composer holds', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    vi.mocked(StudyComments.postComment).mockResolvedValue({} as never)
    const user = userEvent.setup()
    mountComponent()

    await screen.findByText('Add your comment')
    // MUI Rating's radios are visually hidden, so pointer interaction is refused; fireEvent
    // sets the value the way the control itself does.
    fireEvent.click(screen.getByRole('radio', { name: '4 Stars' }))
    await user.type(screen.getByLabelText('Comment'), 'Useful study')
    await user.click(screen.getByRole('button', { name: 'Post comment' }))

    await waitFor(() =>
      expect(StudyComments.postComment).toHaveBeenCalledWith('1', 4, 'Useful study'))
  })

  /**
   * A second post revises in place, and the composer re-seeds from what was saved rather than
   * blanking, so the reader can see the comment as it now stands.
   */
  it('saves an edit and re-seeds the composer from the refreshed comment', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: true, libraryCard: {} as LibraryCard,
    } as DuosUser)
    const mine = {
      studyCommentId: 7, studyId: 1, userId: 42, rating: 3, commentText: 'First take',
      createDate: '', updateDate: '', displayName: 'Me', institutionName: 'Broad',
    }
    vi.mocked(StudyComments.listComments)
      .mockResolvedValueOnce({ comments: [mine], averageRating: 3, total: 1, yourComment: mine } as never)
      .mockResolvedValue({
        comments: [{ ...mine, rating: 5, commentText: 'Revised take' }],
        averageRating: 5,
        total: 1,
        yourComment: { ...mine, rating: 5, commentText: 'Revised take' },
      } as never)
    vi.mocked(StudyComments.postComment).mockResolvedValue({} as never)
    const user = userEvent.setup()
    mountComponent()

    // Seeded from the existing comment, so this is an edit rather than a first post
    expect(await screen.findByText('Edit your comment')).toBeInTheDocument()
    const field = screen.getByLabelText('Comment')
    expect(field).toHaveValue('First take')

    await user.clear(field)
    await user.type(field, 'Revised take')
    fireEvent.click(screen.getByRole('radio', { name: '5 Stars' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(StudyComments.postComment).toHaveBeenCalledWith('1', 5, 'Revised take'))
    // Re-seeded from the refetched comment rather than cleared
    await waitFor(() => expect(screen.getByLabelText('Comment')).toHaveValue('Revised take'))
  })

  it('names the missing role when the card is held', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({
      userId: 42, isResearcher: false, libraryCard: {} as LibraryCard,
    } as DuosUser)
    mountComponent()

    expect(await screen.findByText(
      'Commenting on and rating a study is limited to users with the Researcher role.',
    )).toBeInTheDocument()
    expect(screen.queryByText('Add your comment')).not.toBeInTheDocument()
  })

  it('names both requirements when neither is held', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 42, isResearcher: false } as DuosUser)
    mountComponent()

    expect(await screen.findByText(
      'Commenting on and rating a study requires the Researcher role and Active Researcher Status.',
    )).toBeInTheDocument()
  })

  it('names the missing card when the Researcher role is held', async () => {
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

  /**
   * A refetch that fails while rows are on screen leaves data intact and sets error. Reporting
   * that would replace a populated table with a line of error text, which is the opposite of the
   * background-refetch behaviour the section promises.
   */
  it('keeps the asset rows up when a refetch fails', async () => {
    vi.mocked(Study.getModels)
      .mockResolvedValueOnce([{ modelId: 'm1', name: 'First Model', tags: [] }] as never)
    mountComponent()
    await screen.findByText('First Model')

    // The section reports a failure only when it has nothing to show
    expect(screen.queryByText('Unable to load AI models.')).not.toBeInTheDocument()
  })

  /**
   * The community grid always paginates, and hideFooter removes only the controls, so a study
   * with more assets than the default page size showed the first page and no way to the rest.
   */
  it('shows every asset rather than the first page of them', async () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      modelId: `m${i}`, name: `Model ${i}`, tags: [],
    }))
    vi.mocked(Study.getModels).mockResolvedValueOnce(many as never)
    const { container } = mountComponent()
    await screen.findByText('Model 0')

    // Scoped to the AI Models section: the datasets grid at the top of the page has a pager of
    // its own, so an unscoped query would pass whatever this table did.
    const models = within(container.querySelector('#models') as HTMLElement)
    // The community grid refuses a page size above 100, so the rest are reached by paging. The
    // footer is what makes them reachable; hidden, the remaining assets had no route at all.
    expect(models.getByRole('button', { name: /next page/i })).toBeEnabled()
  })

  /** No paging chrome on the small tables that are the common case. */
  it('hides the footer when every asset fits on one page', async () => {
    vi.mocked(Study.getModels)
      .mockResolvedValueOnce([{ modelId: 'm1', name: 'Only Model', tags: [] }] as never)
    const { container } = mountComponent()
    await screen.findByText('Only Model')

    const models = within(container.querySelector('#models') as HTMLElement)
    expect(models.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument()
  })

  it('renders a row per asset even when the registered ids are blank', async () => {
    // Registration payloads routinely carry an empty modelId; two of them are one row id to
    // the grid, which would drop an asset from the page without saying so.
    vi.mocked(Study.getModels).mockResolvedValueOnce([
      { modelId: '', name: 'First Model', tags: [] },
      { modelId: '', name: 'Second Model', tags: [] },
    ] as never)
    mountComponent()

    expect(await screen.findByText('First Model')).toBeInTheDocument()
    expect(screen.getByText('Second Model')).toBeInTheDocument()
  })

  it('drops the library Study column from a single-study asset table', async () => {
    // The reused column set carries it for the cross-study library view; here the study is
    // the page, and these endpoints return no study name to fill the cell with.
    vi.mocked(Study.getModels).mockResolvedValueOnce([
      { modelId: 'model-1', name: 'First Model', tags: [] },
    ] as never)
    mountComponent()

    await screen.findByText('First Model')
    expect(screen.getByRole('columnheader', { name: 'Model Name' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Study' })).not.toBeInTheDocument()
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
