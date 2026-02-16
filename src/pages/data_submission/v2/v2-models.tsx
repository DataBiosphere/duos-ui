import {
  AiModel,
  Biospecimen,
  ClinicalTrial,
  Dataset,
  FileStorageObject,
  FundingResource, IntellectualProperty,
  Presentation,
  Publication,
  Workspace,
} from 'src/types/model'
import { StudyType, StudyTypeNames } from 'src/components/forms/StudyType'
import React from 'react'
import { ConsentGroup2, FileType } from '../consent_group/consentGroupUtils'
import { NIHInstituteAndCenterAbbreviations } from 'src/components/forms/NIHInstitutesAndCenters'

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
  fieldTitle: string | React.JSX.Element
  constructor(key: string, fieldTitle: string | React.JSX.Element, value?: boolean | undefined, studyId?: number, studyPropertyId?: number) {
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

export class AlternativeDataSharingPlanExplanation extends StringStudyProperty {
  static readonly key = 'alternativeDataSharingPlanExplanation'
  static readonly fieldTitle = 'Explanation for request'
  static readonly fieldPlaceholderText = 'Enter the explanation for the request'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanExplanation.key, AlternativeDataSharingPlanExplanation.fieldTitle, AlternativeDataSharingPlanExplanation.fieldPlaceholderText, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanReasons extends StudyProperty {
  static readonly key = 'alternativeDataSharingPlanReasons'
  static readonly VALUES = {
    legalRestrictions: 'Legal Restrictions',
    isInformedConsentProcessesInadequate: 'Informed consent processes are inadequate to support data for sharing for the following reasons:',
    consentFormsUnavailable: 'The consent forms are unavailable or non-existent for samples collected after January 25, 2015',
    consentProcessDidNotAddressFutureUseOrBroadSharing: 'The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015',
    consentProcessInadequatelyAddressesRisk: 'The consent process inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015',
    consentProcessPrecludesFutureUseOrBroadSharing: 'The consent process specifically precludes future use or broad data sharing (including a statement that use of data will be limited to the original researchers)',
    otherInformedConsentLimitationsOrConcerns: 'Other informed consent limitations or concerns',
    otherReasonForRequest: 'Other',
  }

  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanReasons', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export type DataSharingPlanReasons = typeof AlternativeDataSharingPlanReasons.VALUES[keyof typeof AlternativeDataSharingPlanReasons.VALUES]

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
  static readonly VALUES = ['Within 3 months of the last data generated or last clinical visit', 'By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)']
  static readonly key = 'alternativeDataSharingPlanDataSubmitted'
  static readonly fieldTitle = 'Data will be submitted:'
  constructor(value?: string, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanDataSubmitted.key, 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export type AlternativeDataSharingPlanDataSubmittedValues = typeof AlternativeDataSharingPlanDataSubmitted.VALUES[number]

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

export class AlternativeDataSharingPlan extends BooleanStudyProperty {
  static readonly key = 'alternativeDataSharingPlan'
  static readonly fieldTitle = (
    <span>
      Are you requesting an Alternative Data Sharing Plan
      {' '}
      <a href="https://www.genome.gov/about-nhgri/Policies-Guidance/Data-Sharing-Policies-and-Expectations#genomic-data-sharing">
        (info)
      </a>
      {' '}
      for samples that cannot be shared through a public repository or database?
    </span>
  )

  constructor(value?: boolean, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlan.key, AlternativeDataSharingPlan.fieldTitle, value, studyId, studyPropertyId)
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

export class AlternativeDataSharingPlanDataReleased extends BooleanStudyProperty {
  static readonly key = 'alternativeDataSharingPlanDataReleased'
  static readonly fieldTitle = 'Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release'
  constructor(value?: boolean, studyId?: number, studyPropertyId?: number) {
    super(AlternativeDataSharingPlanDataReleased.key, AlternativeDataSharingPlanDataReleased.fieldTitle, value, studyId, studyPropertyId)
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

export type NiHAnvilUseValues
  = | typeof NihAnvilUse.YES_NHGRI_YES_PHS_ID
    | typeof NihAnvilUse.YES_NHGRI_NO_PHS_ID
    | typeof NihAnvilUse.NO_NHGRI_YES_ANVIL
    | typeof NihAnvilUse.NO_NHGRI_NO_ANVIL

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

export class StudyData extends StudyProperty {
  static readonly key = 'data'
  constructor(value: Record<string, unknown>, studyId?: number, studyPropertyId?: number) {
    super(StudyData.key, 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export interface Study {
  studyId?: number
  uuid?: string
  name?: string
  description?: string
  dataTypes?: string[]
  piName: string
  piEmail: string
  publicVisibility?: boolean
  datasetIds?: number[]
  datasets?: Dataset[]
  properties?: StudyProperty[]
  alternativeDataSharingPlan?: FileStorageObject
  alternativeDataSharingPlanFile?: File
  createDate?: string // Date?
  createUserId?: number
  updateDate?: string // Date?
  updateUserId?: number
  assets?: {
    consentGroups?: Array<ConsentGroup2>
    models?: Array<AiModel>
    workspaces?: Array<Workspace>
    publications?: Array<Publication>
    presentations?: Array<Presentation>
    clinicalTrials?: Array<ClinicalTrial>
    funding?: Array<FundingResource>
    intellectualProperties?: Array<IntellectualProperty>
    biospecimens?: Array<Biospecimen>
  }
  data: Record<string, unknown>
}
export interface DatasetRegistrationSchemaV1 {
  /** @description The study name */
  studyName: string
  /**
             * @description The study type
             * @enum {string}
             */
  studyType?: StudyTypeNames
  /** @description Description of the study */
  studyDescription: string
  /** @description All data types that study encompasses */
  dataTypes: string[]
  /** @description Phenotype/Indication Studied */
  phenotypeIndication?: string
  /** @description Species */
  species?: string
  /** @description Principal Investigator Name */
  piName: string
  /* dataSubmitterUserId: number  Removed because the backend will set this value */
  /** @description Data Custodian Email */
  dataCustodianEmail?: string[]
  /** @description Public Visibility of this study */
  publicVisibility: boolean
  /** @enum {string} */
  nihAnvilUse?: NiHAnvilUseValues
  /** @description Are you planning to submit to AnVIL? */
  submittingToAnvil?: boolean
  /** @description dbGaP phs ID */
  dbGaPPhsID?: string
  /** @description dbGaP Study Registration Name */
  dbGaPStudyRegistrationName?: string
  /**
             * Format: date
             * @description Embargo Release Date
             */
  embargoReleaseDate?: string
  /** @description Sequencing Center */
  sequencingCenter?: string
  /**
             * Format: email
             * @description Principal Investigator Email
             */
  piEmail?: string
  /** @description Principal Investigator Institution */
  piInstitution?: number
  /** @description NIH Grant or Contract Number */
  nihGrantContractNumber?: string
  /** @description NIH ICs Supporting the Study */
  nihICsSupportingStudy?: Array<NIHInstituteAndCenterAbbreviations>
  /** @description NIH Program Officer Name */
  nihProgramOfficerName?: string
  /**
             * @description NIH Institution/Center for Submission
             * @enum {string}
             */
  nihInstitutionCenterSubmission?: NIHInstituteAndCenterAbbreviations
  /** @description If an Institutional Certification for this consent group exists, please upload it here (file upload) */
  nihInstitutionalCertificationFileName?: string
  /** @description NIH Genomic Program Administrator Name */
  nihGenomicProgramAdministratorName?: string
  /** @description Is this a multi-center study? */
  multiCenterStudy?: boolean
  /** @description What are the collaborating sites? */
  collaboratingSites?: string[]
  /** @description Is controlled access required for genomic summary results (GSR)? */
  controlledAccessRequiredForGenomicSummaryResultsGSR?: boolean
  /** @description If no, explain why controlled access is required for GSR */
  controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation?: string
  /** @description Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database? */
  alternativeDataSharingPlan?: boolean
  /** @description Please mark the reasons for which you are requesting an Alternative Data Sharing Plan (check all that apply) */
  alternativeDataSharingPlanReasons?: Array<DataSharingPlanReasons>
  /** @description Explanation of Request */
  alternativeDataSharingPlanExplanation?: string
  /** @description Upload your alternative sharing plan (file upload) */
  alternativeDataSharingPlanFileName?: string
  /**
             * @description Upload your alternative sharing plan (file upload)
             * @enum {string}
             */
  alternativeDataSharingPlanDataSubmitted?: AlternativeDataSharingPlanDataSubmittedValues
  /** @description Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release */
  alternativeDataSharingPlanDataReleased?: boolean
  /**
             * Format: date
             * @description Target Delivery Date
             */
  alternativeDataSharingPlanTargetDeliveryDate?: string
  /**
             * Format: date
             * @description Target Public Release Date
             */
  alternativeDataSharingPlanTargetPublicReleaseDate?: string
  /**
             * @description Does the data need to be managed under Controlled, Open, or External Access // appears to be no longer used.
             * @enum {string}
             */
  alternativeDataSharingPlanAccessManagement?: 'Controlled Access' | 'Open Access' | 'External Access'
  /** @description Consent Groups */
  consentGroups: Array<ConsentGroup2>
  /** Study Assets excluding Consent Groups */
  assets?: {
    models?: Array<AiModel>
    workspaces?: Array<Workspace>
    publications?: Array<Publication>
    presentations?: Array<Presentation>
    clinicalTrials?: Array<ClinicalTrial>
    funding?: Array<FundingResource>
    intellectualProperties?: Array<IntellectualProperty>
  }
  data: Record<string, unknown>
}

export type DatasetPropertyType = 'String' | 'Number' | 'Json'
export class DatasetProperty {
  propertyName: string
  datasetId?: number
  propertyId?: number
  schemaProperty: string
  type: DatasetPropertyType
  value?: unknown

  constructor(propertyName: string, schemaProperty: string, type: DatasetPropertyType, value?: unknown, datasetId?: number, propertyId?: number) {
    this.datasetId = datasetId
    this.propertyId = propertyId
    this.propertyName = propertyName
    this.schemaProperty = schemaProperty
    this.type = type
    this.value = value
  }

  toJSON() {
    const obj = {
      propertyName: this.propertyName,
      propertyValue: this.value,
      datasetId: this.datasetId,
      propertyId: this.propertyId,
      schemaProperty: this.schemaProperty,
      propertyType: this.type,
    }
    if (!obj.datasetId) {
      delete obj.datasetId
    }
    if (!obj.propertyId) {
      delete obj.propertyId
    }
    return obj
  }
}

export class StringDatasetProperty extends DatasetProperty {
  fieldTitle: string
  fieldPlaceholderText: string
  constructor(fieldTitle: string, fieldPlaceholderText: string, propertyName: string, schemaProperty: string, value?: string, datasetId?: number, propertyId?: number) {
    super(propertyName, schemaProperty, 'String', value, datasetId, propertyId)
    this.fieldPlaceholderText = fieldPlaceholderText
    this.fieldTitle = fieldTitle
  }
}
export class AccessManagement extends StringDatasetProperty {
  static readonly schemaProperty = 'accessManagement'
  static readonly propertyName = 'Access Management'
  static readonly VALUES = ['controlled', 'open', 'external']
  constructor(value?: string, datasetId?: number, propertyId?: number) {
    super('Access Management', '', AccessManagement.propertyName, AccessManagement.schemaProperty, value, datasetId, propertyId)
  }
}

export enum DataLocationType {
  AnVILWorkspace = 'AnVIL Workspace',
  TerraWorkspace = 'Terra Workspace',
  TDRLocation = 'TDR Location',
  NotDetermined = 'Not Determined',
  Other = 'Other',
}

export class DataLocation extends StringDatasetProperty {
  static readonly schemaProperty = 'dataLocation'
  static readonly propertyName = 'Data Location'
  static readonly VALUES = [
    DataLocationType.AnVILWorkspace,
    DataLocationType.TerraWorkspace,
    DataLocationType.TDRLocation,
    DataLocationType.NotDetermined,
    DataLocationType.Other,
  ]

  constructor(value?: string, datasetId?: number, propertyId?: number) {
    super('Data Location', '', DataLocation.propertyName, DataLocation.schemaProperty, value, datasetId, propertyId)
  }
}

export class DataURL extends StringDatasetProperty {
  static readonly schemaProperty = 'url'
  static readonly propertyName = 'URL'
  constructor(value?: string, datasetId?: number, propertyId?: number) {
    super('URL', '', DataURL.propertyName, DataURL.schemaProperty, value, datasetId, propertyId)
  }
}

export class FileTypes extends DatasetProperty {
  static readonly schemaProperty = 'fileTypes'
  static readonly propertyName = 'File Types'
  constructor(value: Array<FileType>, datasetId?: number, propertyId?: number) {
    super(FileTypes.propertyName, FileTypes.schemaProperty, 'Json' as DatasetPropertyType, value, datasetId, propertyId)
  }
}

export class NumberOfParticipants extends DatasetProperty {
  static readonly schemaProperty = 'numberOfParticipants'
  static readonly propertyName = '# of participants'
  constructor(value: number, datasetId?: number, propertyId?: number) {
    super(NumberOfParticipants.propertyName, NumberOfParticipants.schemaProperty, 'Number' as DatasetPropertyType, value, datasetId, propertyId)
  }
}
export class DatasetData extends DatasetProperty {
  static readonly schemaProperty = 'data'
  static readonly propertyName = 'data'
  constructor(value: Record<string, unknown>, datasetId?: number, propertyId?: number) {
    super(DatasetData.propertyName, DatasetData.schemaProperty, 'Json' as DatasetPropertyType, value, datasetId, propertyId)
  }
}
