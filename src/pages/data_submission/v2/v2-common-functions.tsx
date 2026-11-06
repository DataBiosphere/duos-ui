import React from 'react'
import {
  Study,
  StudyProperty,
  StudyPropertyType,
  StringStudyProperty,
  DateStudyProperty, BooleanStudyProperty,
  DatasetRegistrationSchemaV1,
  StudyTypeProperty,
  PhenotypeIndication,
  Species,
  DataCustodianEmail,
  NihAnvilUse,
  NiHAnvilUseValues,
  SubmittingToAnvil,
  DbGaPPhsID,
  EmbargoReleaseDate,
  SequencingCenter,
  PiInstitution,
  NihGrantContractNumber,
  NihICsSupportingStudy,
  NihProgramOfficerName,
  NihInstitutionCenterSubmission,
  NihGenomicProgramAdministratorName,
  MultiCenterStudy,
  CollaboratingSites,
  ControlledAccessRequiredForGenomicSummaryResultsGSR,
  ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation,
  AlternativeDataSharingPlan,
  AlternativeDataSharingPlanReasons,
  DataSharingPlanReasons,
  AlternativeDataSharingPlanExplanation,
  AlternativeDataSharingPlanDataSubmitted,
  AlternativeDataSharingPlanDataSubmittedValues,
  AlternativeDataSharingPlanDataReleased,
  AlternativeDataSharingPlanTargetDeliveryDate,
  AlternativeDataSharingPlanTargetPublicReleaseDate,
  DbGaPStudyRegistrationName,
  AccessManagement,
  DataLocation,
  DataLocationType,
  DataURL,
  RequestLocation,
  FileTypes,
  NumberOfParticipants, StudyData,
  DatasetData,
  ThroughBioId,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Validator } from 'src/components/forms/formValidation'
import { set, isEmpty } from 'src/utils/NodashUtil'
import { Storage } from 'src/libs/storage'
import { NIHInstituteAndCenterAbbreviations } from 'src/components/forms/NIHInstitutesAndCenters'
import { AccessManagementType, ConsentGroup2, FileType } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { Dataset } from 'src/types/model'
import { DataCustodianMetadata, DatasetDataMetadata, PopulationMetadata, PrincipalInvestigatorMetadata, StudyDataMetadata } from 'src/libs/data-metadata'
import dayjs from 'dayjs'
import { missingPopulationFields } from 'src/pages/data_submission/v2/population'
import { normalizeDoi } from 'src/components/forms/formValidation'

export type MasterChangeHandler = ({ key, value, isValid, remove }: { key: string, value: unknown, isValid: boolean, remove?: boolean }) => void

export const generateStudyPropertyYesNoField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: BooleanStudyProperty) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      type={FormFieldTypes.YESNORADIOGROUP}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={({ _key, value }: { _key: string, value: boolean }) => {
        studyProperty.value = value
        setStudyPropertyByKey(formData, setStudy, { isValid: true }, studyProperty)
      }}
    />
  )
}

export const generateStudyPropertyFormTextField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: StringStudyProperty, validators: Validator[] = []) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as string
        setStudyPropertyByKey(formData, setStudy, input, studyProperty)
      }}
    />
  )
}

export const generateStudyInputFormTextField = (setStudy: React.Dispatch<React.SetStateAction<Study>>, id: string, initialValue: string | undefined, title: string, placeholder: string, validators: Validator[] = [], readOnly: boolean = false) => {
  return (
    <FormField
      id={id}
      title={title}
      placeholder={placeholder}
      readOnly={readOnly}
      validators={validators}
      defaultValue={initialValue}
      onChange={({ key, value }: { key: string, value: string }) => {
        setStudy((val: Study) => {
          const newForm = structuredClone(val)
          return set(newForm, key, value)
        })
      }}
    />
  )
}

export const generateStudyPropertyFormDateField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: DateStudyProperty, validators: Validator[] = [], style: React.CSSProperties = {}, description?: string) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      description={description}
      type={FormFieldTypes.CALENDAR}
      validators={validators}
      style={style}
      defaultValue={convertDateEpochToString(getStudyPropertyValueByKey(formData, studyProperty.key))}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as string
        setStudyPropertyByKey(formData, setStudy, input, studyProperty)
      }}
    />
  )
}

