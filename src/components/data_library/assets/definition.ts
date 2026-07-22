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
import { AggregationDefinition, ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import {
  ClinicalTrialAsset,
  BiospecimenAsset,
  ExportableDatasets,
  IntellectualPropertyAsset,
  FundingResourceAsset,
  ModelAsset,
  FilterState,
  PaginationState,
  PresentationAsset,
  PublicationAsset,
  SortState,
  StudyAggregation,
  WorkspaceAsset,
} from 'src/types/library'
import { DatasetTerm } from 'src/types/model'

/**
 * The shared "aggregate every matching study, return its `study.*` source"
 * aggregation. Every asset tab except Studies and Datasets renders its rows by
 * flattening one of the `study.assets.*` arrays returned by this aggregation, so
 * they all use the identical shape here. The tab-counts query (`libraryCounts`)
 * reuses the same constant so a tab's badge is computed from a byte-identical
 * aggregation to the one its grid renders — the single source of truth that keeps
 * every study-asset badge in agreement with its grid.
 *
 * If this shape ever needs to change (size, `_source`, nested aggs), changing it
 * here updates every study-asset grid AND the count query together, so they
 * cannot silently diverge.
 */
export const STUDIES_AGG: AggregationDefinition = {
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
}

/** Union of every row type that can appear in the DataGrid */
export type LibraryRow = DatasetTerm | StudyAggregation | ModelAsset | WorkspaceAsset | ClinicalTrialAsset | BiospecimenAsset | PublicationAsset | PresentationAsset | IntellectualPropertyAsset | FundingResourceAsset

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
  soDarApprovalRequiredDatasetIds?: Set<number>
  /** Whether any datasets are currently selected — selection mode disables row-level request actions */
  hasSelection?: boolean
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
    opts?: { showAllControlled?: boolean },
  ): ElasticsearchQuery

  /** Turn a raw Elasticsearch response into a typed, paginated page */
  transformResponse(response: ElasticsearchResponse, pagination: PaginationState, filters?: FilterState): LibraryPage

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
