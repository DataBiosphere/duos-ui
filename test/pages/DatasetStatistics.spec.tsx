import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DatasetStatisticsDar } from 'src/types/model'
import { SnapshotSummaryModel } from 'src/types/tdrModel'

// Mock the AJAX modules
vi.mock('src/libs/ajax/DataSet')
vi.mock('src/libs/ajax/DatasetMetrics')
vi.mock('src/libs/ajax/TerraDataRepo')

// Mock fetch for config.json
const mockConfig = {
  env: 'ci',
  hash: '',
  tag: '',
  bardApiUrl: '',
  apiUrl: '',
  terraUrl: '',
  tdrApiUrl: '',
  ecmApiUrl: '',
  features: {},
}

const originalFetch = globalThis.fetch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.fetch = vi.fn((url: any) => {
  if (url === '/config.json' || url.endsWith?.('/config.json')) {
    return Promise.resolve(
      new Response(JSON.stringify(mockConfig), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }
  return originalFetch(url)
}) as typeof fetch

const mockDatasetTerm = {
  datasetId: 1,
  createUserId: 1,
  createUserDisplayName: 'Test User',
  datasetIdentifier: 'DUOS-000001',
  deletable: true,
  datasetName: 'Test Dataset',
  accessManagement: 'controlled',
  dataLocation: 'TDR Location',
  url: 'https://example.com/dataset',
  dacId: 1,
  dacApproval: true,
  approvedUserIds: [],
  piName: 'Dr. Test PI',
  dataUse: { primary: [] },
  study: {
    studyId: 101,
    studyName: 'Test Study',
    description: 'A test study',
    phenotype: 'Genomic',
    piName: 'Dr. Test PI',
    phsId: '',
    species: '',
    dataSubmitterEmail: '',
    dataSubmitterId: 1,
    dataCustodianEmail: ['custodian@example.com'],
    publicVisibility: true,
    dataTypes: [],
  },
  submitter: { userId: 1, displayName: 'Test User', institution: { id: 1, name: 'Test' } },
  updateUser: { userId: 1, displayName: 'Test User', institution: { id: 1, name: 'Test' } },
  dac: { dacId: 1, dacName: 'Test DAC', dacEmail: 'dac@test.org' },
  participantCount: 100,
}

const mockDarsResponse: DatasetStatisticsDar[] = [
  {
    darCode: 'DAR-001',
    projectTitle: 'Test Project',
    updateDate: new Date('2026-04-30').getTime(),
    expired: false,
    nonTechRus: 'A test data access request',
    referenceId: '12345',
  },
]

const buildSnapshot = (id: string, name: string): SnapshotSummaryModel => ({
  id,
  name,
  duosId: 'DUOS-000001',
  cloudPlatform: 'gcp',
  resourceLocks: {},
})

const buildTdrResponse = (
  items: SnapshotSummaryModel[],
  roleMap: Record<string, string[]>,
) => ({
  filteredTotal: items.length,
  total: items.length,
  items,
  roleMap,
  errors: [],
})

const mockEmptyTdrResponse = buildTdrResponse([], {})

const mockTdrResponseWithSnapshot = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC')],
  { 'snapshot-abc': ['reader'] },
)

const mockTdrResponseWithStewardSnapshot = buildTdrResponse(
  [buildSnapshot('snapshot-xyz', 'Snapshot XYZ')],
  { 'snapshot-xyz': ['steward'] },
)

const mockTdrResponseWithMultipleSnapshots = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC'), buildSnapshot('snapshot-xyz', 'Snapshot XYZ')],
  { 'snapshot-abc': ['reader'], 'snapshot-xyz': ['steward'] },
)

const mockTdrResponseWithoutRole = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC')],
  { 'snapshot-abc': ['discoverer'] },
)

