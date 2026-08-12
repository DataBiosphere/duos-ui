import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataLibrary } from 'src/pages/DataLibrary'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import { BoolQuery, ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { getRadarEnabledDatasetsWithRules } from 'src/utils/DatasetUtils'
import { DuosUser } from 'src/types/model'
import { EnumerateSnapshotModel } from 'src/types/tdrModel'

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { searchDatasetIndexV2: vi.fn() },
}))
vi.mock('src/utils/DatasetUtils', () => ({
  getRadarEnabledDatasetsWithRules: vi.fn(),
  getSoApprovalModelByDatasetId: vi.fn(() => new Map()),
}))

const ACCESS_REQUEST_PROCESS_LABEL = 'Access Request Process'
const CLEAR_FILTERS_LABEL = 'Clear'
const CONFIG_PATH = '/config.json'
const DATA_GRID_ROW_SELECTOR = '.MuiDataGrid-row'
const DATASETS_TAB_PATH = '/?tab=datasets'
const DUOS_DATA_LIBRARY_TITLE = 'DUOS Data Library'
const EXPORT_LABEL = 'Export to...'
const FOOTER_SELECTOR = '[data-cy="library-footer"]'
const SEARCH_INPUT_SELECTOR = 'input[placeholder="Enter search terms"]'
const SHOW_FILTERS_BUTTON_SELECTOR = '[aria-label="Show filters"]'
const STUDIES_TAB_PATH = '/?tab=studies'
const VIA_DUOS_LABEL = 'via DUOS'

type TestQuery = ElasticsearchQuery & {
  aggs?: { studies?: unknown }
  size?: number
}

type SearchDatasetResponse = Awaited<ReturnType<typeof DataSet.searchDatasetIndexV2>>
type SnapshotListResponse = Awaited<ReturnType<typeof TerraDataRepo.listSnapshotsByDatasetIds>>

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolveDeferred: Deferred<T>['resolve'] = () => {}
  const promise = new Promise<T>(resolve => resolveDeferred = resolve)
  return { promise, resolve: resolveDeferred }
}

const asTestQuery = (query: ElasticsearchQuery): TestQuery => query as TestQuery

const asSearchResponse = (response: unknown): SearchDatasetResponse => response as unknown as ElasticsearchResponse

const asDuosUser = (user: unknown): DuosUser => user as DuosUser

const hasTerm = (query: QueryClause, field: string, value: string | number | boolean) =>
  'term' in query && query.term?.[field] === value

const getLabelControl = <T extends HTMLElement>(labelText: string, role: string): T => {
  const label = screen.getAllByText(labelText)
    .map(el => el.closest('label'))
    .find((el): el is HTMLLabelElement => el !== null)
  expect(label).toBeInTheDocument()
  return within(label as HTMLElement).getByRole(role) as T
}

const getFilterToggleButton = (selector: string): HTMLElement => {
  const button = document.querySelector<HTMLElement>(selector)
  expect(button).toBeInTheDocument()
  return button as HTMLElement
}

const queryRows = () => document.querySelectorAll(DATA_GRID_ROW_SELECTOR)

const getSingleDataGridRow = async (): Promise<Element> => {
  await waitFor(() => expect(queryRows()).toHaveLength(1))
  return queryRows()[0]
}

const getRowCheckbox = (row: Element): HTMLInputElement => {
  const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]')
  expect(checkbox).toBeInTheDocument()
  return checkbox as HTMLInputElement
}

const mockTdrSnapshotResponse = (id: string, role: string) => ({
  filteredTotal: 1,
  total: 1,
  items: [{ id, name: 'Snapshot ABC', duosId: 'DUOS-000001', cloudPlatform: 'gcp', resourceLocks: {} }],
  roleMap: { [id]: [role] },
  errors: [],
}) satisfies SnapshotListResponse

