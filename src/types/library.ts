/**
 * Type definitions for the Data Library feature
 */

export enum AssetType {
  STUDIES = 'studies',
  DATASETS = 'datasets',
  MODELS = 'models',
}

export interface LibraryUrlState {
  library: string
  tab: AssetType
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
