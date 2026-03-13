import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, PublicationStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { PaginationState, PublicationAsset, SortState } from 'src/types/library'
import { makePublicationColumns } from 'src/components/data_library/columns/publicationColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const publicationAsset: AssetDefinition = {
  label: { singular: 'Publication', plural: 'Publications' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.publications.title',
    'study.assets.publications.journal',
    'study.assets.publications.doi',
    'study.assets.publications.pubmedId',
    'study.assets.publications.doi',
    'study.assets.publications.authors.name',
    'study.assets.publications.tags',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested publication assets stored under
    // study.assets.publications; client-side pagination is applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as PublicationStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const publications: PublicationAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyPublications = studyData.assets?.publications || []
      for (const [pubIndex, pub] of studyPublications.entries()) {
        // publicationId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        publications.push({
          publicationId: pub.publicationId || `${bucket.key}-${pubIndex}`,
          studyId: bucket.key,
          studyName: (studyData as { studyName?: string }).studyName || '',
          title: pub.title || '',
          pubmedId: pub.pubmedId || '',
          publishedDate: pub.publishedDate || '',
          authors: pub.authors || [],
          authorNames: (pub.authors || []).map((a: { name?: string }) => a.name || '').filter(Boolean),
          bibliographicCitation: pub.bibliographicCitation || '',
          datasetCitation: pub.datasetCitation || '',
          citation: pub.citation ?? false,
          journal: pub.journal || '',
          doi: pub.doi || '',
          url: pub.url || '',
          access: pub.access || '',
          tags: pub.tags || [],
        })
      }
    }

    const total = publications.length
    const start = pagination.page * pagination.pageSize
    return {
      items: publications.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as PublicationAsset).publicationId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Publications do not participate in dataset-level access requests
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
    return makePublicationColumns() as GridColDef[]
  },
}
