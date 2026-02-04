import { isNil, isString } from 'lodash'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'
import { FileStorageObject } from 'src/types/model'

export interface ConsentGroup {
  generalResearchUse?: boolean
  hmb?: boolean
  diseaseSpecificUse?: boolean
  poa?: boolean
  otherPrimary?: string
}
export type AccessManagementType = 'controlled' | 'open' | 'external'
export interface ConsentGroup2 {
  nihInstitutionalCertificationFile?: FileStorageObject
  addedNIHInstitutionalCertificationFile?: File
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
  mor?: boolean
  morDate?: string
  npu?: boolean
  otherSecondary?: string
  dataLocation?: DataLocationType
  url?: string
  fileTypes?: Array<FileType>
};

export type FileTypeOptions = 'ARRAYS' | 'GENOME' | 'EXOME' | 'SURVEY' | 'PHENOTYPE'
export interface FileType {
  fileType: FileTypeOptions
  functionalEquivalence: string
}

export const selectedPrimaryGroup = (consentGroup: ConsentGroup) => {
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
