import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useLibraryData, buildElasticsearchQuery, useLibraryTabCounts } from 'src/hooks/useLibraryData'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'
import { BoolQuery, ExistsQuery, MultiMatchQuery, TermQuery } from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const TestComponent = ({
  libraryConfig,
  assetType,
  filters,
  pagination = { page: 0, pageSize: 25 },
  sort,
}: {
  libraryConfig: LibraryVersionNew
  assetType: AssetType
  filters: FilterState
  pagination?: PaginationState
  sort?: SortState
}) => {
  const { data, isLoading } = useLibraryData(libraryConfig, assetType, filters, '', pagination, sort)
  const queryClient = useQueryClient()

  // Expose query cache for testing
  const query = queryClient.getQueryCache().find({
    queryKey: ['library-data', libraryConfig.key, assetType, filters, '', pagination, sort],
  })

  return (
    <div>
      <div id="loading">{isLoading.toString()}</div>
      <div id="items-count">{data?.items?.length || 0}</div>
      <div id="has-query">{query ? 'yes' : 'no'}</div>
    </div>
  )
}

describe('useLibraryData', () => {
  const libraryConfig: LibraryVersionNew = {
    key: 'duos',
    title: 'DUOS Data Library',
    featured: true,
    order: 0,
  }

  const filters: FilterState = {
    ...EMPTY_FILTERS,
  }

  it('initializes query with correct keys', async () => {
    const queryClient = new QueryClient()
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent
            libraryConfig={libraryConfig}
            assetType={AssetType.STUDIES}
            filters={filters}
          />
        </QueryClientProvider>,
      )
    })

    expect(screen.getByText('yes')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // placeholder data
  })

  it('updates query when filters, pagination, or sort change', async () => {
    const queryClient = new QueryClient()
    const updatedFilters = { ...filters, accessManagement: ['controlled'] }
    const updatedPagination = { page: 1, pageSize: 50 }
    const sort: SortState = { field: 'studyName', order: 'asc' }

    const Wrapper = ({ f, p, s }: { f: FilterState, p?: PaginationState, s?: SortState }) => (
      <QueryClientProvider client={queryClient}>
        <TestComponent
          libraryConfig={libraryConfig}
          assetType={AssetType.STUDIES}
          filters={f}
          pagination={p}
          sort={s}
        />
      </QueryClientProvider>
    )

    await act(async () => {
      render(<Wrapper f={filters} />)
    })
    expect(screen.getByText('yes')).toBeInTheDocument()

    await act(async () => {
      render(<Wrapper f={updatedFilters} />)
    })
    expect(screen.getAllByText('yes').length).toBeGreaterThanOrEqual(1)

    await act(async () => {
      render(<Wrapper f={updatedFilters} p={updatedPagination} />)
    })
    expect(screen.getAllByText('yes').length).toBeGreaterThanOrEqual(1)

    await act(async () => {
      render(<Wrapper f={updatedFilters} p={updatedPagination} s={sort} />)
    })
    expect(screen.getAllByText('yes').length).toBeGreaterThanOrEqual(1)
  })
})

