/**
 * Asset definition interface for the Data Library.
 *
 * Each data asset type (Studies, Datasets, AI Models, …) that can appear as a
 * tab in the Data Library implements this interface.  Adding a new asset type
 * is therefore a matter of creating one new file in this folder and registering
 * it in `index.ts` — no changes are needed in the generic Data Library
 * components or hook.
 */
import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { ExportableDatasets, ModelRow, PaginationState, SortState, StudyAggregation } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'

/** Union of every row type that can appear in the DataGrid */
export type LibraryRow = DatasetTerm | StudyAggregation | ModelRow

/** Normalized result returned by every asset's `transformResponse` */
export interface LibraryPage {
  items: LibraryRow[]
  total: number
  aggregations: Record<string, unknown>
}

/** Props forwarded to `makeColumns` that only certain assets use */
export interface ColumnsProps {
  exportableDatasets?: ExportableDatasets
  radarEnabledDatasetIds?: Set<number>
}

export interface AssetDefinition {
  /** Singular / plural display names used for count labels and empty states */
  readonly label: { readonly singular: string, readonly plural: string }

  /** Whether the DataGrid sorts rows client-side (`'client'`) or relies on the
   *  server to return pre-sorted results (`'server'`). */
  readonly sortingMode: 'client' | 'server'

  /** Elasticsearch fields to search when a free-text query term is present */
  readonly searchFields: string[]

  /**
   * Build the full Elasticsearch query body.
   *
   * The common code in `buildElasticsearchQuery` assembles the shared
   * `queryChunks` (library filter + search term) and `filterQuery` (filter
   * panel selections) and then delegates the overall query shape—aggregations,
   * pagination, sort—to the asset.
   */
  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    pagination: PaginationState,
    sort?: SortState,
  ): ElasticsearchQuery

  /** Turn a raw Elasticsearch response into a typed, paginated page */
  transformResponse(response: ElasticsearchResponse, pagination: PaginationState): LibraryPage

  /** Unique DataGrid row identifier */
  getRowId(row: LibraryRow): string | number

  /** Whether a row can be selected for an access request */
  isRowSelectable(row: LibraryRow): boolean

  /**
   * Given the current page of data and the global set of selected dataset IDs,
   * compute which DataGrid row IDs should appear checked.
   */
  computeRowSelection(data: LibraryRow[], selectedDatasetIds: number[]): Set<string | number>

  /**
   * Given a new DataGrid row selection, convert it back to the dataset IDs
   * that drive the Apply for Access flow.
   */
  selectionToDatasetIds(data: LibraryRow[], selectedRowIds: (string | number)[]): number[]

  /**
   * Given the current page of data and the global set of selected dataset IDs,
   * return the study IDs that contain those selections.  Used by LibraryFooter.
   */
  getStudyIdsForSelection(data: LibraryRow[], selectedDatasetIds: number[]): number[]

  /** Column definitions for the DataGrid */
  makeColumns(props?: ColumnsProps): GridColDef[]
}