export const setStudyPropertyByKey = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, input: { isValid: boolean }, propertyInstance: StudyProperty) => {
  if (!input.isValid) {
    return
  }
  const studyToUpdate = structuredClone(formData)
  studyToUpdate.properties = studyToUpdate.properties ?? []
  const filteredProperty = studyToUpdate.properties.find(prop => prop.key === propertyInstance.key)
  if (filteredProperty) {
    filteredProperty.value = propertyInstance.value
  }
  else {
    studyToUpdate.properties.push(propertyInstance.toJSON() as StudyProperty)
  }
  setStudy(() => {
    return studyToUpdate
  })
}

export const removeStudyPropertiesByKeys = (study: Study, keys: Set<string>) => {
  if (!study?.properties || !Array.isArray(study.properties)) {
    return study
  }
  else {
    const arr: StudyProperty[] = study.properties
    let i = 0
    while (i < arr.length) {
      if (keys.has(arr[i].key)) {
        arr.splice(i, 1)
      }
      else {
        ++i
      }
    }
  }
}

export const getStudyPropertyValueByKey = (formData: Study, key: string): unknown => {
  if (!formData?.properties) {
    return undefined
  }
  const filteredProperty = formData.properties.find(prop => prop.key === key)
  if (filteredProperty) {
    return filteredProperty.value
  }
  else {
    return undefined
  }
}

/** The study's `data` bag: the in-progress edit held in properties[] if any, else the one loaded from Consent. */
export const getStudyDataBag = (study: Study): StudyDataMetadata =>
  (getStudyPropertyValueByKey(study, StudyData.key) as StudyDataMetadata | undefined) ?? study?.data ?? {}

/** A copy of the study with `changes` merged into its `data` bag; a key set to undefined is removed. */
export const withStudyData = (study: Study, changes: Partial<StudyDataMetadata>): Study => {
  const next = structuredClone(study)
  const bag: StudyDataMetadata = { ...getStudyDataBag(next), ...changes }
  for (const key of Object.keys(changes)) {
    if (bag[key] === undefined) {
      delete bag[key]
    }
  }
  next.properties = next.properties ?? []
  const existing = next.properties.find(prop => prop.key === StudyData.key)
  if (existing) {
    existing.value = bag
  }
  else {
    next.properties.push(new StudyData(bag).toJSON() as StudyProperty)
  }
  return next
}

/** Functional, so fields edited in quick succession never overwrite each other with a stale bag. */
export const updateStudyData = (setStudy: React.Dispatch<React.SetStateAction<Study>>, changes: Partial<StudyDataMetadata>) => {
  setStudy(prev => withStudyData(prev, changes))
}

/** Absent reads as true: see `StudyDataMetadata.populationSameAcrossAssets`. */
export const isPopulationSameAcrossAssets = (study: Study): boolean =>
  getStudyDataBag(study).populationSameAcrossAssets !== false

/** The name Consent displays for a PI: the non-empty parts, in order, separated by single spaces. */
export const composePiName = (pi: PrincipalInvestigatorMetadata | undefined): string =>
  [pi?.firstName, pi?.lastName].map(part => (part ?? '').trim()).filter(Boolean).join(' ')

/**
 * The study's PIs, from the data bag when they were entered there. A study registered before then
 * has only `piName` and `piEmail`, so they become the one PI, the name split on whitespace as a
 * starting point the submitter can correct: the last token is the last name and everything before
 * it the first name, so no part of the name is dropped.
 */
export const getPrincipalInvestigators = (study: Study): PrincipalInvestigatorMetadata[] => {
  const stored = getStudyDataBag(study).principalInvestigators
  if (stored?.length) {
    return stored
  }
  const tokens = (study?.piName ?? '').trim().split(/\s+/).filter(Boolean)
  const legacy: PrincipalInvestigatorMetadata = {
    firstName: tokens.length > 1 ? tokens.slice(0, -1).join(' ') : (tokens[0] ?? ''),
    lastName: tokens.length > 1 ? tokens[tokens.length - 1] : '',
  }
  if (study?.piEmail) {
    legacy.email = study.piEmail
  }
  return [legacy]
}

/** Writes the PI list and keeps Consent's `piName` and `piEmail` equal to the first PI's. */
export const withPrincipalInvestigators = (study: Study, pis: PrincipalInvestigatorMetadata[]): Study => {
  const next = withStudyData(study, { principalInvestigators: pis })
  next.piName = composePiName(pis[0])
  const email = pis[0]?.email?.trim()
  if (email) {
    next.piEmail = email
  }
  else {
    delete (next as Partial<Study>).piEmail
  }
  return next
}

