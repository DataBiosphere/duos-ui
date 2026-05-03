import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, IntellectualPropertyStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { IntellectualPropertyAsset, PaginationState, SortState } from 'src/types/library'
import { makeIntellectualPropertyColumns } from 'src/components/data_library/columns/intellectualPropertyColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const intellectualPropertyAsset: AssetDefinition = {
  label: { singular: 'Intellectual Property', plural: 'Intellectual Properties' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.intellectualProperties.title',
    'study.assets.intellectualProperties.type',
    'study.assets.intellectualProperties.assignee',
    'study.assets.intellectualProperties.patentNumber',
    'study.assets.intellectualProperties.status',
    'study.assets.intellectualProperties.contact',
    'study.assets.intellectualProperties.tags',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested intellectual property assets stored
    // under study.assets.intellectualProperties; client-side pagination is
    // applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as IntellectualPropertyStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const items: IntellectualPropertyAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyIPs = studyData.assets?.intellectualProperties || []
      for (const [ipIndex, ip] of studyIPs.entries()) {
        // ipId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        items.push({
          ipId: ip.ipId || `${bucket.key}-${ipIndex}`,
          studyId: bucket.key,
          studyName: (studyData as { studyName?: string }).studyName || '',
          type: ip.type || '',
          title: ip.title || '',
          assignee: ip.assignee || '',
          patentNumber: ip.patentNumber || '',
          filingDate: ip.filingDate || '',
          status: ip.status || '',
          url: ip.url || '',
          contact: ip.contact || '',
          tags: ip.tags || [],
        })
      }
    }

    const total = items.length
    const start = pagination.page * pagination.pageSize
    return {
      items: items.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as IntellectualPropertyAsset).ipId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Intellectual properties do not participate in dataset-level access requests
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
    return makeIntellectualPropertyColumns(props?.selectedMenuTab) as GridColDef[]
  },
}
