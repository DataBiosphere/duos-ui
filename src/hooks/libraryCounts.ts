import { ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { AssetType, FilterState, PaginationState } from 'src/types/library'
import { assetRegistry } from 'src/components/data_library/assets'
import { APPROVED_CONTROLLED_SHOULD } from 'src/components/data_library/assets/datasetAsset'

/** Map of asset type → number of items its tab would show for the current query. */
export type TabCounts = Partial<Record<AssetType, number>>

/**
 * Every asset tab except Studies and Datasets is rendered from the identical
 * "aggregate every study, return its `study.*` source" Elasticsearch query and
 * only differs in which `study.assets.*` array its `transformResponse` flattens.
 * Their counts can therefore all be derived from a single shared `studies`
 * aggregation — which those tabs' data query already fetches, so their counts
 * ride along for free with no second request.
 */
// Derived from the AssetType enum rather than hand-listed: every asset other
// than Studies and Datasets is rendered from the shared study aggregation, so a
// newly added asset type is counted automatically and can't be silently omitted
// from the tab badges.
export const STUDY_ASSET_TABS: AssetType[] = Object.values(AssetType).filter(
  type => type !== AssetType.STUDIES && type !== AssetType.DATASETS,
)

// The total is read from `transformResponse`, so no rows need to be materialised.
const COUNT_PAGINATION: PaginationState = { page: 0, pageSize: 0 }

/**
 * Clause used to count the datasets tab, mirroring `datasetAsset.buildQuery`:
 * open/external datasets always count, controlled datasets only once approved.
 * When `showAllControlled` is set (submissions view) every dataset in scope
 * counts, so the clause matches all documents.
 */
export const datasetsCountClause = (showAllControlled?: boolean): QueryClause => {
  if (showAllControlled) {
    return { bool: {} }
  }
  return {
    bool: {
      should: APPROVED_CONTROLLED_SHOULD,
      minimum_should_match: 1,
    },
  }
}

/**
 * Aggregations that turn the shared all-studies-scoped counts query into a
 * tab-counts source:
 *  - `total_studies` (cardinality) → Studies tab count
 *  - `datasets_count` (filter agg)  → Datasets tab count
 *  - `studies` (terms + top_hits)   → the study documents every other tab counts
 */
export const buildCountAggregations = (
  showAllControlled: boolean | undefined,
): NonNullable<ElasticsearchQuery['aggs']> => ({
  total_studies: {
    cardinality: { field: 'study.studyId' },
  },
  datasets_count: {
    filter: datasetsCountClause(showAllControlled),
  },
  studies: {
    terms: { field: 'study.studyId', size: 10000 },
    aggs: {
      study_details: { top_hits: { size: 1, _source: ['study.*'] } },
    },
  },
})

/**
 * Derive the count for every tab from a shared response containing the count
 * aggregations. Reuses each asset's own `transformResponse` so a tab's count
 * exactly matches what it renders, including any client-side filtering. The full
 * filter set is passed so counts reflect the combined filter rules; each asset's
 * `transformResponse` only reads the filter keys it cares about.
 */
export const computeTabCounts = (response: ElasticsearchResponse, filters: FilterState): TabCounts => {
  const aggs = response.aggregations || {}
  const counts: TabCounts = {}

  counts[AssetType.STUDIES] = (aggs.total_studies as { value?: number } | undefined)?.value ?? 0
  counts[AssetType.DATASETS] = (aggs.datasets_count as { doc_count?: number } | undefined)?.doc_count ?? 0

  for (const tab of STUDY_ASSET_TABS) {
    counts[tab] = assetRegistry[tab].transformResponse(
      response,
      COUNT_PAGINATION,
      filters,
    ).total
  }

  return counts
}