/** Functional, so a change is applied to the latest PI list rather than the one this render saw. */
export const updatePrincipalInvestigators = (
  setStudy: React.Dispatch<React.SetStateAction<Study>>,
  change: (pis: PrincipalInvestigatorMetadata[]) => PrincipalInvestigatorMetadata[],
) => {
  setStudy(prev => withPrincipalInvestigators(prev, change(structuredClone(getPrincipalInvestigators(prev)))))
}

/**
 * The study's Data Custodians, from the data bag when they were entered there. A study registered
 * before then has only Consent's `dataCustodianEmail` list, so each email becomes a custodian with
 * no name yet. A study with none shows one empty row to fill in.
 */
export const getDataCustodians = (study: Study): DataCustodianMetadata[] => {
  const stored = getStudyDataBag(study).dataCustodians
  if (stored?.length) {
    return stored
  }
  const emails = getStudyPropertyValueByKey(study, DataCustodianEmail.key) as string[] | undefined
  return emails?.length ? emails.map(email => ({ email })) : [{}]
}

/** Writes the custodian rows and keeps Consent's `dataCustodianEmail` equal to their emails. */
export const withDataCustodians = (study: Study, custodians: DataCustodianMetadata[]): Study => {
  const next = withStudyData(study, { dataCustodians: custodians })
  const emails = [...new Set(custodians.map(custodian => custodian.email?.trim()).filter((email): email is string => !!email))]
  const value = emails.length ? emails : undefined
  const existing = next.properties?.find(prop => prop.key === DataCustodianEmail.key)
  if (existing) {
    existing.value = value
  }
  else if (value) {
    next.properties = [...(next.properties ?? []), new DataCustodianEmail(value).toJSON() as StudyProperty]
  }
  return next
}

/** Functional, so a change is applied to the latest custodian list rather than the one this render saw. */
export const updateDataCustodians = (
  setStudy: React.Dispatch<React.SetStateAction<Study>>,
  change: (custodians: DataCustodianMetadata[]) => DataCustodianMetadata[],
) => {
  setStudy(prev => withDataCustodians(prev, change(structuredClone(getDataCustodians(prev)))))
}

/** Absent reads as true: see `StudyDataMetadata.targetDatesSameAcrossAssets`. */
export const isTargetDatesSameAcrossAssets = (study: Study): boolean =>
  getStudyDataBag(study).targetDatesSameAcrossAssets !== false

/** Absent reads as true: see `StudyDataMetadata.publicVisibilitySameAcrossAssets`. */
export const isPublicVisibilitySameAcrossAssets = (study: Study): boolean =>
  getStudyDataBag(study).publicVisibilitySameAcrossAssets !== false

/** The study-level target dates as YYYY-MM-DD, however the form or Consent held them. */
export const getStudyTargetDates = (study: Study): { targetDeliveryDate?: string, targetPublicReleaseDate?: string } => ({
  targetDeliveryDate: convertDateEpochToString(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetDeliveryDate.key)) || undefined,
  targetPublicReleaseDate: convertDateEpochToString(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetPublicReleaseDate.key)) || undefined,
})

/** What a dataset inherits from the study, for display in the dataset form and for submission. */
export interface StudyInheritance {
  populationSameAcrossAssets: boolean
  studyPopulation?: PopulationMetadata
  targetDatesSameAcrossAssets: boolean
  studyTargetDeliveryDate?: string
  studyTargetPublicReleaseDate?: string
  publicVisibilitySameAcrossAssets: boolean
  studyPublicVisibility?: boolean
}

export const getStudyInheritance = (study: Study): StudyInheritance => {
  const dates = getStudyTargetDates(study)
  return {
    populationSameAcrossAssets: isPopulationSameAcrossAssets(study),
    studyPopulation: getStudyDataBag(study).population,
    targetDatesSameAcrossAssets: isTargetDatesSameAcrossAssets(study),
    studyTargetDeliveryDate: dates.targetDeliveryDate,
    studyTargetPublicReleaseDate: dates.targetPublicReleaseDate,
    publicVisibilitySameAcrossAssets: isPublicVisibilitySameAcrossAssets(study),
    studyPublicVisibility: study?.publicVisibility,
  }
}