describe('DatasetStatistics', () => {
  let queryClient: QueryClient

  const renderDatasetStatistics = ({
    dataset = mockDatasetTerm,
    dars = mockDarsResponse,
    tdrResponse = mockEmptyTdrResponse,
    tdrError,
  }: {
    dataset?: typeof mockDatasetTerm
    dars?: DatasetStatisticsDar[]
    tdrResponse?: ReturnType<typeof buildTdrResponse>
    tdrError?: Error
  } = {}) => {
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([dataset])
    vi.mocked(DatasetMetrics.getDatasetStats).mockResolvedValue(dars)

    if (tdrError) {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockRejectedValue(tdrError)
    }
    else {
      vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(tdrResponse as unknown as Awaited<ReturnType<typeof TerraDataRepo.listSnapshotsByDatasetIds>>)
    }

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  it('renders the dataset details page', async () => {
    renderDatasetStatistics({ dataset: mockDatasetTerm })

    expect(await screen.findByText(/DUOS-000001 - Test Dataset/)).toBeTruthy()
    expect(await screen.findByText('Test Study')).toBeTruthy()
    expect(await screen.findByText('Dr. Test PI')).toBeTruthy()
  })

  it('shows Data Location when no exportable snapshots are available', async () => {
    renderDatasetStatistics()

    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /export to/i })).toBeNull()
  })

  it('shows "Export to..." dropdown with a Terra option when TDR returns a snapshot with reader role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithSnapshot })

    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
    const exportButton = await screen.findByRole('button', { name: /export to/i })
    fireEvent.click(exportButton)

    const terraItem = await screen.findByText('Terra')
    const anchor = terraItem.closest('a')
    expect(anchor).toBeTruthy()
    expect(anchor?.getAttribute('href')).toContain('snapshot-abc')
  })

  it('shows "Export to..." dropdown with a Terra option when TDR returns a snapshot with steward role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithStewardSnapshot })

    expect(await screen.findByText('TDR Location')).toBeTruthy()
    const exportButton = await screen.findByRole('button', { name: /export to/i })
    fireEvent.click(exportButton)

    const terraItem = await screen.findByText('Terra')
    const anchor = terraItem.closest('a')
    expect(anchor?.getAttribute('href')).toContain('snapshot-xyz')
  })

  it('does not show export dropdown for snapshots without reader or steward role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithoutRole })

    expect(screen.queryByRole('button', { name: /export to/i })).toBeNull()
    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
  })

  it('offers only the first snapshot via the Terra option when multiple snapshots are returned', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithMultipleSnapshots })

    expect(await screen.findByText('TDR Location')).toBeTruthy()

    const exportButton = await screen.findByRole('button', { name: /export to/i })
    fireEvent.click(exportButton)

    const terraItem = await screen.findByText('Terra')
    expect(terraItem.closest('a')?.getAttribute('href')).toContain('snapshot-abc')
    expect(screen.queryByText('Snapshot XYZ')).toBeNull()
  })

  it('handles TDR API errors gracefully and shows Data Location', async () => {
    renderDatasetStatistics({ tdrError: new Error('TDR API unavailable') })

    expect(screen.queryByRole('button', { name: /export to/i })).toBeNull()
    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
  })

  it('displays data access requests for the dataset', async () => {
    renderDatasetStatistics()

    expect(await screen.findByText(/Data Access Requests for this dataset/)).toBeTruthy()
    expect(await screen.findByText('DAR-001')).toBeTruthy()
    expect(await screen.findByText('Test Project')).toBeTruthy()
  })

  it('displays empty message when no data access requests exist', async () => {
    renderDatasetStatistics({ dars: [] })

    expect(
      await screen.findByText(/No Data Access Requests have been created for this dataset/),
    ).toBeTruthy()
  })
})

