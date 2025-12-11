import React from 'react'
import {
  Study,
  StudyProperty,
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
  FileTypes,
  NumberOfParticipants } from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { set, isEmpty } from 'lodash'
import { Storage } from 'src/libs/storage'
import { NIHInstituteAndCenterAbbreviations } from 'src/components/forms/NIHInstitutesAndCenters'
import { AccessManagementType, ConsentGroup2, FileType } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { Dataset } from 'src/types/model'
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

export const generateStudyPropertyFormTextField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: StringStudyProperty, validators: Array<unknown> = []) => {
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

export const generateStudyInputFormTextField = (setStudy: React.Dispatch<React.SetStateAction<Study>>, id: string, initialValue: string | undefined, title: string, placeholder: string, validators: Array<unknown> = [], readOnly: boolean = false) => {
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

export const generateStudyPropertyFormDateField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: DateStudyProperty, validators: Array<unknown> = [], style: unknown = {}) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      style={style}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as Date
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

export const studyToDatasetSchemaSubmission = (study: Study): DatasetRegistrationSchemaV1 => {
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
    nihAnvilUse: getStudyPropertyValueByKey(study, NihAnvilUse.key) as NiHAnvilUseValues || undefined,
    submittingToAnvil: getStudyPropertyValueByKey(study, SubmittingToAnvil.key) as boolean || undefined,
    dbGaPPhsID: getStudyPropertyValueByKey(study, DbGaPPhsID.key) as string || undefined,
    dbGaPStudyRegistrationName: getStudyPropertyValueByKey(study, DbGaPStudyRegistrationName.key) as string || undefined,
    embargoReleaseDate: getStudyPropertyValueByKey(study, EmbargoReleaseDate.key) as string || undefined,
    sequencingCenter: getStudyPropertyValueByKey(study, SequencingCenter.key) as string || undefined,
    piInstitution: getStudyPropertyValueByKey(study, PiInstitution.key) as number || Storage.getCurrentUser().institutionId,
    nihGrantContractNumber: getStudyPropertyValueByKey(study, NihGrantContractNumber.key) as string || undefined,
    nihICsSupportingStudy: getStudyPropertyValueByKey(study, NihICsSupportingStudy.key) as Array<NIHInstituteAndCenterAbbreviations> || undefined,
    nihProgramOfficerName: getStudyPropertyValueByKey(study, NihProgramOfficerName.key) as string || undefined,
    nihInstitutionCenterSubmission: getStudyPropertyValueByKey(study, NihInstitutionCenterSubmission.key) as NIHInstituteAndCenterAbbreviations || undefined,
    nihGenomicProgramAdministratorName: getStudyPropertyValueByKey(study, NihGenomicProgramAdministratorName.key) as string || undefined,
    multiCenterStudy: getStudyPropertyValueByKey(study, MultiCenterStudy.key) as boolean || undefined,
    collaboratingSites: getStudyPropertyValueByKey(study, CollaboratingSites.key) as string[] || undefined,
    controlledAccessRequiredForGenomicSummaryResultsGSR: getStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSR.key) as boolean || undefined,
    controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation: getStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key) as string || undefined,
    alternativeDataSharingPlan: getStudyPropertyValueByKey(study, AlternativeDataSharingPlan.key) as boolean || undefined,
    alternativeDataSharingPlanReasons: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as Array<DataSharingPlanReasons> || undefined,
    alternativeDataSharingPlanExplanation: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanExplanation.key) as string || undefined,
    alternativeDataSharingPlanDataSubmitted: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanDataSubmitted.key) as AlternativeDataSharingPlanDataSubmittedValues || undefined,
    alternativeDataSharingPlanDataReleased: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanDataReleased.key) as boolean || undefined,
    alternativeDataSharingPlanTargetDeliveryDate: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetDeliveryDate.key) as string || undefined,
    alternativeDataSharingPlanTargetPublicReleaseDate: getStudyPropertyValueByKey(study, AlternativeDataSharingPlanTargetPublicReleaseDate.key) as string || undefined,
    consentGroups: structuredClone(study.assets?.consentGroups) || [],
  }
  const assets = structuredClone(study.assets)
  if (assets) {
    delete assets.consentGroups
  }
  datasetSchema.assets = assets
  return datasetSchema
}
const getDatasetPropertyValueByKey = <T = unknown>(key: string, dataset: Dataset): T | undefined => {
  if (dataset.properties && Array.isArray(dataset.properties)) {
    const result = dataset.properties.find(entry => entry.propertyName === key)
    return result ? (result.propertyValue as T) : undefined
  }
  return undefined
}

export const buildConsentGroupsFromStudy = (study: Study): ConsentGroup2[] => {
  const consentGroups: ConsentGroup2[] = []
  const studyDatasets = study.datasets || []
  studyDatasets.forEach((dataset) => {
    const consentGroup = {} as ConsentGroup2
    // see consent's ConsentGroupFromDataset.java -> build for an example of how to do this in Java.
    consentGroup.datasetId = dataset.datasetId
    consentGroup.consentGroupName = dataset.name || ''
    consentGroup.accessManagement = getDatasetPropertyValueByKey(AccessManagement.propertyName, dataset) as AccessManagementType
    consentGroup.col = dataset.dataUse.collaboratorRequired
    consentGroup.generalResearchUse = dataset.dataUse.generalUse
    consentGroup.hmb = dataset.dataUse.hmbResearch
    consentGroup.diseaseSpecificUse = dataset.dataUse.diseaseRestrictions
    consentGroup.poa = dataset.dataUse.populationOriginsAncestry
    consentGroup.otherPrimary = dataset.dataUse.other
    consentGroup.nmds = dataset.dataUse.methodsResearch === false
    consentGroup.gso = dataset.dataUse.geneticStudiesOnly
    consentGroup.pub = dataset.dataUse.publicationResults
    consentGroup.col = dataset.dataUse.collaboratorRequired
    consentGroup.irb = dataset.dataUse.ethicsApprovalRequired
    consentGroup.gs = dataset.dataUse.geographicalRestrictions
    consentGroup.mor = !isEmpty(dataset.dataUse.publicationMoratorium)
    consentGroup.morDate = dataset.dataUse.publicationMoratorium
    consentGroup.npu = dataset.dataUse.nonProfitUse
    consentGroup.otherSecondary = dataset.dataUse.secondaryOther
    consentGroup.dataAccessCommitteeId = dataset.dacId
    consentGroup.dataLocation = getDatasetPropertyValueByKey(DataLocation.propertyName, dataset) as DataLocationType
    consentGroup.url = getDatasetPropertyValueByKey(DataURL.propertyName, dataset) as string
    consentGroup.fileTypes = fileTypeAdjustment(getDatasetPropertyValueByKey(FileTypes.propertyName, dataset) as Array<FileType>)
    consentGroup.numberOfParticipants = getDatasetPropertyValueByKey(NumberOfParticipants.propertyName, dataset) as number || 0
    consentGroups.push(consentGroup)
  })
  return consentGroups
}

const fileTypeAdjustment = (fileTypes: Array<FileType>) => {
  if (!fileTypes) {
    return [] as FileType[]
  }
  const adjustedFileTypes: Array<FileType> = []
  fileTypes.forEach((fileType) => {
    const adjustedFileType: FileType = {
      fileType: toTitleCase(fileType.fileType) as unknown as FileType['fileType'],
      functionalEquivalence: fileType.functionalEquivalence,
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