/**
 * What is missing from datasets that define their own population, target dates, or visibility. The
 * dataset form checks its own on save, but a dataset saved while the study still shared a value has
 * none of its own, so the datasets are checked again on submission. Shared study values are optional.
 */
export const submissionErrors = (study: Study): string[] => {
  const population = !isPopulationSameAcrossAssets(study)
  const dates = !isTargetDatesSameAcrossAssets(study)
  const visibility = !isPublicVisibilitySameAcrossAssets(study)
  return (study.assets?.consentGroups ?? []).flatMap((group) => {
    const missing: string[] = []
    if (population) missing.push(...missingPopulationFields(group.data?.population))
    if (dates && !group.data?.targetDeliveryDate) missing.push('Target Delivery Date')
    if (dates && !group.data?.targetPublicReleaseDate) missing.push('Target Public Release Date')
    if (visibility && typeof group.data?.publicVisibility !== 'boolean') missing.push('Public Visibility')
    return missing.length ? [`Dataset "${group.consentGroupName}" is missing: ${missing.join(', ')}`] : []
  })
}

/** Copies `values` onto each dataset's bag; a value that is undefined is left as the dataset had it. */
const inheritOnto = (groups: ConsentGroup2[], values: Partial<DatasetDataMetadata>): ConsentGroup2[] => {
  const defined = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
  if (Object.keys(defined).length === 0) {
    // Nothing to inherit; leave each dataset's bag exactly as it came, so drafts round trip unchanged.
    return groups
  }
  return groups.map(group => ({ ...group, data: { ...group.data, ...structuredClone(defined) } }))
}

/**
 * The study's `data` bag and consent groups as submitted, and any registration fields the
 * inheritance settings replace. A shared value is copied from the study onto every dataset,
 * replacing any it held. A value held per dataset is dropped at the study, so a stale hidden study
 * value can't be mistaken for one that applies; Consent's required study `publicVisibility` is then
 * true only if every dataset is visible, so no dataset is shown that its submitter marked hidden.
 */
const applyStudyInheritance = (study: Study): {
  data: StudyDataMetadata
  consentGroups: ConsentGroup2[]
  overrides: Partial<DatasetRegistrationSchemaV1>
} => {
  const data = structuredClone(getStudyDataBag(study))
  // Normalized at submission, not as typed, so a pasted https://doi.org/ URL doesn't jump while it's entered.
  if (data.doi) {
    data.doi = normalizeDoi(data.doi)
  }
  let consentGroups = structuredClone(study.assets?.consentGroups) || []
  const overrides: Partial<DatasetRegistrationSchemaV1> = {}

  if (isPopulationSameAcrossAssets(study)) {
    consentGroups = inheritOnto(consentGroups, { population: data.population })
  }
  else {
    delete data.population
  }

  if (isTargetDatesSameAcrossAssets(study)) {
    consentGroups = inheritOnto(consentGroups, getStudyTargetDates(study))
  }
  else {
    overrides.alternativeDataSharingPlanTargetDeliveryDate = undefined
    overrides.alternativeDataSharingPlanTargetPublicReleaseDate = undefined
  }

  if (isPublicVisibilitySameAcrossAssets(study)) {
    consentGroups = inheritOnto(consentGroups, { publicVisibility: study.publicVisibility })
  }
  else {
    overrides.publicVisibility = consentGroups.length > 0 && consentGroups.every(group => group.data?.publicVisibility === true)
  }

  return { data, consentGroups, overrides }
}

const convertDateEpochToString = (dateEpoch: unknown): string | undefined => {
  if (typeof dateEpoch === 'number') {
    return dayjs(dateEpoch).format('YYYY-MM-DD')
  }
  if (typeof dateEpoch === 'string') {
    return dateEpoch
  }
  return undefined
}

/** `false` is a value the producer gave, so it must not fall through to undefined. */
const getBooleanStudyPropertyValueByKey = (study: Study, key: string): boolean | undefined => {
  const value = getStudyPropertyValueByKey(study, key)
  return typeof value === 'boolean' ? value : undefined
}