describe('buildElasticsearchQuery', () => {
  const libraryConfig: LibraryVersionNew = {
    key: 'duos',
    title: 'DUOS Data Library',
    featured: true,
    order: 0,
  }

  const filters: FilterState = {
    ...EMPTY_FILTERS,
  }

  const pagination: PaginationState = { page: 0, pageSize: 25 }

  it('builds a basic query for studies', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.STUDIES, filters, '', pagination)
    expect(query.query?.bool.must).toHaveLength(1)
    const firstClause = query.query?.bool.must?.[0] as ExistsQuery
    expect(firstClause.exists.field).toEqual('study')
    expect(query.aggs).toHaveProperty('studies')
    expect(query.aggs).toHaveProperty('total_studies')
  })

  it('builds a basic query for datasets', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination)
    expect(query.query?.bool.must).toHaveLength(1)
    expect(query.from).toEqual(0)
    expect(query.size).toEqual(25)
    expect(query.aggs).toHaveProperty('access_management')
  })

  it('adds search term to query', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, 'breast cancer', pagination)
    expect(query.query?.bool.must).toHaveLength(2)
    const secondClause = query.query?.bool.must?.[1] as MultiMatchQuery
    expect(secondClause.multi_match.query).toEqual('breast cancer')
    expect(secondClause.multi_match.fields).toContain('datasetIdentifier')
  })

  it('adds access management filters', () => {
    const filtersWithAccess = { ...filters, accessManagement: ['controlled'] }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filtersWithAccess, '', pagination)
    expect(query.query?.bool.filter).toHaveLength(1)
    const firstFilter = query.query?.bool.filter?.[0] as BoolQuery
    const termClause = firstFilter.bool.should?.[0] as TermQuery
    expect(termClause.term['accessManagement.keyword']).toEqual('controlled')
  })

  it('adds sort to dataset query', () => {
    const sort: SortState = { field: 'studyName', order: 'asc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    expect(query.sort).toHaveLength(1)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort['study.studyName.keyword'].order).toEqual('asc')
  })

  it('maps each text field to its .keyword ES sort path', () => {
    const textFieldCases: Array<[string, string]> = [
      ['datasetName', 'datasetName.keyword'],
      ['studyName', 'study.studyName.keyword'],
      ['accessManagement', 'accessManagement.keyword'],
      ['dac', 'dac.dacName.keyword'],
      ['datasetIdentifier', 'datasetIdentifier.keyword'],
    ]

    textFieldCases.forEach(([columnField, esSortField]) => {
      const sort: SortState = { field: columnField, order: 'asc' }
      const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
      expect(query.sort).toHaveLength(1)
      const firstSort = query.sort?.[0] as Record<string, { order: string }>
      expect(firstSort[esSortField].order).toEqual('asc')
    })
  })

  it('sorts numeric field (participantCount) without .keyword mapping', () => {
    const sort: SortState = { field: 'participantCount', order: 'desc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    expect(query.sort).toHaveLength(1)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort.participantCount.order).toEqual('desc')
  })

  it('applies sort order correctly for desc', () => {
    const sort: SortState = { field: 'datasetName', order: 'desc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort['datasetName.keyword'].order).toEqual('desc')
  })

  it('omits sort clause when sort is undefined', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, undefined)
    expect(query.sort).toEqual(undefined)
  })

  it('builds an aggregation query for models (size: 0, studies terms agg)', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.MODELS, filters, '', pagination)
    // Models use an aggregation-only query
    expect(query.size).toEqual(0)
    expect(query.from).toEqual(undefined)
    expect(query.aggs).toHaveProperty('studies')
    const studiesAgg = query.aggs!.studies as { terms: { field: string, size: number } }
    expect(studiesAgg.terms.field).toEqual('study.studyId')
    expect(studiesAgg.terms.size).toEqual(10000)
  })

  it('adds model-specific search fields for the models asset type', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.MODELS, filters, 'pytorch', pagination)
    expect(query.query?.bool.must).toHaveLength(2)
    const searchClause = query.query?.bool.must?.[1] as {
      multi_match: { fields: string[], query: string }
    }
    expect(searchClause.multi_match.fields).toContain('study.assets.models.name')
    expect(searchClause.multi_match.fields).toContain('study.assets.models.format')
    expect(searchClause.multi_match.query).toEqual('pytorch')
  })

  it('ignores filters that are not visible for the selected asset type', () => {
    const filtersWithDatasetOnlyValues: FilterState = {
      ...filters,
      accessManagement: ['controlled'],
      participantCount: { min: 25 },
      dac: ['DAC-1'],
      dataUse: ['HMB'],
    }

    const query = buildElasticsearchQuery(
      libraryConfig,
      AssetType.PUBLICATIONS,
      filtersWithDatasetOnlyValues,
      '',
      pagination,
    )

    expect(query.query?.bool.filter).toEqual(undefined)
  })
})

describe('useLibraryTabCounts', () => {
  const libraryConfig: LibraryVersionNew = {
    key: 'duos',
    title: 'DUOS Data Library',
    featured: true,
    order: 0,
  }

  const CountsComponent = ({ assetTypes }: { assetTypes: AssetType[] }) => {
    const counts = useLibraryTabCounts(libraryConfig, assetTypes, { ...EMPTY_FILTERS }, '')
    return (
      <div>
        {assetTypes.map(type => (
          <div key={type} id={`count-${type}`}>{counts[type] ?? 'pending'}</div>
        ))}
      </div>
    )
  }

  it('returns an entry for each requested asset type', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CountsComponent assetTypes={[AssetType.STUDIES, AssetType.DATASETS]} />
        </QueryClientProvider>,
      )
    })
    // Counts start as pending (no mock response) — verify both keys rendered
    expect(screen.getAllByText('pending')).toHaveLength(2)
  })

  it('registers one query per asset type in the cache', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CountsComponent assetTypes={[AssetType.STUDIES, AssetType.DATASETS, AssetType.MODELS]} />
        </QueryClientProvider>,
      )
    })
    const tabCountQueries = queryClient.getQueryCache().findAll({
      predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'library-tab-count',
    })
    expect(tabCountQueries).toHaveLength(3)
  })
})
