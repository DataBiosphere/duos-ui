import React from 'react'
import { FormFieldTypes, FormField, FormValidators } from 'src/components/forms/forms'
import {
  Study,
  StudyTypeProperty,
  PhenotypeIndication,
  Species,
  DataCustodianEmail,
  AlternativeDataSharingPlanTargetDeliveryDate,
  AlternativeDataSharingPlanTargetPublicReleaseDate,
  StudyData,
} from 'src/pages/data_submission/v2/v2-models'
import {
  generateStudyInputFormTextField,
  generateStudyPropertyFormDateField,
  generateStudyPropertyFormTextField,
  getStudyPropertyValueByKey,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { DataTypes } from 'src/components/forms/DataTypes'
import { set } from 'lodash'

export interface GeneralStudyInformationProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export const GeneralStudyInformation = (props: GeneralStudyInformationProps) => {
  const {
    setStudy,
    study,
  } = props

  const onChange = ({ key, value }: { key: string, value: unknown, isValid: boolean }) => {
    setStudy((val: Study) => {
      const newForm = structuredClone(val)
      return set(newForm, key, value)
    })
  }

  return (
    <div className="data-submitter-section">
      <h2>Study Information</h2>
      {generateStudyInputFormTextField(setStudy, 'name', study?.name, 'Study Name', 'Enter the study name', [FormValidators.REQUIRED])}
      <FormField
        id={StudyTypeProperty.key}
        title={StudyTypeProperty.fieldTitle}
        placeholder={StudyTypeProperty.fieldPlaceholderText}
        type={FormFieldTypes.SELECT}
        selectOptions={StudyTypeProperty.STUDY_TYPE_OPTIONS}
        isCreatable={true}
        selectConfig={{}}
        defaultValue={getStudyPropertyValueByKey(study, 'studyType')}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(study, setStudy, input, new StudyTypeProperty(input.value as string))
        }}
      />
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
        id="tags"
        title="Tags"
        placeholder="Add tags to help others find your study (e.g. disease area, assay type, etc.)"
        type={FormFieldTypes.SELECT}
        isCreatable={true}
        isMulti={true}
        optionsAreString={true}
        defaultValue={(getStudyPropertyValueByKey(study, 'data') as Record<string, unknown> | undefined)?.tags || []}
        selectOptions={study.data?.tags || []}
        onChange={(input: { key: string[], value: unknown, isValid: boolean }) => {
          const tags = input.value as string[]
          setStudyPropertyByKey(study, setStudy, input, new StudyData({ ...getStudyPropertyValueByKey(study, 'data') as Record<string, unknown>, tags } as Record<string, unknown>))
        }}
        selectConfig={{
          components: {
            DropdownIndicator: null,
            Menu: () => null,
          },
        }}
      />
      <FormField
        id="dataTypes"
        title="Data Types"
        placeholder="Select or enter data types"
        validators={[FormValidators.REQUIRED]}
        type={FormFieldTypes.SELECT}
        isCreatable={true}
        isMulti={true}
        optionsAreString={true}
        selectOptions={DataTypes.VALUES.map(entry => (`${entry.name}` + (entry.abbreviation ? ` (${entry.abbreviation})` : '')))}
        defaultValue={study?.dataTypes}
        onChange={onChange}
      />
      {generateStudyPropertyFormTextField(study, setStudy, new PhenotypeIndication())}
      {generateStudyPropertyFormTextField(study, setStudy, new Species())}
      {generateStudyInputFormTextField(setStudy, 'piName', study?.piName, 'Principal Investigator Name', 'Enter the Principal Investigator\'s name', [FormValidators.REQUIRED])}
      {generateStudyInputFormTextField(setStudy, 'piEmail', study?.piEmail, 'Principal Investigator Email Address', 'Enter the Principal Investigator\'s email address', [FormValidators.EMAIL])}
      <FormField
        id={DataCustodianEmail.key}
        title="Data Custodian Email"
        description="Insert the email for any individual with the authority to add/remove users access to this study&apos;s datasets."
        type={FormFieldTypes.SELECT}
        validators={[FormValidators.EMAIL]}
        selectOptions={[]}
        isCreatable={true}
        isMulti={true}
        optionsAreString={true}
        selectConfig={{
          components: {
            DropdownIndicator: null,
            Menu: () => null,
          },
        }}
        placeholder="Add one or more emails"
        defaultValue={getStudyPropertyValueByKey(study, 'dataCustodianEmail')}
        onChange={(input: { key: string[], value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(study, setStudy, input, new DataCustodianEmail(input.value as string[]))
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        {generateStudyPropertyFormDateField(study, setStudy, new AlternativeDataSharingPlanTargetDeliveryDate(), [FormValidators.DATE], { width: '45%' })}
        {generateStudyPropertyFormDateField(study, setStudy, new AlternativeDataSharingPlanTargetPublicReleaseDate(), [FormValidators.DATE], { width: '45%' })}
      </div>
      <FormField
        id="publicVisibility"
        title="Public Visibility"
        validators={[FormValidators.REQUIRED]}
        type={FormFieldTypes.RADIOGROUP}
        description="Please select one of the following data use permissions for your dataset"
        name="publicVisibility"
        options={[
          { name: true, text: 'Yes, I want my dataset info to be visible and available for requests' },
          { name: false, text: 'No, I do not want my dataset info to be visible and available for requests' },
        ]}
        defaultValue={study?.publicVisibility}
        onChange={onChange}
      />
    </div>
  )
}