export const studyToDatasetSchemaSubmission = (study: Study): DatasetRegistrationSchemaV1 => {
  const { data, consentGroups, overrides } = applyStudyInheritance(study)
  const datasetSchema: DatasetRegistrationSchemaV1 = {
    studyName: study.name || '',
    studyType: getStudyPropertyValueByKey(study, StudyTypeProperty.key) as string || undefined,
    studyDescription: study.description || '',
    dataTypes: study.dataTypes || [],
    phenotypeIndication: getStudyPropertyValueByKey(study, PhenotypeIndication.key) as string || undefined,
    species: getStudyPropertyValueByKey(study, Species.key) as string || undefined,
    piName: study.piName,
    piEmail: study.piEmail,
    dataCustodianEmail: getStudyPropertyValueByKey(study, DataCustodianEmail.key) as string[] || undefined,
    publicVisibility: study.publicVisibility || false,
    throughBioId: getStudyPropertyValueByKey(study, ThroughBioId.key) as string || undefined,
    nihAnvilUse: getStudyPropertyValueByKey(study, NihAnvilUse.key) as NiHAnvilUseValues || undefined,
    submittingToAnvil: getBooleanStudyPropertyValueByKey(study, SubmittingToAnvil.key),
    dbGaPPhsID: getStudyPropertyValueByKey(study, DbGaPPhsID.key) as string || undefined,
    dbGaPStudyRegistrationName: getStudyPropertyValueByKey(study, DbGaPStudyRegistrationName.key) as string || undefined,
    embargoReleaseDate: convertDateEpochToString(getStudyPropertyValueByKey(study, EmbargoReleaseDate.key) as string || undefined),
    sequencingCenter: getStudyPropertyValueByKey(study, SequencingCenter.key) as string || undefined,
    piInstitution: getStudyPropertyValueByKey(study, PiInstitution.key) as number || Storage.getCurrentUser().institutionId,
    nihGrantContractNumber: getStudyPropertyValueByKey(study, NihGrantContractNumber.key) as string || undefined,
    nihICsSupportingStudy: getStudyPropertyValueByKey(study, NihICsSupportingStudy.key) as Array<NIHInstituteAndCenterAbbreviations> || undefined,
    nihProgramOfficerName: getStudyPropertyValueByKey(study, NihProgramOfficerName.key) as string || undefined,
    nihInstitutionCenterSubmission: getStudyPropertyValueByKey(study, NihInstitutionCenterSubmission.key) as NIHInstituteAndCenterAbbreviations || undefined,
    nihGenomicProgramAdministratorName: getStudyPropertyValueByKey(study, NihGenomicProgramAdministratorName.key) as string || undefined,
    multiCenterStudy: getBooleanStudyPropertyValueByKey(study, MultiCenterStudy.key),
    collaboratingSites: getStudyPropertyValueByKey(study, CollaboratingSites.key) as string[] || undefined,
    controlledAccessRequiredForGenomicSummaryResultsGSR: getBooleanStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSR.key),
    controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation: getStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key) as string || undefined,
    alternativeDataSharingPlan: getBooleanStudyPropertyValueByKey(study, AlternativeDataSharingPlan.key),
    alternativeDataSharingPlanReasons: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as Array<DataSharingPlanReasons> || undefined,
    alternativeDataSharingPlanExplanation: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanExplanation.key) as string || undefined,
    alternativeDataSharingPlanDataSubmitted: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanDataSubmitted.key) as AlternativeDataSharingPlanDataSubmittedValues || undefined,
    alternativeDataSharingPlanDataReleased: getBooleanStudyPropertyValueByKey(study, AlternativeDataSharingPlanDataReleased.key),
    alternativeDataSharingPlanTargetDeliveryDate: convertDateEpochToString(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetDeliveryDate.key) as string || undefined),
    alternativeDataSharingPlanTargetPublicReleaseDate: convertDateEpochToString(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetPublicReleaseDate.key) as string || undefined),
    consentGroups,
    data,
  }
  const assets = structuredClone(study.assets)
  if (assets) {
    delete assets.consentGroups
    // Consent computes the data use summary when it reads an asset; it is never stored.
    for (const entry of [...(assets.models ?? []), ...(assets.workspaces ?? [])]) {
      delete (entry as { dataUseSummary?: unknown }).dataUseSummary
    }
  }
  datasetSchema.assets = assets
  return { ...datasetSchema, ...overrides }
}
/**
 * The inverse of {@link studyToDatasetSchemaSubmission}: a registration-shaped document becomes the
 * Study the form edits. A property is written only where the document carries a value — Consent
 * serializes with NON_NULL, so an empty field is absent, and writing one would submit a value the
 * producer never gave.
 */
