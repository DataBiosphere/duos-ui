import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLibraryTabCounts } from 'src/hooks/useLibraryTabCounts'
import { AssetType, FilterState, LibraryVersionNew } from 'src/types/library'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery, ElasticsearchResponse } from 'src/types/elastic'

vi.mock('src/libs/ajax/DataSet')

const libraryConfig: LibraryVersionNew = {
  key: 'duos',
  title: 'DUOS Data Library',
  featured: true,
  order: 0,
}

// A study bucket shaped the way every study-aggregation tab expects.
const makeStudyBucket = (
  studyId: number,
  assets: Record<string, unknown[]>,
) => ({
  key: studyId,
  doc_count: 1,
  study_details: {
    hits: {
      hits: [
        { _source: { study: { studyId, studyName: `Study ${studyId}`, assets } } },
      ],
    },
  },
})

const mockResponse: ElasticsearchResponse = {
  items: [],
  total: 0,
  aggregations: {
    total_studies: { value: 3 },
    datasets_count: { doc_count: 7 } as unknown as NonNullable<ElasticsearchResponse['aggregations']>[string],
    studies: {
      buckets: [
        makeStudyBucket(1, {
          models: [{ name: 'A' }, { name: 'B' }],
          workspaces: [{ name: 'W1' }],
          clinicalTrials: [{ title: 'T1', status: 'Recruiting' }],
        }),
        makeStudyBucket(2, {
          models: [{ name: 'C' }],
          clinicalTrials: [{ title: 'T2', status: 'Completed' }],
        }),
      ],
    } as unknown as NonNullable<ElasticsearchResponse['aggregations']>[string],
  },
}

const TestComponent = ({
  filters,
  queryTerm = '',
}: {
  filters: FilterState
  queryTerm?: string
}) => {
  const { data } = useLibraryTabCounts(libraryConfig, filters, queryTerm)
  return (
    <div>
      <div data-testid="studies">{data?.[AssetType.STUDIES] ?? 'none'}</div>
      <div data-testid="datasets">{data?.[AssetType.DATASETS] ?? 'none'}</div>
      <div data-testid="models">{data?.[AssetType.MODELS] ?? 'none'}</div>
      <div data-testid="workspaces">{data?.[AssetType.WORKSPACES] ?? 'none'}</div>
      <div data-testid="clinical_trials">{data?.[AssetType.CLINICAL_TRIALS] ?? 'none'}</div>
    </div>
  )
}

const renderHook = (props: { filters: FilterState, queryTerm?: string }) => {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TestComponent {...props} />
    </QueryClientProvider>,
  )
}

describe('useLibraryTabCounts', () => {
  beforeEach(() => {
    vi.mocked(DataSet.searchDatasetIndexV2).mockReset()
    vi.mocked(DataSet.searchDatasetIndexV2).mockResolvedValue(mockResponse)
  })

  it('derives every tab count from a single shared request', async () => {
    await act(async () => {
      renderHook({ filters: { ...EMPTY_FILTERS } })
    })

    await waitFor(() => expect(screen.getByTestId('studies')).toHaveTextContent('3'))

    // Studies (cardinality) and Datasets (filter agg) come straight from aggs.
    expect(screen.getByTestId('studies')).toHaveTextContent('3')
    expect(screen.getByTestId('datasets')).toHaveTextContent('7')
    // Nested-asset tabs are counted by flattening each study's assets.
    expect(screen.getByTestId('models')).toHaveTextContent('3')
    expect(screen.getByTestId('workspaces')).toHaveTextContent('1')
    expect(screen.getByTestId('clinical_trials')).toHaveTextContent('2')

    // Only one request is made for all ten tabs.
    expect(DataSet.searchDatasetIndexV2).toHaveBeenCalledTimes(1)
  })

  it('issues a single shared query with count aggregations for studies, datasets, and other assets', async () => {
    await act(async () => {
      renderHook({ filters: { ...EMPTY_FILTERS } })
    })
    await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalled())

    const query = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls[0][0] as ElasticsearchQuery
    expect(query.size).toEqual(0)
    expect(query.aggs).toHaveProperty('total_studies')
    expect(query.aggs).toHaveProperty('datasets_count')
    expect(query.aggs).toHaveProperty('studies')
    // The study-exists clause is always required to render any tab.
    expect(query.query?.bool.must).toContainEqual({ exists: { field: 'study' } })
  })

  it('bakes the active tab filters into the shared query so counts behave like facets', async () => {
    const filters: FilterState = { ...EMPTY_FILTERS, accessManagement: ['controlled'] }
    await act(async () => {
      renderHook({ filters })
    })
    await waitFor(() => expect(DataSet.searchDatasetIndexV2).toHaveBeenCalled())

    const query = vi.mocked(DataSet.searchDatasetIndexV2).mock.calls[0][0] as ElasticsearchQuery
    expect(query.query?.bool.filter).toBeDefined()
    expect(query.query?.bool.filter?.length).toBeGreaterThan(0)
  })
})
