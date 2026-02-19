import React from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useLibraryData } from 'src/hooks/useLibraryData'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'

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
  const { data, isLoading } = useLibraryData(libraryConfig, assetType, filters, pagination, sort)
  const queryClient = useQueryClient()

  // Expose query cache for testing
  const query = queryClient.getQueryCache().find({
    queryKey: ['library-data', libraryConfig.key, assetType, filters, pagination, sort],
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