export const datasetSchemaSubmissionToStudy = (schema: DatasetRegistrationSchemaV1): Study => {
  const properties: StudyProperty[] = []
  const addProperty = (key: string, type: StudyPropertyType, value: unknown) => {
    if (value !== undefined && value !== null) {
      properties.push(new StudyProperty(key, type, value))
    }
  }

  addProperty(StudyTypeProperty.key, 'String', schema.studyType)
  addProperty(PhenotypeIndication.key, 'String', schema.phenotypeIndication)
  addProperty(Species.key, 'String', schema.species)
  addProperty(DataCustodianEmail.key, 'Json', schema.dataCustodianEmail)
  addProperty(ThroughBioId.key, 'String', schema.throughBioId)
  addProperty(NihAnvilUse.key, 'String', schema.nihAnvilUse)
  addProperty(SubmittingToAnvil.key, 'Boolean', schema.submittingToAnvil)
  addProperty(DbGaPPhsID.key, 'String', schema.dbGaPPhsID)
  addProperty(DbGaPStudyRegistrationName.key, 'String', schema.dbGaPStudyRegistrationName)
  addProperty(EmbargoReleaseDate.key, 'Date', schema.embargoReleaseDate)
  addProperty(SequencingCenter.key, 'String', schema.sequencingCenter)
  addProperty(PiInstitution.key, 'Number', schema.piInstitution)
  addProperty(NihGrantContractNumber.key, 'String', schema.nihGrantContractNumber)
  addProperty(NihICsSupportingStudy.key, 'Json', schema.nihICsSupportingStudy)
  addProperty(NihProgramOfficerName.key, 'String', schema.nihProgramOfficerName)
  addProperty(NihInstitutionCenterSubmission.key, 'String', schema.nihInstitutionCenterSubmission)
  addProperty(NihGenomicProgramAdministratorName.key, 'String', schema.nihGenomicProgramAdministratorName)
  addProperty(MultiCenterStudy.key, 'Boolean', schema.multiCenterStudy)
  addProperty(CollaboratingSites.key, 'Json', schema.collaboratingSites)
  addProperty(ControlledAccessRequiredForGenomicSummaryResultsGSR.key, 'Boolean', schema.controlledAccessRequiredForGenomicSummaryResultsGSR)
  addProperty(ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key, 'String', schema.controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation)
  addProperty(AlternativeDataSharingPlan.key, 'Boolean', schema.alternativeDataSharingPlan)
  addProperty(AlternativeDataSharingPlanReasons.key, 'Json', schema.alternativeDataSharingPlanReasons)
  addProperty(AlternativeDataSharingPlanExplanation.key, 'String', schema.alternativeDataSharingPlanExplanation)
  addProperty(AlternativeDataSharingPlanDataSubmitted.key, 'String', schema.alternativeDataSharingPlanDataSubmitted)
  addProperty(AlternativeDataSharingPlanDataReleased.key, 'Boolean', schema.alternativeDataSharingPlanDataReleased)
  addProperty(AlternativeDataSharingPlanTargetDeliveryDate.key, 'Date', schema.alternativeDataSharingPlanTargetDeliveryDate)
  addProperty(AlternativeDataSharingPlanTargetPublicReleaseDate.key, 'Date', schema.alternativeDataSharingPlanTargetPublicReleaseDate)

  const otherAssets = structuredClone(schema.assets ?? {}) as Record<string, unknown>
  delete otherAssets.consentGroups

  const study = {
    name: schema.studyName,
    description: schema.studyDescription,
    dataTypes: schema.dataTypes,
    publicVisibility: schema.publicVisibility,
    properties,
    assets: { ...otherAssets, consentGroups: structuredClone(schema.consentGroups ?? []) },
    data: schema.data ?? {},
  } as Study

  if (schema.piName !== undefined) {
    study.piName = schema.piName
  }
  if (schema.piEmail !== undefined) {
    study.piEmail = schema.piEmail
  }
  return study
}

const getDatasetPropertyValueByKey = <T = unknown>(key: string, dataset: Dataset): T | undefined => {
  if (dataset.properties && Array.isArray(dataset.properties)) {
    const result = dataset.properties.find(entry => entry.propertyName === key)
    return result ? (result.propertyValue as T) : undefined
  }
  return undefined
}

