/**
 * Type definitions for the Data Library feature
 */

import { DatasetTerm } from './model'

// Asset types for different library views
export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  MODELS = 'models',
}

// Library configuration
export interface LibraryVersion {
  key: string
  query: ElasticsearchQuery | null
  icon: string | null
  title: string
  description?: string
  featured: boolean
  order: number
}

// ElasticSearch query types
export interface MatchQuery {
  match: {
    [field: string]: string | number | boolean
  }
}

export interface ExistsQuery {
  exists: {
    field: string
  }
}

export interface TermQuery {
  term: {
    [field: string]: string | number | boolean
  }
}

export interface MatchPhraseQuery {
  match_phrase: {
    [field: string]: string | number
  }
}

export interface MultiMatchQuery {
  multi_match: {
    query: string
    type?: string
    fields: string[]
  }
}

export interface RangeQuery {
  range: {
    [field: string]: {
      gte?: number
      lte?: number
      gt?: number
      lt?: number
    }
  }
}

export interface BoolQuery {
  bool: {
    must?: QueryClause[]
    should?: QueryClause[]
    must_not?: QueryClause[]
    filter?: QueryClause[]
  }
}

export type QueryClause
  = MatchQuery
    | ExistsQuery
    | TermQuery
    | MatchPhraseQuery
    | MultiMatchQuery
    | RangeQuery
    | BoolQuery

export interface ElasticsearchQuery {
  from?: number
  size?: number
  query?: {
    bool: {
      must?: QueryClause[]
      should?: QueryClause[]
      must_not?: QueryClause[]
      filter?: QueryClause[]
    }
  }
  sort?: Array<{
    [field: string]: {
      order: 'asc' | 'desc'
    }
  }>
  aggs?: {
    [key: string]: AggregationDefinition
  }
}

// Aggregation types
export interface TermsAggregation {
  terms: {
    field: string
    size?: number
  }
}

export interface CompositeAggregation {
  composite: {
    size: number
    sources: Array<{
      [key: string]: {
        terms: {
          field: string
        }
      }
    }>
    after?: {
      [key: string]: string | number
    }
  }
  aggs?: {
    [key: string]: AggregationDefinition
  }
}

export interface TopHitsAggregation {
  top_hits: {
    size: number
    _source?: string[]
  }
}

export interface ValueCountAggregation {
  value_count: {
    field: string
  }
}

export interface SumAggregation {
  sum: {
    field: string
  }
}

export interface CardinalityAggregation {
  cardinality: {
    field: string
  }
}

export type AggregationDefinition
  = TermsAggregation
    | CompositeAggregation
    | TopHitsAggregation
    | ValueCountAggregation
    | SumAggregation
    | CardinalityAggregation

export interface AggregationBucket {
  key: string | number | { [key: string]: string | number }
  doc_count: number
  [key: string]: unknown
}

export interface AggregationResult {
  buckets?: AggregationBucket[]
  value?: number
  after_key?: {
    [key: string]: string | number
  }
  [key: string]: unknown
}

// Specific types for study aggregation response
export interface StudyAggregationBucket {
  key: { study_id: number }
  doc_count: number
  study_details?: {
    hits?: {
      hits?: Array<{
        _source?: {
          study?: {
            studyId?: number
            studyName?: string
            description?: string
            piName?: string
            species?: string
            phenotype?: string
            dataCustodianEmail?: string[]
          }
        }
      }>
    }
  }
  dataset_count?: {
    value: number
  }
  total_participants?: {
    value: number
  }
  dataset_ids?: {
    buckets: Array<{ key: number }>
  }
}

export interface StudyAggregationResponse {
  buckets: StudyAggregationBucket[]
  after_key?: { study_id: number }
}

// Filter state
export interface FilterState {
  accessManagement: string[]
  dataUse: string[]
  dataType: string[]
  dac: string[]
  participantCount: {
    min?: number
    max?: number
  }
}

export interface AvailableFilters {
  accessManagement: FilterOption[]
  dataUse: FilterOption[]
  dataType: FilterOption[]
  dac: FilterOption[]
  participantCountRange: {
    min: number
    max: number
  }
}

export interface FilterOption {
  value: string
  label: string
  count?: number
}

// Pagination state
export interface PaginationState {
  page: number
  pageSize: number
}

// Sort state
export interface SortState {
  field: string
  order: 'asc' | 'desc'
}

// Study aggregation result
export interface StudyAggregation {
  studyId: number
  studyName: string
  studyDescription?: string
  piName: string
  species: string
  phenotype: string
  dataCustodianEmail: string[]
  datasetCount: number
  totalParticipants: number
  datasetIds: number[]
  accessTypes?: string[]
}

// API response types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  aggregations?: {
    [key: string]: AggregationResult
  }
}

export interface ElasticsearchResponse {
  items: DatasetTerm[]
  total: number
  aggregations?: {
    [key: string]: AggregationResult
  }
}

// Library URL state
export interface LibraryUrlState {
  library: string
  tab: AssetType
  search: string
  filters: FilterState
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// Tab configuration
export interface TabConfig {
  key: AssetType
  label: string
  count?: number
}

// Component props interfaces
export interface LibraryHeaderProps {
  icon: string | null
  title: string
  description: string
  searchTerm: string
  onSearchChange: (term: string) => void
  onClearSearch: () => void
}

export interface LibraryTabsProps {
  value: AssetType
  onChange: (assetType: AssetType) => void
  tabs: TabConfig[]
}

export interface LibraryFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  availableFilters: AvailableFilters
  loading?: boolean
}

export interface LibraryDataGridProps {
  assetType: AssetType
  data: unknown[]
  loading: boolean
  total: number
  paginationModel: {
    page: number
    pageSize: number
  }
  onPaginationChange: (model: { page: number, pageSize: number }) => void
  sortModel: Array<{ field: string, sort: 'asc' | 'desc' | null }>
  onSortChange: (model: Array<{ field: string, sort: 'asc' | 'desc' | null }>) => void
  selectedDatasetIds: number[]
  onSelectionChange: (selectedIds: number[]) => void
}

export interface LibraryFooterProps {
  selectedDatasetIds: number[]
  datasets: DatasetTerm[]
  onApplyForAccess: () => void
}

export interface LibraryContentProps {
  libraryConfig: LibraryVersion
  assetType: AssetType
  selectedDatasetIds: number[]
  onSelectionChange: (ids: number[]) => void
}
