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
} from 'src/pages/data_submission/v2/v2-models'
import {
  generateStudyInputFormTextField,
  generateStudyPropertyFormDateField,
  generateStudyPropertyFormTextField,
  getStudyPropertyValueByKey,
  MasterChangeHandler,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { DataTypes } from 'src/components/forms/DataTypes'

export interface GeneralStudyInformationProps {
  formData: Study
  onChange: MasterChangeHandler
}

export const GeneralStudyInformation = (props: GeneralStudyInformationProps) => {
  const {
    onChange,
    formData,
  } = props

  return (
    <div className="data-submitter-section">
      <h2>Study Information</h2>
      {generateStudyInputFormTextField(onChange, 'studyName', formData?.name, 'Study Name', 'Enter the study name', [FormValidators.REQUIRED])}
      <FormField
        id={StudyTypeProperty.key}
        title={StudyTypeProperty.fieldTitle}
        placeholder={StudyTypeProperty.fieldPlaceholderText}
        type={FormFieldTypes.SELECT}
        selectOptions={StudyTypeProperty.STUDY_TYPE_OPTIONS}
        isCreatable={true}
        validators={[FormValidators.REQUIRED]}
        selectConfig={{}}
        defaultValue={getStudyPropertyValueByKey(formData, 'studyType')}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new StudyTypeProperty(input.value as string))
        }}
      />
      <FormField
        type={FormFieldTypes.TEXTAREA}
        rows={6}
        id="studyDescription"
        title="Study Description"
        placeholder="Description"
        defaultValue={formData?.description}
        validators={[FormValidators.REQUIRED]}
        onChange={onChange}
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
        defaultValue={formData?.dataTypes}
        onChange={onChange}
      />
      {generateStudyPropertyFormTextField(formData, onChange, new PhenotypeIndication())}
      {generateStudyPropertyFormTextField(formData, onChange, new Species())}
      {generateStudyInputFormTextField(onChange, 'piName', formData?.piName, 'Principal Investigator Name', 'Enter the Principal Investigator\'s name', [FormValidators.REQUIRED])}
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
        defaultValue={getStudyPropertyValueByKey(formData, 'dataCustodianEmail')}
        onChange={(input: { key: string[], value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new DataCustodianEmail(input.value as string[]))
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        {generateStudyPropertyFormDateField(formData, onChange, new AlternativeDataSharingPlanTargetDeliveryDate(), [FormValidators.DATE], { width: '45%' })}
        {generateStudyPropertyFormDateField(formData, onChange, new AlternativeDataSharingPlanTargetPublicReleaseDate(), [FormValidators.DATE], { width: '45%' })}
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
        defaultValue={formData?.publicVisibility}
        onChange={onChange}
      />
    </div>
  )
}
