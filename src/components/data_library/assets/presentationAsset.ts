import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, PresentationStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { PaginationState, PresentationAsset, SortState } from 'src/types/library'
import { makePresentationColumns } from 'src/components/data_library/columns/presentationColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const presentationAsset: AssetDefinition = {
  label: { singular: 'Presentation', plural: 'Presentations' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.presentations.title',
    'study.assets.presentations.event',
    'study.assets.presentations.location',
    'study.assets.presentations.authors',
    'study.assets.presentations.format',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested presentation assets stored under
    // study.assets.presentations; client-side pagination is applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as PresentationStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const presentations: PresentationAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyPresentations = studyData.assets?.presentations || []
      for (const [presIndex, pres] of studyPresentations.entries()) {
        // presentationId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        presentations.push({
          presentationId: pres.presentationId || `${bucket.key}-${presIndex}`,
          studyId: bucket.key,
          studyName: (studyData as { studyName?: string }).studyName || '',
          title: pres.title || '',
          date: pres.date || '',
          url: pres.url || '',
          authors: pres.authors || '',
          datasetCitation: pres.datasetCitation || '',
          citation: pres.citation ?? false,
          presenter: pres.presenter || undefined,
          event: pres.event || '',
          location: pres.location || '',
          format: pres.format || '',
          access: pres.access || '',
          tags: pres.tags || [],
        })
      }
    }

    const total = presentations.length
    const start = pagination.page * pagination.pageSize
    return {
      items: presentations.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as PresentationAsset).presentationId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Presentations do not participate in dataset-level access requests
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
    return makePresentationColumns() as GridColDef[]
  },
}
