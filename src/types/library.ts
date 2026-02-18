/**
 * Type definitions for the Data Library feature
 */

export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  MODELS = 'models',
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

export interface LibraryUrlState {
  library: string
  tab: AssetType
  filters: FilterState
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
