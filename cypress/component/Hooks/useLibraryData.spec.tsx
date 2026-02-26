import React from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useLibraryData, buildElasticsearchQuery } from 'src/hooks/useLibraryData'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'
import { BoolQuery, ExistsQuery, MultiMatchQuery, TermQuery } from 'src/types/elastic'

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
    accessManagement: [],
    dataUse: [],
    dataType: [],
    dac: [],
    participantCount: {},
  }

  it('initializes query with correct keys', () => {
    const queryClient = new QueryClient()
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <TestComponent
          libraryConfig={libraryConfig}
          assetType={AssetType.STUDIES}
          filters={filters}
        />
      </QueryClientProvider>,
    )

    cy.get('#has-query').should('have.text', 'yes')
    cy.get('#items-count').should('have.text', '0') // placeholder data
  })

  it('updates query when filters, pagination, or sort change', () => {
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

    cy.mount(<Wrapper f={filters} />)
    cy.get('#has-query').should('have.text', 'yes')

    cy.mount(<Wrapper f={updatedFilters} />)
    cy.get('#has-query').should('have.text', 'yes')

    cy.mount(<Wrapper f={updatedFilters} p={updatedPagination} />)
    cy.get('#has-query').should('have.text', 'yes')

    cy.mount(<Wrapper f={updatedFilters} p={updatedPagination} s={sort} />)
    cy.get('#has-query').should('have.text', 'yes')
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
    accessManagement: [],
    dataUse: [],
    dataType: [],
    dac: [],
    participantCount: {},
  }

  const pagination: PaginationState = { page: 0, pageSize: 25 }

  it('builds a basic query for studies', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.STUDIES, filters, '', pagination)
    expect(query.query?.bool.must).to.have.length(1)
    const firstClause = query.query?.bool.must?.[0] as ExistsQuery
    expect(firstClause.exists.field).to.equal('study')
    expect(query.aggs).to.have.property('studies')
    expect(query.aggs).to.have.property('total_studies')
  })

  it('builds a basic query for datasets', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination)
    expect(query.query?.bool.must).to.have.length(1)
    expect(query.from).to.equal(0)
    expect(query.size).to.equal(25)
    expect(query.aggs).to.have.property('access_management')
  })

  it('adds search term to query', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, 'breast cancer', pagination)
    expect(query.query?.bool.must).to.have.length(2)
    const secondClause = query.query?.bool.must?.[1] as MultiMatchQuery
    expect(secondClause.multi_match.query).to.equal('breast cancer')
  })

  it('adds access management filters', () => {
    const filtersWithAccess = { ...filters, accessManagement: ['controlled'] }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filtersWithAccess, '', pagination)
    expect(query.query?.bool.filter).to.have.length(1)
    const firstFilter = query.query?.bool.filter?.[0] as BoolQuery
    const termClause = firstFilter.bool.should?.[0] as TermQuery
    expect(termClause.term['accessManagement.keyword']).to.equal('controlled')
  })

  it('adds sort to dataset query', () => {
    const sort: SortState = { field: 'studyName', order: 'asc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    expect(query.sort).to.have.length(1)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort['study.studyName.keyword'].order).to.equal('asc')
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
      expect(query.sort).to.have.length(1)
      const firstSort = query.sort?.[0] as Record<string, { order: string }>
      expect(firstSort[esSortField].order).to.equal('asc')
    })
  })

  it('sorts numeric field (participantCount) without .keyword mapping', () => {
    const sort: SortState = { field: 'participantCount', order: 'desc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    expect(query.sort).to.have.length(1)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort.participantCount.order).to.equal('desc')
  })

  it('applies sort order correctly for desc', () => {
    const sort: SortState = { field: 'datasetName', order: 'desc' }
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, sort)
    const firstSort = query.sort?.[0] as Record<string, { order: string }>
    expect(firstSort['datasetName.keyword'].order).to.equal('desc')
  })

  it('omits sort clause when sort is undefined', () => {
    const query = buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, filters, '', pagination, undefined)
    expect(query.sort).to.equal(undefined)
  })
})
