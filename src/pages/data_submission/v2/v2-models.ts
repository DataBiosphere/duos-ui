import { Dataset, FileStorageObject } from 'src/types/model'
import { StudyType } from 'src/components/forms/StudyType'

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

export class BooleanStudyProperty extends StudyProperty {
  fieldTitle: string
  constructor(key: string, fieldTitle: string, value?: boolean | undefined, studyId?: number, studyPropertyId?: number) {
    super(key, 'Boolean', value, studyId, studyPropertyId)
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
  static readonly key = 'nihGrantContractNumber'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(NihGrantContractNumber.key, 'NIH Grant or Contract Number', 'Enter the Grant or Contract Number', value, studyId, studyPropertyId)
  }
}

export class SubmittingToAnvil extends StudyProperty {
  static readonly key = 'submittingToAnvil'
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super(SubmittingToAnvil.key, 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetPublicReleaseDate extends DateStudyProperty {
  static readonly key = 'alternativeDataSharingPlanTargetPublicReleaseDate'
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanTargetPublicReleaseDate.key, 'Target Public Release Date', 'Please enter date (YYYY-MM-DD)', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanFileName extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanFileName'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanFileName.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPStudyRegistrationName extends StringStudyProperty {
  static readonly key = 'dbGaPStudyRegistrationName'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(DbGaPStudyRegistrationName.key, 'dbGaP Study Registration Name', 'Name', value, studyId, studyPropertyId)
  }
}

export class PiInstitution extends StudyProperty {
  static readonly key = 'piInstitution'
  static readonly fieldTitle = 'Principal Investigator Institution'
  constructor(value: number, studyId?: number, studyPropertyId?: number) {
    super(PiInstitution.key, 'Number' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DataCustodianEmail extends StudyProperty {
  static readonly key = 'dataCustodianEmail'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super(DataCustodianEmail.key, 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetDeliveryDate extends DateStudyProperty {
  static readonly key = 'alternativeDataSharingPlanTargetDeliveryDate'
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanTargetDeliveryDate.key, 'Target Delivery Date', 'Please enter date (YYYY-MM-DD)', value, studyId, studyPropertyId)
  }
}

export class PhenotypeIndication extends StringStudyProperty {
  static readonly key = 'phenotypeIndication'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(PhenotypeIndication.key, 'Phenotype/Indication Studied', 'Enter the "Phenotype/Indication studied"', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanExplanation extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanExplanation'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanExplanation.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanReasons extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanReasons'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanReasons', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class Species extends StringStudyProperty {
  static readonly key = 'species'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(Species.key, 'Species', 'Species', value, studyId, studyPropertyId)
  }
}

export class NihICsSupportingStudy extends StudyProperty {
  static readonly key = 'nihICsSupportingStudy'
  static readonly fieldTitle = 'NIH ICs Supporting the Study'
  static readonly fieldPlaceholderText = 'Institute/Center Name'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super(NihICsSupportingStudy.key, 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataSubmitted extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanDataSubmitted'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanDataSubmitted.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanControlledOpenAccess extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanControlledOpenAccess'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanControlledOpenAccess.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihInstitutionCenterSubmission extends StudyProperty {
  static readonly key = 'nihInstitutionCenterSubmission'
  static readonly fieldTitle = 'NIH Institute/Center for Submission'
  static readonly fieldPlaceholderText = 'Institute/Center Name'
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(NihInstitutionCenterSubmission.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class MultiCenterStudy extends BooleanStudyProperty {
  static readonly key = 'multiCenterStudy'
  static readonly fieldTitle = 'Is this a multi-center study?'
  constructor(value?: boolean, studyId?: number, studyPropertyId?: number) {
    super(MultiCenterStudy.key, MultiCenterStudy.fieldTitle, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlan extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlan'
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlan.key, 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPPhsID extends StringStudyProperty {
  static readonly key = 'dbGaPPhsID'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(DbGaPPhsID.key, 'dbGaP phs ID', 'Enter phs ID', value, studyId, studyPropertyId)
  }
}

export class EmbargoReleaseDate extends DateStudyProperty {
  static readonly key = 'embargoReleaseDate'
  constructor(value?: Date, studyId?: number, studyPropertyId?: number) {
    super(EmbargoReleaseDate.key, 'Embargo Release Date', 'YYYY-MM-DD', value, studyId, studyPropertyId)
  }
}

export class StudyTypeProperty extends StudyProperty {
  static readonly key = 'studyType'
  static readonly fieldTitle = 'Study Type'
  static readonly fieldPlaceholderText = 'Select a Study Type'
  static readonly STUDY_TYPE_OPTIONS = StudyType.NAME_VALUES

  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super(StudyTypeProperty.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class SequencingCenter extends StringStudyProperty {
  static readonly key = 'sequencingCenter'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(SequencingCenter.key, 'Sequencing Center', 'Name', value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataReleased extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanDataReleased'
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanDataReleased.key, 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSR extends BooleanStudyProperty {
  static readonly key = 'controlledAccessRequiredForGenomicSummaryResultsGSR'
  static readonly fieldTitle = 'Is controlled access required for genomic summary results (GSR)?'
  constructor(value?: boolean, studyId?: number, studyPropertyId?: number) {
    super(ControlledAccessRequiredForGenomicSummaryResultsGSR.key, ControlledAccessRequiredForGenomicSummaryResultsGSR.fieldTitle, value, studyId, studyPropertyId)
  }
}

export class NihProgramOfficerName extends StringStudyProperty {
  static readonly key = 'nihProgramOfficerName'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(NihProgramOfficerName.key, 'NIH Program Officer Name', 'Enter the NIH Program Officer\'s Name', value, studyId, studyPropertyId)
  }
}

export class NihAnvilUse extends StudyProperty {
  static readonly key = 'nihAnvilUse'
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
    super(NihAnvilUse.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
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
    super(NihGenomicProgramAdministratorName.key, 'NIH Genomic Program Administrator Name', 'Enter the NIH Genomic Program Administrator\'s name ', value, studyId, studyPropertyId)
  }
}

export class CollaboratingSites extends StudyProperty {
  static readonly key = 'collaboratingSites'
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super(CollaboratingSites.key, 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation extends StringStudyProperty {
  static readonly key = 'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key, 'If yes, explain why controlled access is needed for GSR.', 'Enter explanation here', value, studyId, studyPropertyId)
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
