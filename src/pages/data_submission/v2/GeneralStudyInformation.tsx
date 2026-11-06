import React from 'react'
import { FormFieldTypes, FormField, FormValidators } from 'src/components/forms/forms'
import {
  Study,
  StudyTypeProperty,
} from 'src/pages/data_submission/v2/v2-models'
import { StudyDataKeys, StudyDataMetadata } from 'src/libs/data-metadata'
import {
  generateStudyInputFormTextField,
  getStudyDataBag,
  getStudyPropertyValueByKey,
  setStudyPropertyByKey,
  updateStudyData,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { StudyPopulation } from 'src/pages/data_submission/v2/StudyPopulation'
import { StudyReleaseSettings } from 'src/pages/data_submission/v2/StudyReleaseSettings'
import { ThroughBioProfile } from 'src/pages/data_submission/v2/ThroughBioProfile'
import { PrincipalInvestigators } from 'src/pages/data_submission/v2/PrincipalInvestigators'
import { DataCustodians } from 'src/pages/data_submission/v2/DataCustodians'
import { DataTypes } from 'src/components/forms/DataTypes'
import { TAGS_ENTRY_GUIDANCE } from 'src/components/forms/formGuidance'
import { set } from 'src/utils/NodashUtil'

export interface GeneralStudyInformationProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
  /** Opens a request for a Through.bio profile; absent, the request option is not offered. */
  onRequestThroughBioProfile?: () => void
}

/** Suggestions only: both selects are creatable. */
const DATA_COLLECTION_METHOD_OPTIONS = [
  'Survey / Questionnaire', 'Interview', 'Clinical Assessment / Exam', 'Electronic Health Records',
  'Claims / Administrative Data', 'Registry', 'Biospecimen Collection', 'Genomic Sequencing', 'Imaging',
  'Laboratory Assay', 'Wearable / Sensor', 'Observational', 'Experimental / Interventional',
]
const DATA_COLLECTION_MODALITY_OPTIONS = [
  'In-person', 'Remote / Online', 'Telephone', 'Mail', 'Mobile App', 'Passive (device / sensor)', 'Mixed',
]

