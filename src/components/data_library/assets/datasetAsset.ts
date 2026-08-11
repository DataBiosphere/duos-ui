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

// A dataset is visible when it is not controlled, or it is controlled and
// DAC-approved. This is the single source of truth for that predicate; the
// tab-count query reuses it (see `datasetsCountClause`) so the datasets badge
// and the datasets grid never diverge.
export const APPROVED_CONTROLLED_SHOULD: QueryClause[] = [
  { bool: { must_not: [{ term: { accessManagement: 'controlled' } }] } },
  { bool: { must: [
    { term: { accessManagement: 'controlled' } },
    { term: { dacApproval: true } },
  ] } },
]

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
    'datasetIdentifier',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    pagination: PaginationState,
    sort?: SortState,
    opts?: { showAllControlled?: boolean },
  ): ElasticsearchQuery {
    const esSortField = sort ? (SORT_FIELD_MAP[sort.field] ?? sort.field) : undefined
    const sortClause = sort ? { sort: [{ [esSortField!]: { order: sort.order } }] } : {}
    const extraClauses = {
      ...(queryChunks.length > 0 && { must: queryChunks }),
      ...(filterQuery.length > 0 && { filter: filterQuery }),
    }
    const from = pagination.page * pagination.pageSize
    const size = pagination.pageSize

    // Submissions view: include all controlled datasets regardless of dacApproval state
    if (opts?.showAllControlled) {
      return {
        from,
        size,
        query: { bool: extraClauses },
        ...sortClause,
        aggs: FILTER_AGGS,
      }
    }

    // Public library: only surface approved controlled datasets
    return {
      from,
      size,
      query: {
        bool: {
          should: APPROVED_CONTROLLED_SHOULD,
          minimum_should_match: 1,
          ...extraClauses,
        },
      },
      ...sortClause,
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
    return makeDatasetColumns(
      props?.exportableDatasets,
      props?.radarEnabledDatasetIds,
      props?.soApprovalModelByDatasetId,
      props?.hasSelection,
    ) as GridColDef[]
  },
}