// access management, field display, identifier variants
describe('DatasetStatistics', () => {
  let queryClient: QueryClient

  const mockDataset = {
    datasetId: 1975,
    name: 'ExternalAccessTestJL1',
    datasetName: 'ExternalAccessTestJL1',
    datasetIdentifier: 'DUOS-000682',
    participantCount: 100,
    dataUse: {
      primary: [{ code: 'GRU', description: 'Data is available for general research use.' }],
      secondary: [],
    },
    study: {
      studyId: 5854,
      studyName: 'ExternalAccessTestJL1',
      description: 'A description for ExternalAccessTestJL1',
      publicVisibility: true,
      piName: 'Dr. Make',
      dataTypes: ['Hybrid Capture'],
      datasetIds: [1975, 1976, 1977],
    },
    deletable: false,
    createDate: 'Nov 2, 2023',
    createUserId: 3396,
    alias: 682,
    updateDate: 1730999135936,
    updateUserId: 3351,
  }

  const mount = (dataset: object, path = `/dataset/${mockDataset.datasetIdentifier}`) => {
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([dataset as never])
    vi.mocked(DatasetMetrics.getDatasetStats).mockResolvedValue([])
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockEmptyTdrResponse as never)
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.clearAllMocks()
  })

  it('Renders the correct dataset from a DUOS-xxx identifier path parameter', async () => {
    mount(mockDataset)
    expect(await screen.findByText(new RegExp(mockDataset.datasetIdentifier))).toBeInTheDocument()
  })

  it('Renders the correct dataset from a DUOS-D{id} identifier path parameter', async () => {
    mount(mockDataset, `/dataset/DUOS-D${mockDataset.datasetId}`)
    expect(await screen.findByText(new RegExp(mockDataset.datasetIdentifier))).toBeInTheDocument()
  })

  it('Displays Controlled Access Dataset Apply Button', async () => {
    const controlled = { ...mockDataset, accessManagement: 'controlled' }
    mount(controlled)
    await screen.findByText(new RegExp(controlled.datasetIdentifier))
    expect(document.body).toHaveTextContent(controlled.datasetName)
    expect(await screen.findByText('Apply for Access')).toBeInTheDocument()
  })

  it('Displays External Access Language With Location', async () => {
    const external = { ...mockDataset, accessManagement: 'external', url: 'https://duos.org' }
    mount(external)
    await screen.findByText(new RegExp(external.datasetIdentifier))
    expect(document.body).toHaveTextContent(external.datasetName)
    expect(await screen.findByText(/This dataset is externally managed/)).toBeInTheDocument()
    expect(await screen.findByText(/Requests cannot be made via DUOS/)).toBeInTheDocument()
    expect(await screen.findByText(/must be made directly through/)).toBeInTheDocument()
  })

  it('Displays External Access Language Without Location', async () => {
    const external = { ...mockDataset, accessManagement: 'external' }
    mount(external)
    await screen.findByText(new RegExp(external.datasetIdentifier))
    expect(document.body).toHaveTextContent(external.datasetName)
    expect(await screen.findByText(/This dataset is externally managed/)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/must be made directly through/)).not.toBeInTheDocument()
    })
  })

  it('Displays Open Access Language With Location', async () => {
    const open = { ...mockDataset, accessManagement: 'open', url: 'https://duos.org' }
    mount(open)
    await screen.findByText(new RegExp(open.datasetIdentifier))
    expect(document.body).toHaveTextContent(open.datasetName)
    expect(await screen.findByText(/This dataset is open access/)).toBeInTheDocument()
    expect(await screen.findByText(/and can be accessed directly/)).toBeInTheDocument()
  })

  it('Displays Open Access Language Without Location', async () => {
    const open = { ...mockDataset, accessManagement: 'open' }
    mount(open)
    await screen.findByText(new RegExp(open.datasetIdentifier))
    expect(document.body).toHaveTextContent(open.datasetName)
    expect(await screen.findByText(/This dataset is open access/)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/and can be accessed directly/)).not.toBeInTheDocument()
    })
  })

  it('Displays with no additional properties', async () => {
    mount(mockDataset)
    expect(await screen.findByText(new RegExp(mockDataset.datasetIdentifier))).toBeInTheDocument()
  })

  it('Displays All Data Custodian Emails', async () => {
    const dataCustodians = ['foo@bar.com', 'bar@baz.com']
    const withCustodians = {
      ...mockDataset,
      study: { ...mockDataset.study, dataCustodianEmail: dataCustodians },
    }
    mount(withCustodians)
    expect(await screen.findByText(/Data Custodian/)).toBeInTheDocument()
    for (const email of dataCustodians) {
      expect(await screen.findByText(new RegExp(email))).toBeInTheDocument()
    }
  })

  it('Does not display the Data Use field for open datasets', async () => {
    const open = { ...mockDataset, accessManagement: 'open' }
    mount(open)
    await screen.findByText(new RegExp(open.datasetIdentifier))
    expect(screen.queryByText(/^Data Use/)).not.toBeInTheDocument()
  })

  it('Displays the Data Use field for controlled datasets', async () => {
    const controlled = { ...mockDataset, accessManagement: 'controlled' }
    mount(controlled)
    expect(await screen.findByText(/Data Use/)).toBeInTheDocument()
    expect(await screen.findByText(new RegExp(mockDataset.dataUse.primary[0].code))).toBeInTheDocument()
  })

  it('Displays the Principal Investigator field', async () => {
    mount(mockDataset)
    expect(await screen.findByText(/Principal Investigator/)).toBeInTheDocument()
    expect(await screen.findByText(mockDataset.study.piName)).toBeInTheDocument()
  })

  it('Displays the Request Location field as a link when present', async () => {
    const requestLocationUrl = 'https://request.example.org/apply'
    const withRequestLocation = { ...mockDataset, requestLocation: requestLocationUrl }
    mount(withRequestLocation)
    expect(await screen.findByText(/Request Location/)).toBeInTheDocument()
    expect(document.querySelector(`a[href="${requestLocationUrl}"]`)).toBeInTheDocument()
  })

  it('Does not display the Request Location field when absent', async () => {
    const withoutRequestLocation = { ...mockDataset }
    mount(withoutRequestLocation)
    await screen.findByText(new RegExp(mockDataset.datasetIdentifier))
    expect(screen.queryByText(/Request Location/)).not.toBeInTheDocument()
  })

  it('Displays DAR section with data', async () => {
    const darsData: DatasetStatisticsDar[] = [{
      darCode: 'DAR-123',
      projectTitle: 'Test Project',
      updateDate: new Date('2023-01-01').getTime(),
      nonTechRus: 'Test summary',
      expired: false,
      referenceId: 'abc',
    }]
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([mockDataset as never])
    vi.mocked(DatasetMetrics.getDatasetStats).mockResolvedValue(darsData)
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockEmptyTdrResponse as never)
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/dataset/${mockDataset.datasetIdentifier}`]}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText(/Data Access Requests for this dataset/)).toBeInTheDocument()
    expect(await screen.findByText('DAR-123')).toBeInTheDocument()
    expect(await screen.findByText('Test Project')).toBeInTheDocument()
  })

  it('Displays message when no DARs exist', async () => {
    mount(mockDataset)
    expect(await screen.findByText(/No Data Access Requests have been created for this dataset/)).toBeInTheDocument()
  })

  it('Displays DAR section with expired data', async () => {
    const expired = new Date()
    expired.setFullYear(expired.getFullYear() - 2)
    const dateTime = expired.getTime()
    const pad = (n: number) => ('0' + n).slice(-2)
    const expectedDateString = `${expired.getFullYear()}-${pad(expired.getMonth() + 1)}-${pad(expired.getDate())}`

    const darsData: DatasetStatisticsDar[] = [{
      darCode: 'DAR-123',
      projectTitle: 'Test Project',
      updateDate: dateTime,
      nonTechRus: 'Test summary',
      expired: true,
      referenceId: 'abc',
    }]

    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([mockDataset as never])
    vi.mocked(DatasetMetrics.getDatasetStats).mockResolvedValue(darsData)
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(mockEmptyTdrResponse as never)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/dataset/${mockDataset.datasetIdentifier}`]}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/Data Access Requests for this dataset/)).toBeInTheDocument()
    expect(await screen.findByText('DAR-123')).toBeInTheDocument()
    expect(await screen.findByText('Test Project')).toBeInTheDocument()
    const showMoreButton = await screen.findByText('Show More')
    fireEvent.click(showMoreButton)
    expect(await screen.findByText(/Expired/)).toBeInTheDocument()
    expect(await screen.findByText(new RegExp(expectedDateString))).toBeInTheDocument()
    expect(await screen.findByText(darsData[0].nonTechRus)).toBeInTheDocument()
  })
})
