import { useQuery } from '@tanstack/react-query'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { FilterState, LibraryVersionNew } from 'src/types/library'
import { ALL_SEARCH_FIELDS } from 'src/components/data_library/assets'
import { buildCommonQueryClauses } from 'src/hooks/useLibraryData'
import { buildCountAggregations } from 'src/hooks/libraryCounts'

export const LIBRARY_TAB_COUNTS_QUERY_KEY = 'library-tab-counts'

/**
 * Build the standalone `size: 0` Elasticsearch query that yields the counts for
 * every tab at once. This query is independent of the active tab, pagination and
 * sort, so its result is fetched once per (library, filters, search term) and
 * shared across all tabs — the data grids never carry the count aggregations.
 */
const buildTabCountsQuery = (
  queryChunks: QueryClause[],
  filterQuery: QueryClause[],
  showAllControlled?: boolean,
): ElasticsearchQuery => ({
  size: 0,
  query: {
    bool: {
      must: queryChunks,
      ...(filterQuery.length > 0 && { filter: filterQuery }),
    },
  },
  aggs: buildCountAggregations(showAllControlled),
})

/**
 * Fetch the shared counts response for every Data Library tab in one request.
 *
 * The query uses the base clauses required to render each tab (study-exists
 * check, branded-library filter, search term over the union of every asset's
 * fields) plus every active filter, regardless of which tab it was set on, so
 * the counts reflect the combined filter rules and behave like facets.
 *
 * The query does not depend on the active tab, pagination or sort, so the result
 * is cached and reused as the user pages, sorts, and switches tabs.
 *
 * The raw response is returned rather than precomputed counts: the caller
 * (`useLibraryPageState`) derives both the badge counts and the study-asset
 * grids from it with the *current* filters, so the two can never disagree —
 * even while a refetch is in flight and this hook is serving the previous
 * response as placeholder data.
 */
export const useLibraryTabCounts = (
  libraryConfig: LibraryVersionNew,
  filters: FilterState,
  queryTerm: string,
) => {
  return useQuery({
    queryKey: [
      LIBRARY_TAB_COUNTS_QUERY_KEY,
      libraryConfig.key,
      filters,
      queryTerm,
    ],
    queryFn: async (): Promise<ElasticsearchResponse> => {
      const { queryChunks, filterQuery } = buildCommonQueryClauses(
        libraryConfig,
        filters,
        queryTerm,
        ALL_SEARCH_FIELDS,
      )
      const query = buildTabCountsQuery(queryChunks, filterQuery, libraryConfig.showAllControlled)
      return DataSet.searchDatasetIndexV2(query)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Keep the previous counts visible while a new query loads to avoid flicker.
    placeholderData: previousData => previousData,
  })
}