// Mock fetch for /config.json (replaces cy.initApplicationConfig())
const mockConfig = {
  env: 'ci', hash: '', tag: '', bardApiUrl: '', apiUrl: '',
  terraUrl: '', tdrApiUrl: '', ecmApiUrl: '', features: {},
}
const originalFetch = globalThis.fetch
globalThis.fetch = vi.fn((...args: Parameters<typeof fetch>) => {
  const [url] = args
  if (url === CONFIG_PATH || (typeof url === 'string' && url.endsWith?.(CONFIG_PATH))) {
    return Promise.resolve(new Response(JSON.stringify(mockConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
  if (typeof originalFetch !== 'function') {
    throw new Error('globalThis.fetch is not available in this test environment')
  }
  return originalFetch(...args)
}) as typeof fetch

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver

  Element.prototype.scrollIntoView = () => {}
})

const mockMetadataResponse = {
  aggregations: {
    dac: { buckets: [{ key: 'DAC-1', doc_count: 5 }] },
    data_type: { buckets: [{ key: 'Genomic', doc_count: 10 }] },
  },
}

const mockDatasetsResponse = {
  hits: {
    total: { value: 1 },
    hits: [
      {
        _source: {
          datasetId: 1,
          datasetName: 'Dataset One',
          datasetIdentifier: 'DUOS-000001',
          accessManagement: 'controlled',
          study: {
            studyId: 101,
            studyName: 'Study One',
          },
        },
      },
    ],
  },
}

const mockStudiesResponse = {
  aggregations: {
    total_studies: { value: 2 },
    datasets_count: { doc_count: 1 },
    studies: {
      buckets: [
        {
          key: { study_id: 101 },
          study_details: { hits: { hits: [{ _source: { study: { studyName: 'Study One', description: 'Desc One' } } }] } },
          dataset_count: { value: 5 },
          total_participants: { value: 100 },
          dataset_ids: { buckets: [{ key: 1 }, { key: 2 }] },
        },
      ],
    },
  },
}

const emptyTdrResponse = { filteredTotal: 0, total: 0, items: [], roleMap: {}, errors: [] } satisfies EnumerateSnapshotModel

const defaultUser = asDuosUser({
  libraryCard: {
    id: 1,
    userId: 123,
    userName: 'Test User',
    userEmail: 'test@example.com',
    createDate: new Date(),
    createUserId: 123,
  },
})

const LocationDisplay = () => {
  const { search } = useLocation()
  return <div data-testid="location">{search}</div>
}

const makeQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

let queryClient: QueryClient

const renderLibrary = (path = '/') => render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[path]}>
      <DataLibrary />
      <LocationDisplay />
    </MemoryRouter>
  </QueryClientProvider>,
)

const renderLibraryInStrictMode = (path = '/') => render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[path]}>
      <React.StrictMode>
        <DataLibrary />
      </React.StrictMode>
    </MemoryRouter>
  </QueryClientProvider>,
)

const renderBranded = (path: string) => render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/datalibrary2/:query" element={<DataLibrary />} />
        <Route path="/datalibrary2" element={<DataLibrary />} />
        <Route path="/profile" element={<div>Profile</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  </QueryClientProvider>,
)

