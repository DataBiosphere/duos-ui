import { AssetFilterConfig, AssetType } from 'src/types/library'

export const assetFilterRegistry: Record<AssetType, AssetFilterConfig> = {
  [AssetType.STUDIES]: {
    visibleFilters: ['accessManagement', 'dataUse', 'dataUseModifiers', 'dataType', 'dac', 'participantCount'],
  },
  [AssetType.DATASETS]: {
    visibleFilters: [
      'accessManagement',
      'dataUse',
      'dataUseModifiers',
      'dataType',
      'dac',
      'participantCount',
      'soApprovalModel',
      'instantApproval',
    ],
  },
  [AssetType.MODELS]: {
    visibleFilters: ['modelFormat', 'modelLicense', 'modelCloud', 'modelTags'],
  },
  [AssetType.WORKSPACES]: {
    visibleFilters: ['workspaceTools', 'workspacePlatform', 'workspaceCloud', 'workspaceAccess'],
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
    visibleFilters: ['publicationJournal', 'publicationAccess', 'publicationPublishedDate'],
  },
  [AssetType.PRESENTATIONS]: {
    visibleFilters: ['presentationEvent', 'presentationFormat', 'presentationAccess', 'presentationDate'],
  },
  [AssetType.INTELLECTUAL_PROPERTY]: {
    visibleFilters: ['ipType', 'ipStatus', 'ipFiledDate'],
  },
  [AssetType.FUNDING_RESOURCES]: {
    visibleFilters: ['fundingFunderName', 'fundingDate'],
  },
}