export const GeneralStudyInformation = (props: GeneralStudyInformationProps) => {
  const { setStudy, study, onRequestThroughBioProfile } = props

  // Unified source: prefer in-progress edit from properties[], fall back to API-loaded study.data.
  const currentDataBag: StudyDataMetadata = getStudyDataBag(study)
  const onChange = ({ key, value }: { key: string, value: unknown, isValid: boolean }) => {
    setStudy((val: Study) => {
      const newForm = structuredClone(val)
      return set(newForm, key, value)
    })
  }

  return (
    <div className="data-submitter-section">
      <h2>Study Information</h2>
      <div className="dsf-group" data-cy="study-details">
        <h3>Study Details</h3>
        {generateStudyInputFormTextField(setStudy, 'name', study?.name, 'Study Name', 'Enter the study name', [FormValidators.REQUIRED])}
        <FormField
          id={StudyTypeProperty.key}
          title={StudyTypeProperty.fieldTitle}
          type={FormFieldTypes.BUTTONGROUP}
          allowCustom={true}
          options={StudyTypeProperty.STUDY_TYPE_OPTIONS}
          defaultValue={getStudyPropertyValueByKey(study, 'studyType')}
          onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
            setStudyPropertyByKey(study, setStudy, input, new StudyTypeProperty(input.value as string))
          }}
        />
        <FormField
          id={StudyDataKeys.DATA_COLLECTION_METHOD}
          title="Data Collection Method"
          description="How the data was gathered"
          type={FormFieldTypes.BUTTONGROUP}
          allowCustom={true}
          isMulti={true}
          options={DATA_COLLECTION_METHOD_OPTIONS}
          defaultValue={currentDataBag.dataCollectionMethod ?? []}
          onChange={({ value }: { value: string[] }) => {
            updateStudyData(setStudy, { [StudyDataKeys.DATA_COLLECTION_METHOD]: value?.length ? value : undefined })
          }}
        />
        <FormField
          id={StudyDataKeys.DATA_COLLECTION_MODALITY}
          title="Data Collection Modality"
          description="The mode the data was gathered in"
          type={FormFieldTypes.BUTTONGROUP}
          allowCustom={true}
          isMulti={true}
          options={DATA_COLLECTION_MODALITY_OPTIONS}
          defaultValue={currentDataBag.dataCollectionModality ?? []}
          onChange={({ value }: { value: string[] }) => {
            updateStudyData(setStudy, { [StudyDataKeys.DATA_COLLECTION_MODALITY]: value?.length ? value : undefined })
          }}
        />
        <FormField
          id="dataTypes"
          title="Data Types"
          validators={[FormValidators.REQUIRED]}
          type={FormFieldTypes.BUTTONGROUP}
          allowCustom={true}
          isMulti={true}
          options={DataTypes.VALUES.map(entry => (`${entry.name}` + (entry.abbreviation ? ` (${entry.abbreviation})` : '')))}
          defaultValue={study?.dataTypes}
          onChange={onChange}
        />
      </div>
      <div className="dsf-group" data-cy="study-description">
        <h3>Description &amp; Context</h3>
        <FormField
          type={FormFieldTypes.TEXTAREA}
          rows={6}
          id="description"
          title="Study Description"
          placeholder="Description"
          defaultValue={study?.description}
          validators={[FormValidators.REQUIRED]}
          onChange={onChange}
        />
        <FormField
          type={FormFieldTypes.TEXTAREA}
          rows={4}
          id={StudyDataKeys.DATA_COLLECTION_CONTEXT}
          title="Data Collection Context"
          description="Describe how the data was collected, and any biases or nuances (e.g. recruitment setting, selection criteria, known gaps) a requester should understand."
          placeholder="Data collection context"
          defaultValue={currentDataBag.dataCollectionContext}
          onChange={({ value }: { value: string }) => {
            updateStudyData(setStudy, { [StudyDataKeys.DATA_COLLECTION_CONTEXT]: value || undefined })
          }}
        />
        <FormField
          id={StudyDataKeys.DOI}
          title="Study DOI"
          description="Digital Object Identifier for the study as a whole"
          placeholder="e.g. 10.1000/xyz123"
          validators={[FormValidators.DOI]}
          defaultValue={currentDataBag.doi}
          onChange={({ value, isValid }: { value: string, isValid: boolean }) => {
            if (!isValid) return
            updateStudyData(setStudy, { [StudyDataKeys.DOI]: value || undefined })
          }}
        />
        <FormField
          id={StudyDataKeys.TAGS}
          title="Study Tags"
          description={TAGS_ENTRY_GUIDANCE}
          placeholder="Add tags to help others find your study (e.g. disease area, assay type, etc.)"
          type={FormFieldTypes.SELECT}
          isCreatable={true}
          isMulti={true}
          optionsAreString={true}
          defaultValue={currentDataBag?.tags || []}
          selectOptions={currentDataBag?.tags || []}
          onChange={(input: { key: string[], value: unknown, isValid: boolean }) => {
            if (!input.isValid) return
            updateStudyData(setStudy, { [StudyDataKeys.TAGS]: input.value as string[] })
          }}
          selectConfig={{
            components: {
              DropdownIndicator: null,
              Menu: () => null,
            },
          }}
        />
      </div>
      <PrincipalInvestigators study={study} setStudy={setStudy} />
      <DataCustodians study={study} setStudy={setStudy} />
      <StudyReleaseSettings study={study} setStudy={setStudy} />
      <ThroughBioProfile study={study} setStudy={setStudy} onRequestProfile={onRequestThroughBioProfile} />
      <StudyPopulation study={study} setStudy={setStudy} />
    </div>
  )
}
