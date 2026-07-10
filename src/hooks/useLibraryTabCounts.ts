import { useQuery } from '@tanstack/react-query'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { FilterState, LibraryVersionNew } from 'src/types/library'
import { ALL_SEARCH_FIELDS } from 'src/components/data_library/assets'
import { buildCommonQueryClauses } from 'src/hooks/useLibraryData'
import { buildCountAggregations, computeTabCounts, TabCounts } from 'src/hooks/libraryCounts'

export const LIBRARY_TAB_COUNTS_QUERY_KEY = 'library-tab-counts'

/**
 * Result of the shared tab-counts query: the per-tab `counts` for the badges plus
 * the raw `response`. The response carries the full shared `studies` aggregation,
 * which every study-asset tab (all tabs except Studies and Datasets) renders its
 * grid from — so those tabs reuse this one response instead of issuing their own
 * full-corpus data query. See `useLibraryPageState`.
 */
export interface LibraryTabCountsResult {
  counts: TabCounts
  response: ElasticsearchResponse
}

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
 * Fetch the item count for every Data Library tab in one request.
 *
 * The query uses the base clauses required to render each tab (study-exists
 * check, branded-library filter, search term over the union of every asset's
 * fields) plus every active filter, regardless of which tab it was set on, so
 * the counts reflect the combined filter rules and behave like facets.
 *
 * The query does not depend on the active tab, pagination or sort, so the result
 * is cached and reused as the user pages, sorts, and switches tabs.
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
    queryFn: async (): Promise<LibraryTabCountsResult> => {
      const { queryChunks, filterQuery } = buildCommonQueryClauses(
        libraryConfig,
        filters,
        queryTerm,
        ALL_SEARCH_FIELDS,
      )
      const query = buildTabCountsQuery(queryChunks, filterQuery, libraryConfig.showAllControlled)
      const response = await DataSet.searchDatasetIndexV2(query)
      // Return the raw response alongside the counts so study-asset grids can be
      // rendered from the same shared `studies` aggregation without a second request.
      return { counts: computeTabCounts(response, filters), response }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Keep the previous counts visible while a new query loads to avoid flicker.
    placeholderData: previousData => previousData,
  })
}
