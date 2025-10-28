import { Dataset, FileStorageObject } from 'src/types/model'

export type StudyPropertyType = 'Boolean' | 'String' | 'Number' | 'Date' | 'Json'

export class StudyProperty {
  key: string
  studyPropertyId?: number
  studyId?: number
  type: StudyPropertyType
  value?: unknown

  constructor(key: string, type: StudyPropertyType, value?: unknown, studyId?: number, studyPropertyId?: number) {
    this.key = key
    this.studyId = studyId
    this.studyPropertyId = studyPropertyId
    this.type = type
    this.value = value
  }

  toJSON() {
    const obj = {
      key: this.key,
      value: this.value,
      studyId: this.studyId,
      studyPropertyId: this.studyPropertyId,
    }
    if (!obj.studyId) {
      delete obj.studyId
    }
    if (!obj.studyPropertyId) {
      delete obj.studyPropertyId
    }
    return obj
  }
}

export class StringStudyProperty extends StudyProperty {
  fieldTitle: string
  fieldPlaceholderText: string
  constructor(key: string, fieldTitle: string, fieldPlaceholderText: string, value?: unknown, studyId?: number, studyPropertyId?: number) {
    super(key, 'String', value, studyId, studyPropertyId)
    this.fieldPlaceholderText = fieldPlaceholderText
    this.fieldTitle = fieldTitle
  }
}

export class DateStudyProperty extends StudyProperty {
  fieldTitle: string
  fieldPlaceholderText: string
  constructor(key: string, fieldTitle: string, fieldPlaceholderText: string, value?: unknown, studyId?: number, studyPropertyId?: number) {
    super(key, 'Date', value, studyId, studyPropertyId)
    this.fieldPlaceholderText = fieldPlaceholderText
    this.fieldTitle = fieldTitle
  }
}

export class NihGrantContractNumber extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('nihGrantContractNumber', 'NIH Grant or Contract Number', 'Enter the Grant or Contract Number', value, studyId, studyPropertyId)
  }
}

export class SubmittingToAnvil extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('submittingToAnvil', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetPublicReleaseDate extends DateStudyProperty {
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanTargetPublicReleaseDate', 'Target Public Release Date', 'Please enter date (YYYY-MM-DD)', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanFileName extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanFileName', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPStudyRegistrationName extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('dbGaPStudyRegistrationName', 'dbGaP Study Registration Name', 'Name', value, studyId, studyPropertyId)
  }
}

export class PiInstitution extends StudyProperty {
  static readonly key = 'piInstitution'
  constructor(value: number, studyId?: number, studyPropertyId?: number) {
    super('piInstitution', 'Number' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DataCustodianEmail extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('dataCustodianEmail', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetDeliveryDate extends DateStudyProperty {
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanTargetDeliveryDate', 'Target Delivery Date', 'Please enter date (YYYY-MM-DD)', value, studyId, studyPropertyId)
  }
}

export class PhenotypeIndication extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('phenotypeIndication', 'Phenotype/Indication Studied', 'Enter the "Phenotype/Indication studied"', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanExplanation extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanExplanation', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanReasons extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanReasons', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class Species extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('species', 'Species', 'Species', value, studyId, studyPropertyId)
  }
}

export class NihICsSupportingStudy extends StudyProperty {
  static readonly key = 'nihICsSupportingStudy'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('nihICsSupportingStudy', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataSubmitted extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanDataSubmitted', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanControlledOpenAccess extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanControlledOpenAccess', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihInstitutionCenterSubmission extends StudyProperty {
  static readonly key = 'nihInstitutionCenterSubmission'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihInstitutionCenterSubmission', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class MultiCenterStudy extends StudyProperty {
  static readonly key = 'multiCenterStudy'
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('multiCenterStudy', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlan extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlan', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPPhsID extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('dbGaPPhsID', 'dbGaP phs ID', 'Enter phs ID', value, studyId, studyPropertyId)
  }
}

export class EmbargoReleaseDate extends DateStudyProperty {
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super('embargoReleaseDate', 'Embargo Release Date', 'YYYY-MM-DD', value, studyId, studyPropertyId)
  }
}

export class StudyType extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('studyType', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class SequencingCenter extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('sequencingCenter', 'Sequencing Center', 'Name', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataReleased extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanDataReleased', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSR extends StudyProperty {
  static readonly key = 'controlledAccessRequiredForGenomicSummaryResultsGSR'
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('controlledAccessRequiredForGenomicSummaryResultsGSR', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihProgramOfficerName extends StringStudyProperty {
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('nihProgramOfficerName', 'nihProgramOfficerName', 'NIH Program Officer Name', value, studyId, studyPropertyId)
  }
}

export class NihAnvilUse extends StudyProperty {
  static readonly YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already'
  static readonly YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID'
  static readonly NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL'
  static readonly NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL'
  static readonly NIH_ANVIL_USE_RADIOGROUP_OPTIONS = [
    { text: NihAnvilUse.YES_NHGRI_YES_PHS_ID, name: NihAnvilUse.YES_NHGRI_YES_PHS_ID },
    { text: NihAnvilUse.YES_NHGRI_NO_PHS_ID, name: NihAnvilUse.YES_NHGRI_NO_PHS_ID },
    { text: NihAnvilUse.NO_NHGRI_YES_ANVIL, name: NihAnvilUse.NO_NHGRI_YES_ANVIL },
    { text: NihAnvilUse.NO_NHGRI_NO_ANVIL, name: NihAnvilUse.NO_NHGRI_NO_ANVIL },
  ]

  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('nihAnvilUse', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }

  static requiresNIHAdministrativeInformation(value: string | null | undefined): boolean {
    if (!value) {
      return false
    }
    return [NihAnvilUse.YES_NHGRI_YES_PHS_ID, NihAnvilUse.YES_NHGRI_NO_PHS_ID, NihAnvilUse.NO_NHGRI_YES_ANVIL].includes(value)
  }
}

export class NihGenomicProgramAdministratorName extends StringStudyProperty {
  static readonly key = 'nihGenomicProgramAdministratorName'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('nihGenomicProgramAdministratorName', 'NIH Genomic Program Administrator Name', 'Enter the NIH Genomic Program Administrator\'s name ', value, studyId, studyPropertyId)
  }
}

export class CollaboratingSites extends StudyProperty {
  static readonly key = 'collaboratingSites'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('collaboratingSites', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation extends StringStudyProperty {
  static readonly key = 'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super('controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation', 'If yes, explain why controlled access is needed for GSR.', '', value, studyId, studyPropertyId)
  }
}

export interface Study {
  studyId?: number
  uuid?: string
  name?: string
  description?: string
  dataTypes?: string[]
  piName?: string
  publicVisibility?: boolean
  datasetIds?: number[]
  datasets?: Dataset[]
  properties?: StudyProperty[]
  alternativeDataSharingPlan?: FileStorageObject
  createDate?: string // Date?
  createUserId?: number
  updateDate?: string // Date?
  updateUserId?: number
}
