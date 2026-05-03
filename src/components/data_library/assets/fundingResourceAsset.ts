import { GridColDef } from '@mui/x-data-grid'
import { FundingResourceStudyAggregationResponse, ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { FundingResourceAsset, PaginationState, SortState } from 'src/types/library'
import { makeFundingResourceColumns } from 'src/components/data_library/columns/fundingResourceColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

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
        studies: {
          terms: {
            field: 'study.studyId',
            size: 10000,
          },
          aggs: {
            study_details: {
              top_hits: {
                size: 1,
                _source: ['study.*'],
              },
            },
          },
        },
      },
    }
  },

  transformResponse(response: ElasticsearchResponse, pagination: PaginationState): LibraryPage {
    const studiesAgg = response.aggregations?.studies as FundingResourceStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const fundingResources: FundingResourceAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyFundingResources = studyData.assets?.funding || []
      for (const [fundingResourceIndex, fundingResource] of studyFundingResources.entries()) {
        // fundingId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        fundingResources.push({
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
        })
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

  makeColumns(props?: ColumnsProps): GridColDef[] {
    return makeFundingResourceColumns() as GridColDef[]
  },
}
