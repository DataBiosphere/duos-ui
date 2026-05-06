import { AssetFilterConfig, AssetType } from 'src/types/library'

export const assetFilterRegistry: Record<AssetType, AssetFilterConfig> = {
  [AssetType.STUDIES]: {
    visibleFilters: ['accessManagement', 'dataUse', 'dataType', 'dac', 'participantCount'],
  },
  [AssetType.DATASETS]: {
    visibleFilters: ['accessManagement', 'dataUse', 'dataType', 'dac', 'participantCount'],
  },
  [AssetType.MODELS]: {
    visibleFilters: [],
  },
  [AssetType.WORKSPACES]: {
    visibleFilters: ['workspaceTools', 'workspacePlatform'],
  },
  [AssetType.CLINICAL_TRIALS]: {
    visibleFilters: [
      'clinicalTrialStatus',
      'clinicalTrialPhase',
      'clinicalTrialInterventionType',
      'clinicalTrialRegistry',
      'clinicalTrialDates',
    ],
  },
  [AssetType.BIOSPECIMENS]: {
    visibleFilters: [
      'biospecimenType',
      'biospecimenCollectionDate',
      'biospecimenPostMortemIntervalUnit',
      'biospecimenPostMortemInterval',
      'biospecimenDataUse',
      'participantCount',
    ],
  },
  [AssetType.PUBLICATIONS]: {
    visibleFilters: [],
  },
  [AssetType.PRESENTATIONS]: {
    visibleFilters: ['datasetsCited'],
  },
  [AssetType.INTELLECTUAL_PROPERTY]: {
    visibleFilters: ['ipFiledDate'],
  },
  [AssetType.FUNDING_RESOURCES]: {
    visibleFilters: ['fundingDate'],
  },
}
