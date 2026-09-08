import { GridColDef } from '@mui/x-data-grid'
import { FundingResourceStudyAggregationResponse, ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { FilterState, FundingResourceAsset, PaginationState, SortState } from 'src/types/library'
import { makeFundingResourceColumns } from 'src/components/data_library/columns/fundingResourceColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow, STUDIES_AGG } from 'src/components/data_library/assets/definition'
import { isFilterActive } from 'src/components/data_library/filterRegistry'

// The Elasticsearch clause for fundingDate only decides which *studies* enter
// the shared aggregation; every funding resource of a qualifying study comes
// back, so each row must be re-checked here or the grid (and the tab-count
// badge derived from this same function) includes resources outside the range.
// Mirrors the query semantics: startDate filter → resource starts on/after it,
// endDate filter → resource ends on/before it.
const matchesFundingResourceFilters = (funding: FundingResourceAsset, filters?: FilterState) => {
  if (!filters) {
    return true
  }

  // Inverted bounds build no ES clause, so they must not narrow rows here
  // either — otherwise the grid empties while the panel flags the range.
  if (!isFilterActive('fundingDate', filters)) {
    return true
  }

  const { startDate, endDate } = filters.fundingDate
  if (startDate && (!funding.startDate || funding.startDate < startDate)) {
    return false
  }
  return !(endDate && (!funding.endDate || funding.endDate > endDate))
}

export const fundingResourceAsset: AssetDefinition = {
  label: { singular: 'FundingResource', plural: 'FundingResources' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.funding.fundingId',
    'study.assets.funding.funderName',
    'study.assets.funding.funderProgram',
    'study.assets.funding.grantNumber',
    'study.assets.funding.projectTitle',
    'study.assets.funding.url',
    'study.assets.funding.tags',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested fundingResource assets stored under
    // study.assets.funding; client-side pagination is applied in transformResponse.
    return {
      size: 0,
      query: {
        bool: {
          must: queryChunks,
          ...(filterQuery.length > 0 && { filter: filterQuery }),
        },
      },
      aggs: {
        studies: STUDIES_AGG,
      },
    }
  },

  transformResponse(response: ElasticsearchResponse, pagination: PaginationState, filters?: FilterState): LibraryPage {
    const studiesAgg = response.aggregations?.studies as FundingResourceStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const fundingResources: FundingResourceAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyFundingResources = studyData.assets?.funding || []
      for (const [fundingResourceIndex, fundingResource] of studyFundingResources.entries()) {
        // fundingId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        const row: FundingResourceAsset = {
          fundingId: fundingResource.fundingId || `${bucket.key}-${fundingResourceIndex}`,
          studyId: bucket.key,
          studyName: studyData.studyName || '',
          funderName: fundingResource.funderName || '',
          funderProgram: fundingResource.funderProgram || '',
          grantNumber: fundingResource.grantNumber || '',
          projectTitle: fundingResource.projectTitle || '',
          startDate: fundingResource.startDate || '',
          endDate: fundingResource.endDate || '',
          url: fundingResource.url || '',
          tags: fundingResource.tags || [],
        }

        if (matchesFundingResourceFilters(row, filters)) {
          fundingResources.push(row)
        }
      }
    }

    const total = fundingResources.length
    const start = pagination.page * pagination.pageSize
    return {
      items: fundingResources.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as FundingResourceAsset).fundingId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // FundingResources do not participate in dataset-level access requests
    return false
  },

  computeRowSelection(_data: LibraryRow[], _selectedDatasetIds: number[]): Set<string | number> {
    return new Set()
  },

  selectionToDatasetIds(_data: LibraryRow[], _selectedRowIds: (string | number)[]): number[] {
    return []
  },

  getStudyIdsForSelection(_data: LibraryRow[], _selectedDatasetIds: number[]): number[] {
    return []
  },

  makeColumns(_props?: ColumnsProps): GridColDef[] {
    return makeFundingResourceColumns() as GridColDef[]
  },
}
