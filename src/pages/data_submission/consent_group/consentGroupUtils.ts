import { isNil, isString } from 'lodash/fp'

export interface ConsentGroup {
  generalResearchUse?: boolean
  hmb?: boolean
  diseaseSpecificUse?: boolean
  poa?: boolean
  otherPrimary?: string
}
export type AccessManagementType = 'controlled' | 'open' | 'external'
export interface ConsentGroup2 {
  nihInstituionalCertificationFile?: File
  name: string
  consentGroupName: string
  consentGroupId: string | number
  datasetId?: number
  accessManagement?: AccessManagementType
  numberOfParticipants: number
  generalResearchUse?: boolean
  hmb?: boolean
  diseaseSpecificUse?: string[]
  poa?: boolean
  otherPrimary?: string
  dataAccessCommitteeId?: number
  nmds?: boolean
  gso?: boolean
  pub?: boolean
  col?: boolean
  irb?: boolean
  gs?: string
  mor?: string
  npu?: boolean
  otherSecondary?: string
  dataLocation?: 'AnVIL Workspace' | 'Terra Workspace' | 'TDR Location' | 'Not Determined'
  url?: string
  fileTypes?: FileType[]
};

export interface FileType {
  fileType: 'Arrays' | 'Genome' | 'Exome' | 'Survey' | 'Phenotype'
  functionalEquivalence: string
}

export const selectedPrimaryGroup = (consentGroup: ConsentGroup) => {
  if (isNil(consentGroup)) return undefined
  if (isNil(consentGroup)) return undefined
  if (!isNil(consentGroup.generalResearchUse) && consentGroup.generalResearchUse) {
    return 'generalResearchUse'
  }
  else if (!isNil(consentGroup.hmb) && consentGroup.hmb) {
    return 'hmb'
  }
  else if (!isNil(consentGroup.diseaseSpecificUse)) {
    return 'diseaseSpecificUse'
  }
  else if (!isNil(consentGroup.poa) && consentGroup.poa) {
    return 'poa'
  }
  else if (!isNil(consentGroup.otherPrimary) && isString(consentGroup.otherPrimary)) {
    return 'otherPrimary'
  }

  return undefined
}
