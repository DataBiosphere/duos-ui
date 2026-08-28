/**
 * Type definitions for the Data Library feature
 */
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import { AiModel, Biospecimen, ClinicalTrial, IntellectualProperty, Presentation, Publication, FundingResource, Workspace } from 'src/types/model'

export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  MODELS = 'models',
  WORKSPACES = 'workspaces',
  CLINICAL_TRIALS = 'clinical_trials',
  BIOSPECIMENS = 'biospecimens',
  PUBLICATIONS = 'publications',
  PRESENTATIONS = 'presentations',
  INTELLECTUAL_PROPERTY = 'intellectual_properties',
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
  showAllControlled?: boolean
  // When set, restrict results to studies flagged for public visibility
  // (`study.publicVisibility: true`). Applied for the researcher-facing library
  // so non-public studies stay hidden; privileged roles (Chairperson, Data
  // Submitter, Admin, Signing Official) leave it unset to see everything.
  restrictToPublicVisibility?: boolean
}

export enum AccessManagement {
  CONTROLLED = 'controlled',
  OPEN = 'open',
  EXTERNAL = 'external',
}

export interface FilterState {
  accessManagement: string[]
  dataUse: string[]
  // Secondary data use conditions (DUO modifiers, e.g. NPU/IRB/PUB). Kept
  // separate from `dataUse` so a primary code and a modifier combine with AND.
  dataUseModifiers: string[]
  dataType: string[]
  dac: string[]
  workspaceTools: string[]
  workspacePlatform: string[]
  clinicalTrialStatus: string[]
  clinicalTrialPhase: string[]
  clinicalTrialInterventionType: string[]
  clinicalTrialRegistry: string[]
  biospecimenType: string[]
  biospecimenDataUse: string[]
  biospecimenPostMortemIntervalUnit: string[]
  soApprovalModel: string[]
  datasetsCited?: boolean
  publicationsDatasetsCited?: boolean
  instantApproval?: boolean
  participantCount: {
    min?: number
    max?: number
  }
  biospecimenPostMortemInterval: {
    min?: number
    max?: number
  }
  clinicalTrialDates: {
    startDate?: string
    endDate?: string
  }
  biospecimenCollectionDate: {
    after?: string
    before?: string
  }
  ipFiledDate: {
    after?: string
    before?: string
  }
  fundingDate: {
    startDate?: string
    endDate?: string
  }
}

export type FilterKey = keyof FilterState

export interface AssetFilterConfig {
  visibleFilters: FilterKey[]
  labels?: Partial<Record<FilterKey, string>>
}

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export type LibraryFilterSectionControl = 'checkbox' | 'boolean' | 'range' | 'dateRange'

export interface LibraryFilterSection {
  key: FilterKey
  label: string
  control: LibraryFilterSectionControl
  options?: FilterOption[]
  range?: {
    min: number
    max: number
  }
}

export interface AvailableFilters {
  accessManagement: FilterOption[]
  dataUse: FilterOption[]
  dataUseModifiers: FilterOption[]
  dataType: FilterOption[]
  dac: FilterOption[]
  workspaceTools: FilterOption[]
  workspacePlatform: FilterOption[]
  clinicalTrialStatus: FilterOption[]
  clinicalTrialPhase: FilterOption[]
  clinicalTrialInterventionType: FilterOption[]
  clinicalTrialRegistry: FilterOption[]
  biospecimenType: FilterOption[]
  biospecimenDataUse: FilterOption[]
  biospecimenPostMortemIntervalUnit: FilterOption[]
  soApprovalModel: FilterOption[]
  datasetsCited: FilterOption[]
  publicationsDatasetsCited: FilterOption[]
  instantApproval: FilterOption[]
  biospecimenPostMortemIntervalRange: {
    min: number
    max: number
  }
  participantCountRange: {
    min: number
    max: number
  }
}

/**
 * A single active filter that belongs to a tab other than the one currently
 * being viewed. Surfaced so the user can see (and remove) filters carried over
 * from other tabs, even though the control to re-add them lives on another tab.
 */
export interface ActiveFilterChip {
  key: FilterKey
  sectionLabel: string
  valueLabel: string
  // Present for multi-value (array) filters so a single value can be removed;
  // absent for range/date/boolean filters, whose chip clears the whole filter.
  value?: string
}

export interface LibraryFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  sections: LibraryFilterSection[]
  loading?: boolean
  isOpen?: boolean
  onToggle?: () => void
  externalFilters?: ActiveFilterChip[]
  onRemoveExternalFilter?: (chip: ActiveFilterChip) => void
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
  hideFilters: boolean
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

/**
 * Which Signing Official authorization model a dataset's DAC uses, as resolved by the search
 * index. 'per-request' means the SO named in each access request must approve that request before
 * the DAC reviews it; 'pre-authorized' means the SO authorizes researchers in advance instead.
 *
 * 'unknown' means the index supplied no usable model: the backend could not resolve the DAC's
 * rules, or the value is one this client does not recognise. Callers must render nothing in that
 * case rather than defaulting to a model.
 */
export type SoApprovalModel = 'per-request' | 'pre-authorized' | 'unknown'

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
  soApprovalModelByDatasetId?: Map<number, SoApprovalModel>
}

export interface StudyAggregation {
  studyId: number
  studyName: string
  studyDescription?: string
  piName: string
  species: string
  phenotype: string
  dataCustodianEmail: string[]
  dataTypes: string[]
  /** Distinct DUO data use codes (e.g. `HMB`, `GRU`) across the study's datasets */
  dataUseCodes: string[]
  /** Distinct `accessManagement` values (e.g. `open`, `controlled`, `external`) across the study's datasets */
  accessTypes: string[]
  datasetCount: number
  totalParticipants: number
  datasetIds: number[]
  modelCount: number
  workspaceCount: number
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

export interface WorkspaceAsset extends Omit<Workspace, 'studyId'> {
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

export interface IntellectualPropertyAsset extends Omit<IntellectualProperty, 'studyId'> {
  studyId: number
  studyName: string
}

export interface FundingResourceAsset extends Omit<FundingResource, 'studyId'> {
  studyId: number
  studyName: string
}

// Shared: MUI's DataGrid hides its rows-per-page control when the current size is not an option.
export const PAGE_SIZE_OPTIONS = [25, 50, 100]

export const DEFAULT_PAGE_SIZE = 25

export const ALL_LIBRARY_TABS: TabConfig[] = [
  { key: AssetType.STUDIES, label: 'Studies' },
  { key: AssetType.DATASETS, label: 'Datasets' },
  { key: AssetType.MODELS, label: 'AI Models' },
  { key: AssetType.WORKSPACES, label: 'Workspaces' },
  { key: AssetType.CLINICAL_TRIALS, label: 'Clinical Trials' },
  { key: AssetType.BIOSPECIMENS, label: 'Biospecimens' },
  { key: AssetType.PUBLICATIONS, label: 'Publications' },
  { key: AssetType.PRESENTATIONS, label: 'Presentations' },
  { key: AssetType.INTELLECTUAL_PROPERTY, label: 'Intellectual Property' },
  { key: AssetType.FUNDING_RESOURCES, label: 'Funding Resources' },
]
