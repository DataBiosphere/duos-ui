/**
 * Type definitions for the Data Library feature
 */
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import { AiModel, Biospecimen, ClinicalTrial, Presentation, Publication, FundingResource } from 'src/types/model'

export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  MODELS = 'models',
  CLINICAL_TRIALS = 'clinical_trials',
  BIOSPECIMENS = 'biospecimens',
  PUBLICATIONS = 'publications',
  PRESENTATIONS = 'presentations',
  FUNDING_RESOURCES = 'funding_resources',
}

export interface LibraryVersionNew {
  key: string
  query?: unknown
  icon?: string
  title: string
  description?: string
  featured: boolean
  order: number
}

export enum AccessManagement {
  CONTROLLED = 'controlled',
  OPEN = 'open',
  EXTERNAL = 'external',
}

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

export interface FilterOption {
  value: string
  label: string
  count?: number
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

export interface LibraryFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  availableFilters: AvailableFilters
  loading?: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface LibraryUrlState {
  library: string
  tab: AssetType
  filters: FilterState
  query?: string
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: SortOrder
}

export interface TabConfig {
  key: AssetType
  label: string
  count?: number
}

export interface LibraryTabsProps {
  value: AssetType
  onChange: (assetType: AssetType) => void
  tabs: TabConfig[]
}

export type ExportableDatasets = { [duosId: string]: SnapshotSummaryModel[] }

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
  sortModel: Array<{ field: string, sort: SortOrder | null }>
  onSortChange: (model: Array<{ field: string, sort: SortOrder | null }>) => void
  selectedDatasetIds: number[]
  onSelectionChange: (selectedIds: number[]) => void
  exportableDatasets?: ExportableDatasets
  radarEnabledDatasetIds?: Set<number>
}

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

export interface PaginationState {
  page: number
  pageSize: number
}

export interface SortState {
  field: string
  order: SortOrder
}

export interface LibraryFooterProps {
  selectedDatasetIds: number[]
  selectedStudyIds: number[]
  onApplyForAccess: () => void
}

export interface ModelAsset extends Omit<AiModel, 'studyId'> {
  studyId: number
  studyName: string
}

export interface ClinicalTrialAsset extends Omit<ClinicalTrial, 'studyId'> {
  studyId: number
  studyName: string
}

export interface BiospecimenAsset extends Omit<Biospecimen, 'studyId'> {
  studyId: number
  studyName: string
}

export interface PublicationAsset extends Omit<Publication, 'studyId'> {
  studyId: number
  studyName: string
  /** Convenience flattening of the authors array for display/search */
  authorNames: string[]
}

export interface PresentationAsset extends Omit<Presentation, 'studyId'> {
  studyId: number
  studyName: string
}

export interface FundingResourceAsset extends Omit<FundingResource, 'studyId'> {
  studyId: number
  studyName: string
}
