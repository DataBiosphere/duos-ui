import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibraryExportableDatasets } from 'src/hooks/useLibraryExportableDatasets'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DatasetTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

vi.mock('src/libs/ajax/TerraDataRepo', () => ({
  TerraDataRepo: {
    listSnapshotsByDatasetIds: vi.fn(),
  },
}))

const makeDataset = (datasetId: number, datasetIdentifier?: string) => ({
  datasetId,
  datasetIdentifier,
}) as DatasetTerm

const makeSnapshot = (id: string, duosId: string): SnapshotSummaryModel => ({
  id,
  name: id,
  duosId,
  cloudPlatform: 'gcp',
  resourceLocks: {},
})

const emptyResponse: EnumerateSnapshotModel = {
  total: 0,
  filteredTotal: 0,
  items: [],
  roleMap: {},
  errors: [],
}

let queryClient: QueryClient

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
})

afterEach(() => {
  queryClient.clear()
  vi.clearAllMocks()
})

describe('useLibraryExportableDatasets', () => {
  it('deduplicates identifiers and keeps only snapshots with export roles', async () => {
    const readerSnapshot = makeSnapshot('reader-snapshot', 'DUOS-000001')
    const stewardSnapshot = makeSnapshot('steward-snapshot', 'DUOS-000002')
    const discovererSnapshot = makeSnapshot('discoverer-snapshot', 'DUOS-000003')
    const missingRoleSnapshot = makeSnapshot('missing-role-snapshot', 'DUOS-000004')
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue({
      total: 4,
      filteredTotal: 4,
      items: [readerSnapshot, stewardSnapshot, discovererSnapshot, missingRoleSnapshot],
      roleMap: {
        [readerSnapshot.id]: ['reader'],
        [stewardSnapshot.id]: ['steward'],
        [discovererSnapshot.id]: ['discoverer'],
      },
      errors: [],
    })

    const { result } = renderHook(
      () => useLibraryExportableDatasets([
        makeDataset(1, 'DUOS-000001'),
        makeDataset(2, 'DUOS-000002'),
        makeDataset(3, 'DUOS-000001'),
        makeDataset(4),
      ], true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledTimes(1)
    expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledWith([
      'DUOS-000001',
      'DUOS-000002',
    ])
    expect(result.current.data).toEqual({
      'DUOS-000001': [readerSnapshot],
      'DUOS-000002': [stewardSnapshot],
    })
  })

  it('does not query TDR when disabled', () => {
    renderHook(
      () => useLibraryExportableDatasets([makeDataset(1, 'DUOS-000001')], false),
      { wrapper },
    )

    expect(TerraDataRepo.listSnapshotsByDatasetIds).not.toHaveBeenCalled()
  })

  it('does not query TDR without dataset identifiers', () => {
    renderHook(
      () => useLibraryExportableDatasets([makeDataset(1)], true),
      { wrapper },
    )

    expect(TerraDataRepo.listSnapshotsByDatasetIds).not.toHaveBeenCalled()
  })

  it('returns an empty export map when the TDR request fails', async () => {
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockRejectedValue(new Error('TDR unavailable'))

    const { result } = renderHook(
      () => useLibraryExportableDatasets([makeDataset(1, 'DUOS-000001')], true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({})
  })

  it('reuses the cached result when the same identifiers are reordered', async () => {
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(emptyResponse)
    const datasets = [
      makeDataset(2, 'DUOS-000002'),
      makeDataset(1, 'DUOS-000001'),
    ]

    const firstRender = renderHook(
      () => useLibraryExportableDatasets(datasets, true),
      { wrapper },
    )
    await waitFor(() => expect(firstRender.result.current.isSuccess).toBe(true))
    firstRender.unmount()

    const secondRender = renderHook(
      () => useLibraryExportableDatasets([...datasets].reverse(), true),
      { wrapper },
    )
    await waitFor(() => expect(secondRender.result.current.isSuccess).toBe(true))

    expect(secondRender.result.current.data).toEqual({})
    expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledTimes(1)
    expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledWith([
      'DUOS-000001',
      'DUOS-000002',
    ])
  })
})
