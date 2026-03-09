import { useQuery } from '@tanstack/react-query'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery, QueryClause } from 'src/types/elastic'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'
import { assetRegistry } from 'src/components/data_library/assets'

/**
 * Build the common Elasticsearch query clauses shared by every asset type:
 * the base `must` clauses (study-exists check + library filter + search term)
 * and the `filter` clauses derived from the filter panel.
 *
 * Asset-specific code (aggregations, pagination, sort) is handled by each
 * asset's own `buildQuery` method.
 */
const buildCommonQueryClauses = (
  libraryConfig: LibraryVersionNew,
  filters: FilterState,
  queryTerm: string,
  searchFields: string[],
): { queryChunks: QueryClause[], filterQuery: QueryClause[] } => {
  const queryChunks: QueryClause[] = [
    { exists: { field: 'study' } },
  ]

  if (libraryConfig.query) {
    queryChunks.push(libraryConfig.query as QueryClause)
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

  const filterQuery: QueryClause[] = []

  if (filters.accessManagement.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.accessManagement.map(term => ({
          term: { 'accessManagement.keyword': term },
        })),
      },
    })
  }

  if (filters.dataUse.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dataUse.map(term => ({
          match: { 'dataUse.primary.code': term },
        })),
      },
    })
  }

  if (filters.dataType.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dataType.map(term => ({
          match: { 'study.dataTypes': term },
        })),
      },
    })
  }

  if (filters.dac.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dac.map(term => ({
          match_phrase: { 'dac.dacName': term },
        })),
      },
    })
  }

  if (
    filters.participantCount.min !== undefined
    || filters.participantCount.max !== undefined
  ) {
    filterQuery.push({
      range: {
        participantCount: {
          ...(filters.participantCount.min !== undefined && { gte: filters.participantCount.min }),
          ...(filters.participantCount.max !== undefined && { lte: filters.participantCount.max }),
        },
      },
    })
  }

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
  const { queryChunks, filterQuery } = buildCommonQueryClauses(
    libraryConfig,
    filters,
    queryTerm,
    asset.searchFields,
  )
  return asset.buildQuery(queryChunks, filterQuery, pagination, sort)
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
) => {
  return useQuery({
    queryKey: [
      'library-data',
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
      const actualData = response.data || response
      return assetRegistry[assetType].transformResponse(actualData, pagination)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    placeholderData: {
      items: [],
      total: 0,
      aggregations: {},
    },
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
        {
          accessManagement: [],
          dataUse: [],
          dataType: [],
          dac: [],
          participantCount: {},
        },
        '',
        { page: 0, pageSize: 0 },
      )

      const response = await DataSet.searchDatasetIndexV2(query)
      return response.aggregations || {}
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
