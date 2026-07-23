import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  buildStudyDatasetsQuery,
  useStudyDatasets,
  useStudyExportableDatasets,
} from 'src/hooks/useStudyDetailsData'
import { DataSet } from 'src/libs/ajax/DataSet'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { ElasticsearchResponse } from 'src/types/elastic'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndexV2: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/TerraDataRepo', () => ({
  TerraDataRepo: {
    listSnapshotsByDatasetIds: vi.fn(),
  },
}))

const study = {
  studyId: 7,
  studyName: 'Study Seven',
  description: 'Study description',
} as StudyTerm

const datasets = [
  {
    datasetId: 71,
    datasetIdentifier: 'DUOS-000071',
    datasetName: 'Dataset 71',
    participantCount: 10,
    study,
  },
  {
    datasetId: 72,
    datasetIdentifier: 'DUOS-000072',
    datasetName: 'Dataset 72',
    participantCount: 20,
    study,
  },
] as DatasetTerm[]

const makeSearchResponse = () => ({
  hits: {
    total: { value: 42 },
    hits: datasets.map(dataset => ({ _source: dataset })),
  },
  aggregations: {
    study_details: {
      hits: {
        hits: [{ _source: { study } }],
      },
    },
    total_participants: { value: 1234 },
  },
}) as unknown as ElasticsearchResponse

const makeSnapshot = (id: string, duosId: string): SnapshotSummaryModel => ({
  id,
  name: id,
  duosId,
  cloudPlatform: 'gcp',
  resourceLocks: {},
})

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

describe('buildStudyDatasetsQuery', () => {
  it('builds a page-sized study query using the dataset server sort mapping', () => {
    const query = buildStudyDatasetsQuery(
      '7',
      { page: 2, pageSize: 50 },
      { field: 'dac', order: 'desc' },
    )

    expect(query.from).toBe(100)
    expect(query.size).toBe(50)
    expect(query.query?.bool.must).toContainEqual({ exists: { field: 'study' } })
    expect(query.query?.bool.must).toContainEqual({ match: { 'study.studyId': '7' } })
    expect(query.query?.bool.should).toBeUndefined()
    expect(query.sort).toEqual([{ 'dac.dacName.keyword': { order: 'desc' } }])
    expect(query.aggs).toHaveProperty('study_details')
    expect(query.aggs).toHaveProperty('total_participants')
    expect(query.aggs).not.toHaveProperty('access_management')
    expect(query.aggs).not.toHaveProperty('data_use')
    expect(query.aggs).not.toHaveProperty('data_type')
    expect(query.aggs).not.toHaveProperty('dac')
  })
})

describe('useStudyDatasets', () => {
  it('returns the server page with study metadata and the aggregated participant total', async () => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(makeSearchResponse())

    const { result } = renderHook(
      () => useStudyDatasets('7', { page: 0, pageSize: 25 }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toEqual(datasets)
    expect(result.current.data?.total).toBe(42)
    expect(result.current.data?.study).toEqual(study)
    expect(result.current.data?.participantCount).toBe(1234)
    expect(DataSet.searchDatasetIndexV2).toHaveBeenCalledTimes(1)
  })

  it('does not issue a request without a study id', () => {
    renderHook(
      () => useStudyDatasets('', { page: 0, pageSize: 25 }),
      { wrapper },
    )

    expect(DataSet.searchDatasetIndexV2).not.toHaveBeenCalled()
  })
})

describe('useStudyExportableDatasets', () => {
  it('fetches exports for the current page and keeps only snapshots with export roles', async () => {
    const exportable = makeSnapshot('reader-snapshot', 'DUOS-000071')
    const missingRole = makeSnapshot('missing-role-snapshot', 'DUOS-000072')
    const response: EnumerateSnapshotModel = {
      items: [exportable, missingRole],
      roleMap: {
        [exportable.id]: ['reader'],
      },
      filteredTotal: 2,
      total: 2,
      errors: [],
    }
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockResolvedValue(response)

    const { result } = renderHook(
      () => useStudyExportableDatasets('7', datasets),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(TerraDataRepo.listSnapshotsByDatasetIds).toHaveBeenCalledWith([
      'DUOS-000071',
      'DUOS-000072',
    ])
    expect(result.current.data).toEqual({
      'DUOS-000071': [exportable],
    })
  })

  it('does not issue a dependent request without datasets', () => {
    renderHook(
      () => useStudyExportableDatasets('7', []),
      { wrapper },
    )

    expect(TerraDataRepo.listSnapshotsByDatasetIds).not.toHaveBeenCalled()
  })

  it('returns an empty export map when the snapshot lookup fails', async () => {
    vi.mocked(TerraDataRepo.listSnapshotsByDatasetIds).mockRejectedValue(new Error('TDR unavailable'))

    const { result } = renderHook(
      () => useStudyExportableDatasets('7', datasets),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({})
  })
})