beforeEach(() => {
  queryClient = makeQueryClient()

  vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
    const q = asTestQuery(query)
    if (q.aggs?.studies) return asSearchResponse(mockStudiesResponse)
    if (q.size === 0) return asSearchResponse(mockMetadataResponse)
    return asSearchResponse(mockDatasetsResponse)
  })
  vi.mocked(getRadarEnabledDatasetsWithRules).mockResolvedValue(new Set())

  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(defaultUser)
  vi.spyOn(TerraDataRepo, 'listSnapshotsByDatasetIds').mockResolvedValue(emptyTdrResponse)
  vi.spyOn(Metrics, 'captureEvent').mockImplementation(() => Promise.resolve())
  vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DataLibrary', () => {
  it('renders the data library page', async () => {
    renderLibrary('/')
    expect(await screen.findByText(DUOS_DATA_LIBRARY_TITLE)).toBeInTheDocument()
    expect(await screen.findByText(/Search, filter, and select datasets/)).toBeInTheDocument()
    expect(document.querySelector(SEARCH_INPUT_SELECTOR)).toBeInTheDocument()
  })

  // Requirement 2: the SO reminder is page-level, not tied to the Datasets tab
  it.each([
    ['the default tab', '/'],
    ['the Datasets tab', DATASETS_TAB_PATH],
  ])('shows the Signing Official approval reminder on %s', async (_label, path) => {
    renderLibrary(path)
    expect(await screen.findByText(/require Signing Officials to approve/)).toBeInTheDocument()
  })

  it('shows an error message when the dataset query fails', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockRejectedValue(new Error('boom'))

    renderLibrary(DATASETS_TAB_PATH)

    expect(await screen.findByText('Error Loading Data', {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('renders filter categories', async () => {
    renderLibrary('/')
    // Wait for render; use toHaveTextContent since some labels also appear as DataGrid column headers
    await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)
    expect(document.body).toHaveTextContent('Data Use')
    expect(document.body).toHaveTextContent('Data Type')
    expect(document.body).toHaveTextContent('Participants')
  })

  it('toggles filters and updates URL state', async () => {
    const user = userEvent.setup()
    renderLibrary('/')
    await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)

    const checkbox = getLabelControl<HTMLInputElement>(VIA_DUOS_LABEL, 'checkbox')
    await user.click(checkbox)

    await waitFor(() => expect(screen.getByText(CLEAR_FILTERS_LABEL)).toBeInTheDocument())
    expect(checkbox).toBeChecked()
  })

  it('clears all filters', async () => {
    const user = userEvent.setup()
    renderLibrary('/?access=controlled')
    await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)

    await user.click(screen.getByText(CLEAR_FILTERS_LABEL))

    await waitFor(() => {
      const checkbox = getLabelControl<HTMLInputElement>(VIA_DUOS_LABEL, 'checkbox')
      expect(checkbox).not.toBeChecked()
    })
    await waitFor(() => expect(screen.queryByText(CLEAR_FILTERS_LABEL)).not.toBeInTheDocument())
  })

  it('initializes tab based on URL search params', async () => {
    renderLibrary(DATASETS_TAB_PATH)
    await screen.findByText(DUOS_DATA_LIBRARY_TITLE)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Datasets/i })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: /Studies/i })).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('shows filter panel by default', async () => {
    renderLibrary('/')
    expect(await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)).toBeInTheDocument()
    expect(document.querySelector('[aria-label="Collapse filters"]')).toBeInTheDocument()
  })

  it('hides filter panel when hideFilters=true is in the URL', async () => {
    renderLibrary('/?hideFilters=true')
    await screen.findByText(DUOS_DATA_LIBRARY_TITLE)

    await waitFor(() => expect(screen.queryByText(ACCESS_REQUEST_PROCESS_LABEL)).not.toBeInTheDocument())
    expect(document.querySelector(SHOW_FILTERS_BUTTON_SELECTOR)).toBeInTheDocument()
  })

  it('collapses filter panel when the toggle button is clicked', async () => {
    const user = userEvent.setup()
    renderLibrary('/')
    await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)

    await user.click(getFilterToggleButton('[aria-label="Collapse filters"]'))

    await waitFor(() => expect(screen.queryByText(ACCESS_REQUEST_PROCESS_LABEL)).not.toBeInTheDocument())
    expect(document.querySelector(SHOW_FILTERS_BUTTON_SELECTOR)).toBeInTheDocument()
  })

  it('expands filter panel when expand button is clicked while collapsed', async () => {
    const user = userEvent.setup()
    renderLibrary('/?hideFilters=true')
    await screen.findByText(DUOS_DATA_LIBRARY_TITLE)

    await waitFor(() => expect(document.querySelector(SHOW_FILTERS_BUTTON_SELECTOR)).toBeInTheDocument())
    await user.click(getFilterToggleButton(SHOW_FILTERS_BUTTON_SELECTOR))

    expect(await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)).toBeInTheDocument()
    expect(document.querySelector('[aria-label="Collapse filters"]')).toBeInTheDocument()
  })

  it('switches tabs and updates URL state', async () => {
    const user = userEvent.setup()
    renderLibrary('/')
    await screen.findByText(DUOS_DATA_LIBRARY_TITLE)

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /Datasets/i })).toHaveAttribute('aria-selected', 'true'),
    )

    await user.click(screen.getByRole('tab', { name: /Studies/i }))

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Studies/i })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: /Datasets/i })).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('keeps filters set on other tabs and surfaces them as removable chips', async () => {
    const user = userEvent.setup()
    renderLibrary('/?tab=datasets&access=controlled&minParticipants=10')
    await screen.findByText(ACCESS_REQUEST_PROCESS_LABEL)
    expect(document.body).toHaveTextContent('Participants')
    expect(screen.getByText(CLEAR_FILTERS_LABEL)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Publications/i }))

    // Access Request Process and Participants are not part of the Publications
    // panel, so those accordion sections disappear...
    await waitFor(() => {
      expect(screen.queryByText(ACCESS_REQUEST_PROCESS_LABEL)).not.toBeInTheDocument()
    })

    // ...but the filters stay active: they are carried over as removable chips
    // under "Filters from other views" and remain in the URL, so filters
    // combine across tabs rather than being dropped on tab switch.
    expect(screen.getByText('Filters from other views')).toBeInTheDocument()
    const locationSearch = screen.getByTestId('location').textContent
    expect(locationSearch).toContain('access=')
    expect(locationSearch).toContain('minParticipants=')
  })

  it('applies row-level filtering for nested presentation rows when Datasets Cited is selected', async () => {
    const nestedPresentationResponse = {
      aggregations: {
        studies: {
          buckets: [
            {
              key: 501,
              doc_count: 1,
              study_details: {
                hits: {
                  hits: [
                    {
                      _source: {
                        study: {
                          studyId: 501,
                          studyName: 'Shared Study',
                          assets: {
                            presentations: [
                              {
                                presentationId: 'pres-match',
                                title: 'Nested Match Presentation',
                                citation: true,
                              },
                              {
                                presentationId: 'pres-non-match',
                                title: 'Nested Non-Match Presentation',
                                citation: false,
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    }

    vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
      const q = asTestQuery(query)
      if (q.aggs?.studies) return asSearchResponse(nestedPresentationResponse)
      return asSearchResponse(mockMetadataResponse)
    })

    renderLibrary('/?tab=presentations')

    expect(await screen.findByText('Nested Match Presentation')).toBeInTheDocument()
    expect(screen.getByText('Nested Non-Match Presentation')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Datasets Cited (Presentations)?'))
    await screen.findByText('Yes')

    fireEvent.click(getLabelControl<HTMLInputElement>('Yes', 'radio'))

    await waitFor(() => {
      expect(screen.queryByText('Nested Non-Match Presentation')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Nested Match Presentation')).toBeInTheDocument()
  })

  it('shows footer when a dataset is selected', async () => {
    renderLibrary(DATASETS_TAB_PATH)

    expect(document.querySelector(FOOTER_SELECTOR)).not.toBeInTheDocument()

    const row = await getSingleDataGridRow()

    fireEvent.click(getRowCheckbox(row))

    await waitFor(() => expect(document.querySelector(FOOTER_SELECTOR)).toBeInTheDocument())
    expect(screen.getByText(/1 dataset selected from 1 study/)).toBeInTheDocument()
  })

  it('shows footer when a study is selected', async () => {
    renderLibrary(STUDIES_TAB_PATH)

    const row = await getSingleDataGridRow()

    fireEvent.click(getRowCheckbox(row))

    await waitFor(() => expect(document.querySelector(FOOTER_SELECTOR)).toBeInTheDocument())
    expect(screen.getByText(/2 datasets selected from 1 study/)).toBeInTheDocument()
  })

  describe('tab counts', () => {
    const mountDefault = (tab = 'studies') => renderLibrary(`/?tab=${tab}`)

    // Every tab's count comes from a single dedicated tab-counts query
    // (`total_studies` and `datasets_count` aggregations), rendered as a badge on
    // the tab itself rather than a total-count header above the grid.
    it('shows the studies count as a badge on the Studies tab', async () => {
      mountDefault('studies')
      expect(await screen.findByLabelText('2 items')).toBeInTheDocument()
    })

    it('shows the datasets count as a badge derived from the tab-counts query', async () => {
      mountDefault('datasets')
      // `datasets_count.doc_count` on the shared studies response is 1.
      expect(await screen.findByLabelText('1 items')).toBeInTheDocument()
    })

    it('reflects an updated studies count from the tab-counts query', async () => {
      vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
        const q = asTestQuery(query)
        if (q.aggs?.studies) {
          return asSearchResponse({
            aggregations: {
              total_studies: { value: 42 },
              datasets_count: { doc_count: 1 },
              studies: {
                buckets: [
                  {
                    key: { study_id: 101 },
                    study_details: { hits: { hits: [{ _source: { study: { studyName: 'Only Study', description: '' } } }] } },
                    dataset_count: { value: 1 },
                    total_participants: { value: 50 },
                    dataset_ids: { buckets: [{ key: 1 }] },
                  },
                ],
              },
            },
          })
        }
        return asSearchResponse(mockMetadataResponse)
      })

      mountDefault('studies')
      expect(await screen.findByLabelText('42 items')).toBeInTheDocument()
    })

    it('omits the count badges until the tab-counts query resolves', async () => {
      const { promise: countsPromise, resolve: resolveCounts } = createDeferred<SearchDatasetResponse>()

      vi.mocked(DataSet.searchDatasetIndexV2).mockImplementation(async (query: ElasticsearchQuery) => {
        const q = asTestQuery(query)
        // The tab-counts query is the only one carrying the `datasets_count` agg.
        if (q.aggs?.datasets_count) return countsPromise
        if (q.aggs?.studies) return asSearchResponse(mockStudiesResponse)
        return asSearchResponse(mockMetadataResponse)
      })

      mountDefault('studies')

      // Rows render from the data query while the counts query is still pending,
      // so no count badge is shown yet.
      await getSingleDataGridRow()
      expect(screen.queryByLabelText('2 items')).not.toBeInTheDocument()

      resolveCounts(asSearchResponse(mockStudiesResponse))

      expect(await screen.findByLabelText('2 items')).toBeInTheDocument()
    })
  })

  describe('Export functionality', () => {
    it('queries TDR only once for the displayed datasets', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockTdrSnapshotResponse('snapshot-abc', 'reader'))

      renderLibraryInStrictMode(DATASETS_TAB_PATH)

      expect(await screen.findByText(EXPORT_LABEL)).toBeInTheDocument()
      expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledTimes(1)
      expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledWith(['DUOS-000001'])
    })

    it('does not show export buttons when TDR returns no snapshots', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(emptyTdrResponse)
      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(queryRows()).toHaveLength(1))
      expect(screen.queryByText(EXPORT_LABEL)).not.toBeInTheDocument()
    })

    it('shows export button when TDR returns a snapshot with reader role', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockTdrSnapshotResponse('snapshot-abc', 'reader'))

      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(queryRows()).toHaveLength(1))
      expect(await screen.findByText(EXPORT_LABEL)).toBeInTheDocument()
    })

    it('shows export button when TDR returns a snapshot with steward role', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockTdrSnapshotResponse('snapshot-xyz', 'steward'))

      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(queryRows()).toHaveLength(1))
      expect(await screen.findByText(EXPORT_LABEL)).toBeInTheDocument()
    })

    it('does not show export button for snapshots without reader or steward role', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockTdrSnapshotResponse('snapshot-abc', 'discoverer'))

      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(queryRows()).toHaveLength(1))
      expect(screen.queryByText(EXPORT_LABEL)).not.toBeInTheDocument()
    })

    it('does not show export buttons when on the Studies tab', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue({
        filteredTotal: 1, total: 1,
        items: [{ id: 'snap-1', name: 'Snap', duosId: 'DUOS-000001', cloudPlatform: 'gcp', resourceLocks: {} }],
        roleMap: { 'snap-1': ['reader'] },
        errors: [],
      })

      renderLibrary(STUDIES_TAB_PATH)

      await waitFor(() => expect(queryRows().length).toBeGreaterThanOrEqual(1))
      expect(TerraDataRepo.listSnapshotsByDatasetIds).not.toHaveBeenCalled()
      expect(screen.queryByText(EXPORT_LABEL)).not.toBeInTheDocument()
    })

    it('handles TDR API errors gracefully and shows no export buttons', async () => {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockRejectedValue(new Error('TDR API unavailable'))

      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(queryRows()).toHaveLength(1))
      expect(screen.queryByText(EXPORT_LABEL)).not.toBeInTheDocument()
    })
  })

  describe('Branded Data Libraries', () => {
    it('renders branded library based on URL parameter (broad)', async () => {
      renderBranded('/datalibrary2/broad')
      expect(await screen.findByText('Broad Data Library')).toBeInTheDocument()
      expect(await screen.findByText(/Search, filter, and select datasets/)).toBeInTheDocument()
    })

    it('renders branded library based on URL parameter (anvil)', async () => {
      renderBranded('/datalibrary2/anvil')
      expect(await screen.findByText('AnVIL Data Library')).toBeInTheDocument()
    })

    it('handles case-insensitive branded library query params', async () => {
      renderBranded('/datalibrary2/BROAD')
      expect(await screen.findByText('Broad Data Library')).toBeInTheDocument()
    })

    it('captures metrics for default library', async () => {
      renderBranded('/datalibrary2')
      await waitFor(() => expect(Metrics.captureEvent).toHaveBeenCalledWith(eventList.dataLibrary))
    })

    it('captures metrics with brand parameter for branded library', async () => {
      renderBranded('/datalibrary2/broad')
      await waitFor(() => expect(Metrics.captureEvent).toHaveBeenCalledWith(eventList.dataLibrary, { brand: 'broad' }))
    })

    it('renders myinstitution library with user institution', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue({
        userId: 123,
        institution: { id: 456, name: 'Test Institution' },
      } as DuosUser)

      renderBranded('/datalibrary2/myinstitution')
      expect(await screen.findByText('Test Institution Data Library')).toBeInTheDocument()
    })

    it('redirects to profile when accessing myinstitution without institution', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(asDuosUser({ userId: 123, institution: null }))

      renderBranded('/datalibrary2/myinstitution')
      await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
    })

    it('redirects to profile when accessing myinstitution without user', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(asDuosUser(null))

      renderBranded('/datalibrary2/myinstitution')
      await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
    })

    it('falls back to default library for unknown brand', async () => {
      renderBranded('/datalibrary2/unknownbrand')
      expect(await screen.findByText(DUOS_DATA_LIBRARY_TITLE)).toBeInTheDocument()
    })

    it('renders terra library without query filter', async () => {
      renderBranded('/datalibrary2/terra')
      expect(await screen.findByText('Terra Data Library')).toBeInTheDocument()
    })

    it('renders elwazi library with data type filter', async () => {
      renderBranded('/datalibrary2/elwazi')
      expect(await screen.findByText('eLwazi Data Library')).toBeInTheDocument()
    })

    it('sends correct query for controlled/open dataset approval logic', async () => {
      renderLibrary(DATASETS_TAB_PATH)

      await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalled())

      const calls = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls
      const datasetsCall = calls.find(([q]) => {
        const query = asTestQuery(q)
        return !query.aggs?.studies && (query.size ?? 0) > 0
      })
      expect(datasetsCall).toBeTruthy()

      const capturedQuery = datasetsCall?.[0]
      if (!capturedQuery) {
        throw new Error('Expected a datasets query call')
      }
      const topBool = capturedQuery.query?.bool
      if (!topBool) {
        throw new Error('Expected datasets query to include a top-level bool query')
      }
      expect(topBool.minimum_should_match).toBe(1)

      const should = topBool.should as BoolQuery[] | undefined
      if (!should) {
        throw new Error('Expected datasets query to include should clauses')
      }
      expect(should).toHaveLength(2)

      const mustNot = should[0]?.bool?.must_not
      expect(mustNot).toBeDefined()
      expect(mustNot?.[0]).toMatchObject({ term: { accessManagement: 'controlled' } })

      const mustArr = should[1]?.bool?.must
      expect(mustArr).toBeDefined()
      expect(mustArr?.some(q => hasTerm(q, 'accessManagement', 'controlled'))).toBe(true)
      expect(mustArr?.some(q => hasTerm(q, 'dacApproval', true))).toBe(true)
    })
  })

  describe('public visibility filter', () => {
    // The outer beforeEach seeds the implementation; clear accumulated call
    // history so each test only inspects its own render's queries.
    beforeEach(() => {
      vi.mocked(DataSet.searchDatasetIndexV2).mockClear()
    })

    const capturedDatasetsMust = async (): Promise<QueryClause[]> => {
      await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalled())
      const calls = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls
      const datasetsCall = calls.find(([q]) => {
        const query = asTestQuery(q)
        return !query.aggs?.studies && (query.size ?? 0) > 0
      })
      return datasetsCall?.[0].query?.bool.must ?? []
    }

    const hasVisibilityTerm = (must: QueryClause[]) =>
      must.some(q => hasTerm(q, 'study.publicVisibility', true))

    it('restricts a researcher to public studies', async () => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(defaultUser)
      renderLibrary(DATASETS_TAB_PATH)
      expect(hasVisibilityTerm(await capturedDatasetsMust())).toBe(true)
    })

    it.each([
      ['a chairperson', { isChairPerson: true }],
      ['a data submitter', { isDataSubmitter: true }],
      ['an admin', { isAdmin: true }],
      ['a signing official', { isSigningOfficial: true }],
    ])('does not restrict %s', async (_label, roleFlags) => {
      vi.mocked(Storage.getCurrentUser).mockReturnValue(asDuosUser({ ...defaultUser, ...roleFlags }))
      renderLibrary(DATASETS_TAB_PATH)
      expect(hasVisibilityTerm(await capturedDatasetsMust())).toBe(false)
    })
  })
})
