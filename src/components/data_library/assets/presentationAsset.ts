import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, PresentationStudyAggregationResponse, QueryClause } from 'src/types/elastic'
import { FilterState, PaginationState, PresentationAsset, SortState } from 'src/types/library'
import { makePresentationColumns } from 'src/components/data_library/columns/presentationColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow, STUDIES_AGG } from 'src/components/data_library/assets/definition'
import { isFilterActive } from 'src/components/data_library/filterRegistry'

// The clauses only pick which studies are aggregated, so every presentation of a
// qualifying study comes back and each row needs re-checking here.
const matchesPresentationFilters = (presentation: PresentationAsset, filters?: FilterState) => {
  if (!filters) {
    return true
  }

  if (filters.presentationEvent.length > 0 && !filters.presentationEvent.includes(presentation.event || '')) {
    return false
  }

  if (filters.presentationFormat.length > 0 && !filters.presentationFormat.includes(presentation.format || '')) {
    return false
  }

  if (filters.presentationAccess.length > 0 && !filters.presentationAccess.includes(presentation.access || '')) {
    return false
  }

  // Inverted bounds build no clause, so they must not narrow rows here either.
  if (!isFilterActive('presentationDate', filters)) {
    return true
  }

  // A missing date matches neither bound, as the ES range clause does.
  const { after, before } = filters.presentationDate
  if (after && (!presentation.date || presentation.date < after)) {
    return false
  }
  return !(before && (!presentation.date || presentation.date > before))
}

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
    'study.assets.presentations.presenter.name',
    'study.assets.presentations.format',
    'study.assets.presentations.tags',
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
        studies: STUDIES_AGG,
      },
    }
  },

  transformResponse(response: ElasticsearchResponse, pagination: PaginationState, filters?: FilterState): LibraryPage {
    const studiesAgg = response.aggregations?.studies as PresentationStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const presentations: PresentationAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyPresentations = studyData.assets?.presentations || []
      for (const [presIndex, pres] of studyPresentations.entries()) {
        // presentationId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        const row: PresentationAsset = {
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
          event: (pres.event || '').trim(),
          location: pres.location || '',
          format: (pres.format || '').trim(),
          access: (pres.access || '').trim(),
          tags: pres.tags || [],
        }

        if (matchesPresentationFilters(row, filters)) {
          presentations.push(row)
        }
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
