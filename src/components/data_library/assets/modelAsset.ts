import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, ModelStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { ModelAsset, PaginationState, SortState } from 'src/types/library'
import { makeModelColumns } from 'src/components/data_library/columns/modelColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const modelAsset: AssetDefinition = {
  label: { singular: 'AI Model', plural: 'AI Models' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.models.name',
    'study.assets.models.format',
    'study.assets.models.license',
    'study.assets.models.tags',
    'study.assets.models.description',
    'study.assets.models.url',
    'study.assets.models.trainedOnDatasets',
    'study.assets.models.maintainer.name',
    'study.assets.models.maintainer.email',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested model assets stored under
    // study.assets.models; client-side pagination is applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as ModelStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const models: ModelAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyModels = studyData.assets?.models || []
      for (const [modelIndex, model] of studyModels.entries()) {
        // modelId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        models.push({
          modelId: model.modelId || `${bucket.key}-${modelIndex}`,
          studyId: bucket.key,
          studyName: studyData.studyName || '',
          name: model.name || '',
          description: model.description || '',
          url: model.url || '',
          format: model.format || '',
          license: model.license || '',
          trainedOnDatasets: model.trainedOnDatasets || [],
          maintainer: {
            name: model.maintainer?.name || '',
            email: model.maintainer?.email || '',
          },
          tags: model.tags || [],
        })
      }
    }

    const total = models.length
    const start = pagination.page * pagination.pageSize
    return {
      items: models.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as ModelAsset).modelId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Models do not participate in dataset-level access requests
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
    return makeModelColumns() as GridColDef[]
  },
}
