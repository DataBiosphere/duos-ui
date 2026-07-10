import { useQuery } from '@tanstack/react-query'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery, QueryClause } from 'src/types/elastic'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'
import { ALL_SEARCH_FIELDS, assetRegistry } from 'src/components/data_library/assets'
import {
  buildActiveFilterClauses,
  EMPTY_FILTERS,
} from 'src/components/data_library/filterRegistry'

export const LIBRARY_DATA_QUERY_KEY = 'library-data'

/**
 * Build the common Elasticsearch query clauses shared by every asset type:
 * the base `must` clauses (study-exists check + library filter + search term)
 * and the `filter` clauses derived from the filter panel.
 *
 * Every active filter is applied regardless of which tab it was set on, so
 * filter rules combine across tabs. Asset-specific code (aggregations,
 * pagination, sort) is handled by each asset's own `buildQuery` method.
 *
 * `searchFields` defaults to the union of every asset's search fields
 * (`ALL_SEARCH_FIELDS`) so the search term matches the same fields on every
 * tab; this keeps the tab-count badges consistent with each tab's grid.
 */
export const buildCommonQueryClauses = (
  libraryConfig: LibraryVersionNew,
  filters: FilterState,
  queryTerm: string,
  searchFields: string[] = ALL_SEARCH_FIELDS,
): { queryChunks: QueryClause[], filterQuery: QueryClause[] } => {
  const queryChunks: QueryClause[] = [
    { exists: { field: 'study' } },
  ]

  if (libraryConfig.query) {
    queryChunks.push(libraryConfig.query as QueryClause)
  }

  // Hide studies not flagged for public visibility from the researcher-facing
  // library. Privileged roles (Chairperson, Data Submitter, Admin, Signing
  // Official) leave this flag unset so they still see non-public studies.
  if (libraryConfig.restrictToPublicVisibility) {
    queryChunks.push({ term: { 'study.publicVisibility': true } })
  }

  if (queryTerm.length > 0) {
    queryChunks.push({
      multi_match: {
        query: queryTerm,
        type: 'phrase_prefix',
        fields: searchFields,
      },
    })
  }

  const filterQuery = buildActiveFilterClauses(filters)

  return { queryChunks, filterQuery }
}

/**
 * Build the full Elasticsearch query for the given asset type.
 *
 * Assembles the common query clauses and then delegates the asset-type-specific
 * query shape (aggregations, pagination, sort) to the asset registry.
 * The public signature is preserved so existing tests continue to pass.
 */
export const buildElasticsearchQuery = (
  libraryConfig: LibraryVersionNew,
  assetType: AssetType,
  filters: FilterState,
  queryTerm: string,
  pagination: PaginationState,
  sort?: SortState,
): ElasticsearchQuery => {
  const asset = assetRegistry[assetType]
  // Search every asset's fields (not just this tab's) so a search term matches
  // the same studies here and in the shared tab-counts query (`useLibraryTabCounts`),
  // keeping each tab's grid consistent with its count badge.
  const { queryChunks, filterQuery } = buildCommonQueryClauses(
    libraryConfig,
    filters,
    queryTerm,
    ALL_SEARCH_FIELDS,
  )

  return asset.buildQuery(queryChunks, filterQuery, pagination, sort, { showAllControlled: libraryConfig.showAllControlled })
}

/**
 * Custom hook for fetching library data
 */
export const useLibraryData = (
  libraryConfig: LibraryVersionNew,
  assetType: AssetType,
  filters: FilterState,
  queryTerm: string,
  pagination: PaginationState,
  sort?: SortState,
  options?: { enabled?: boolean },
) => {
  const emptyResult = {
    items: [],
    total: 0,
    aggregations: {},
  }

  return useQuery({
    // Study-asset tabs render from the shared tab-counts query response, so their
    // caller disables this query (`enabled: false`) to avoid a redundant
    // full-corpus request. Studies and Datasets keep their own data query.
    enabled: options?.enabled ?? true,
    queryKey: [
      LIBRARY_DATA_QUERY_KEY,
      libraryConfig.key,
      assetType,
      filters,
      queryTerm,
      pagination,
      sort,
    ],
    queryFn: async () => {
      const query = buildElasticsearchQuery(
        libraryConfig,
        assetType,
        filters,
        queryTerm,
        pagination,
        sort,
      )

      const response = await DataSet.searchDatasetIndexV2(query)
      return assetRegistry[assetType].transformResponse(response, pagination, filters)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Preserve previous rows/options while new filters load to avoid UI flicker.
    placeholderData: previousData => previousData ?? emptyResult,
  })
}

/**
 * Custom hook for fetching library filter metadata (e.g. unique DACs)
 */
export const useLibraryMetadata = (libraryConfig: LibraryVersionNew) => {
  return useQuery({
    queryKey: ['library-metadata', libraryConfig.key],
    queryFn: async () => {
      const query = buildElasticsearchQuery(
        libraryConfig,
        AssetType.DATASETS,
        EMPTY_FILTERS,
        '',
        { page: 0, pageSize: 0 },
      )

      const response = await DataSet.searchDatasetIndexV2(query)
      return response.aggregations || {}
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
