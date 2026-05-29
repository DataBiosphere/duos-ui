import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  ontologyApiUrl: '',
  terraUrl: '',
  tdrApiUrl: '',
  ecmApiUrl: '',
  errorApiKey: '',
  profileUrl: '',
  nihUrl: '',
  gaId: '',
  samApiUrl: '',
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
  datasetIdentifier: 'DUOS-000001',
  datasetName: 'Test Dataset',
  accessManagement: 'controlled',
  dataLocation: 'TDR Location',
  url: 'https://example.com/dataset',
  study: {
    studyId: 101,
    studyName: 'Test Study',
    description: 'A test study',
    phenotype: 'Genomic',
    piName: 'Dr. Test PI',
    dataCustodianEmail: ['custodian@example.com'],
  },
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
    dars = mockDarsResponse,
    tdrResponse = mockEmptyTdrResponse,
    tdrError,
  }: {
    dars?: DatasetStatisticsDar[]
    tdrResponse?: ReturnType<typeof buildTdrResponse>
    tdrError?: Error
  } = {}) => {
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([mockDatasetTerm])
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
    renderDatasetStatistics()

    expect(await screen.findByText(/DUOS-000001 - Test Dataset/)).toBeTruthy()
    expect(await screen.findByText('Test Study')).toBeTruthy()
    expect(await screen.findByText('Dr. Test PI')).toBeTruthy()
  })

  it('shows Data Location when no exportable snapshots are available', async () => {
    renderDatasetStatistics()

    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
    expect(screen.queryByText('Export')).toBeNull()
  })

  it('shows export button when TDR returns a snapshot with reader role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithSnapshot })

    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
    const exportLink = await screen.findByText('Export')
    expect(exportLink).toBeTruthy()
    const anchor = exportLink?.closest('a')
    expect(anchor).toBeTruthy()
    expect(anchor?.getAttribute('href')).toContain('snapshot-abc')
  })

  it('shows export button when TDR returns a snapshot with steward role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithStewardSnapshot })

    expect(await screen.findByText('TDR Location')).toBeTruthy()
    const exportLink = await screen.findByText('Export')
    expect(exportLink).toBeTruthy()
    const anchor = exportLink?.closest('a')
    expect(anchor?.getAttribute('href')).toContain('snapshot-xyz')
  })

  it('does not show export button for snapshots without reader or steward role', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithoutRole })

    expect(screen.queryByText('Export')).toBeNull()
    expect(await screen.findByText(/Data Location/)).toBeTruthy()
    expect(await screen.findByText('TDR Location')).toBeTruthy()
  })

  it('shows a dropdown menu with an item per snapshot when multiple snapshots are available', async () => {
    renderDatasetStatistics({ tdrResponse: mockTdrResponseWithMultipleSnapshots })

    expect(await screen.findByText('TDR Location')).toBeTruthy()

    const exportButton = await screen.findByRole('button', { name: /export/i })
    fireEvent.click(exportButton)

    expect(await screen.findByText('Snapshot ABC')).toBeTruthy()
    expect(await screen.findByText('Snapshot XYZ')).toBeTruthy()
  })

  it('handles TDR API errors gracefully and shows Data Location', async () => {
    renderDatasetStatistics({ tdrError: new Error('TDR API unavailable') })

    expect(screen.queryByText('Export')).toBeNull()
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
