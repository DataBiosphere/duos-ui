import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, WorkspaceStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { WorkspaceAsset, PaginationState, SortState } from 'src/types/library'
import { makeWorkspaceColumns } from 'src/components/data_library/columns/workspaceColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const workspaceAsset: AssetDefinition = {
  label: { singular: 'Workspace', plural: 'Workspaces' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.workspaces.name',
    'study.assets.workspaces.platform',
    'study.assets.workspaces.description',
    'study.assets.workspaces.tools',
    'study.assets.workspaces.tags',
    'study.assets.workspaces.access',
    'study.assets.workspaces.url',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested workspace assets stored under
    // study.assets.workspaces; client-side pagination is applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as WorkspaceStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const workspaces: WorkspaceAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyWorkspaces = studyData.assets?.workspaces || []
      for (const [workspaceIndex, workspace] of studyWorkspaces.entries()) {
        // workspaceId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        workspaces.push({
          workspaceId: workspace.workspaceId || `${bucket.key}-${workspaceIndex}`,
          studyId: bucket.key,
          studyName: studyData.studyName || '',
          name: workspace.name || '',
          platform: workspace.platform || '',
          url: workspace.url || '',
          description: workspace.description || '',
          tools: workspace.tools || [],
          access: workspace.access || '',
          tags: workspace.tags || [],
        })
      }
    }

    const total = workspaces.length
    const start = pagination.page * pagination.pageSize
    return {
      items: workspaces.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as WorkspaceAsset).workspaceId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Workspaces do not participate in dataset-level access requests
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
    return makeWorkspaceColumns() as GridColDef[]
  },
}
