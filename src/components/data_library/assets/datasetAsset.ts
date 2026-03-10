import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { PaginationState, SortState } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

// Text fields cannot be sorted directly and must use their .keyword sub-field.
const SORT_FIELD_MAP: Record<string, string> = {
  datasetName: 'datasetName.keyword',
  studyName: 'study.studyName.keyword',
  accessManagement: 'accessManagement.keyword',
  dac: 'dac.dacName.keyword',
  datasetIdentifier: 'datasetIdentifier.keyword',
}

const FILTER_AGGS = {
  access_management: { terms: { field: 'accessManagement.keyword' } },
  data_use: { terms: { field: 'dataUse.primary.code.keyword' } },
  data_type: { terms: { field: 'study.dataTypes.keyword' } },
  dac: { terms: { field: 'dac.dacName.keyword' } },
}

export const datasetAsset: AssetDefinition = {
  label: { singular: 'Dataset', plural: 'Datasets' },
  sortingMode: 'server',
  searchFields: [
    'datasetName',
    'dataLocation',
    'study.description',
    'study.studyName',
    'study.species',
    'study.piName',
    'study.dataCustodianEmail',
    'study.dataTypes',
    'dataUse.primary.code',
    'dataUse.secondary.code',
    'dac.dacName',
    'datasetIdentifier',
    'data.tags',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    pagination: PaginationState,
    sort?: SortState,
  ): ElasticsearchQuery {
    const esSortField = sort ? (SORT_FIELD_MAP[sort.field] ?? sort.field) : undefined
    return {
      from: pagination.page * pagination.pageSize,
      size: pagination.pageSize,
      query: {
        bool: {
          must: queryChunks,
          ...(filterQuery.length > 0 && { filter: filterQuery }),
        },
      },
      ...(sort && {
        sort: [
          {
            [esSortField!]: { order: sort.order },
          },
        ],
      }),
      aggs: FILTER_AGGS,
    }
  },

  transformResponse(response: ElasticsearchResponse, _pagination: PaginationState): LibraryPage {
    // The API may return an array directly, a DUOS-shaped object, or a raw
    // Elasticsearch response with a `hits` wrapper.
    const raw = response as unknown as Record<string, unknown>
    const items = Array.isArray(raw)
      ? (raw as DatasetTerm[])
      : ((raw.hits as { hits?: Array<{ _source?: DatasetTerm }> })?.hits?.map(h => h._source as DatasetTerm) || [])
    return {
      items,
      total: Array.isArray(raw)
        ? (raw as DatasetTerm[]).length
        : ((raw.hits as { total?: { value?: number } })?.total?.value || 0),
      aggregations: (raw.aggregations as Record<string, unknown>) || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as DatasetTerm).datasetId
  },

  isRowSelectable(row: LibraryRow): boolean {
    const dataset = row as DatasetTerm
    return dataset.accessManagement !== 'open' && dataset.accessManagement !== 'external'
  },

  computeRowSelection(_data: LibraryRow[], selectedDatasetIds: number[]): Set<string | number> {
    return new Set(selectedDatasetIds)
  },

  selectionToDatasetIds(_data: LibraryRow[], selectedRowIds: (string | number)[]): number[] {
    return selectedRowIds as number[]
  },

  getStudyIdsForSelection(data: LibraryRow[], selectedDatasetIds: number[]): number[] {
    return data
      .filter(d => selectedDatasetIds.includes((d as DatasetTerm).datasetId))
      .map(d => (d as DatasetTerm).study?.studyId)
      .filter((id): id is number => id !== undefined)
  },

  makeColumns(props?: ColumnsProps): GridColDef[] {
    return makeDatasetColumns(props?.exportableDatasets, props?.radarEnabledDatasetIds) as GridColDef[]
  },
}