/** Rebuilds a persisted study's consent groups from its datasets, one group per dataset. */
export const buildConsentGroupsFromDatasets = (datasets: Dataset[]): ConsentGroup2[] => {
  const consentGroups: ConsentGroup2[] = []
  datasets.forEach((dataset) => {
    const consentGroup = {} as ConsentGroup2
    // see consent's ConsentGroupFromDataset.java -> build for an example of how to do this in Java.
    consentGroup.datasetId = dataset.datasetId
    consentGroup.consentGroupName = dataset.name || ''
    consentGroup.accessManagement = getDatasetPropertyValueByKey(AccessManagement.propertyName, dataset) as AccessManagementType
    consentGroup.col = dataset.dataUse.collaboratorRequired
    consentGroup.generalResearchUse = dataset.dataUse.generalUse
    consentGroup.hmb = dataset.dataUse.hmbResearch
    // An empty array would light the Disease-Specific radio; only a populated one is a primary.
    consentGroup.diseaseSpecificUse = isEmpty(dataset.dataUse.diseaseRestrictions) ? undefined : dataset.dataUse.diseaseRestrictions
    consentGroup.poa = dataset.dataUse.populationOriginsAncestry
    if (isEmpty(dataset.dataUse.other)) {
      consentGroup.otherPrimary = undefined
    }
    else {
      consentGroup.otherPrimary = dataset.dataUse.other
    }
    consentGroup.nmds = dataset.dataUse.methodsResearch === false
    consentGroup.gso = dataset.dataUse.geneticStudiesOnly
    consentGroup.pub = dataset.dataUse.publicationResults
    consentGroup.col = dataset.dataUse.collaboratorRequired
    consentGroup.irb = dataset.dataUse.ethicsApprovalRequired
    if (isEmpty(dataset.dataUse.geographicalRestrictions)) {
      consentGroup.gs = undefined
    }
    else {
      consentGroup.gs = dataset.dataUse.geographicalRestrictions
    }

    consentGroup.mor = !isEmpty(dataset.dataUse.publicationMoratorium)
    if (isEmpty(dataset.dataUse.publicationMoratorium)) {
      consentGroup.morDate = undefined
    }
    else {
      consentGroup.morDate = dataset.dataUse.publicationMoratorium
    }
    consentGroup.npu = dataset.dataUse.nonProfitUse
    if (isEmpty(dataset.dataUse.secondaryOther)) {
      consentGroup.otherSecondary = undefined
    }
    else {
      consentGroup.otherSecondary = dataset.dataUse.secondaryOther
    }
    consentGroup.dataAccessCommitteeId = dataset.dacId
    consentGroup.nihInstitutionalCertificationFile = dataset.nihInstitutionalCertificationFile
    consentGroup.dataLocation = getDatasetPropertyValueByKey(DataLocation.propertyName, dataset) as DataLocationType
    consentGroup.url = getDatasetPropertyValueByKey(DataURL.propertyName, dataset) as string
    consentGroup.requestLocation = getDatasetPropertyValueByKey(RequestLocation.propertyName, dataset) as string
    consentGroup.fileTypes = fileTypeAdjustment(getDatasetPropertyValueByKey(FileTypes.propertyName, dataset) as Array<FileType>)
    consentGroup.numberOfParticipants = getDatasetPropertyValueByKey(NumberOfParticipants.propertyName, dataset) as number || 0
    consentGroup.data = getDatasetPropertyValueByKey<DatasetDataMetadata>(DatasetData.propertyName, dataset)
    consentGroups.push(consentGroup)
  })
  return consentGroups
}

const fileTypeAdjustment = (fileTypes: Array<FileType>) => {
  if (isEmpty(fileTypes)) {
    return [] as FileType[]
  }
  const adjustedFileTypes: Array<FileType> = []
  fileTypes.forEach((fileType) => {
    const adjustedFileType: FileType = {
      fileType: toTitleCase(fileType.fileType) as unknown as FileType['fileType'],
    }
    adjustedFileTypes.push(adjustedFileType)
  })
  return adjustedFileTypes
}

const toTitleCase = (str: string): string => {
  if (!str) {
    return ''
  }

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) {
        return ''
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// Extracts the Through.Bio ID from a URL or returns the input if not a URL.
// Returns an empty string if the URL is not from through.bio.
export const extractThroughBioId = (input: string): string => {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'through.bio') {
      return url.pathname.slice(1)
    }
    // Any other URL: return ''
    return ''
  }
  catch {
    // Not a URL: return non-empty string, else ''
    return trimmed === '' ? '' : trimmed
  }
}
