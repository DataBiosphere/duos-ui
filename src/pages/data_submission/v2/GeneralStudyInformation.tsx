import React from 'react'
import { FormFieldTypes, FormField, FormValidators } from 'src/components/forms/forms'
import {
  Study,
  StudyType,
  PhenotypeIndication,
  Species,
  DataCustodianEmail,
  AlternativeDataSharingPlanTargetDeliveryDate,
  AlternativeDataSharingPlanTargetPublicReleaseDate,
} from 'src/pages/data_submission/v2/v2-models'
import { getStudyPropertyByKey, setStudyPropertyByKey } from 'src/pages/data_submission/v2/v2-common-functions'

export interface GeneralStudyInformationProps {
  formData: Study
  onChange: ({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => void
}

export const GeneralStudyInformation = (props: GeneralStudyInformationProps) => {
  const {
    onChange,
    formData,
  } = props

  return (
    <div className="data-submitter-section">
      <h2>Study Information</h2>
      <FormField
        id="studyName"
        title="Study Name"
        validators={[FormValidators.REQUIRED]}
        onChange={onChange}
        defaultValue={formData?.name}
      />
      <FormField
        id="studyType"
        title="Study Type"
        type={FormFieldTypes.SELECT}
        selectOptions={[
          'Observational', 'Interventional', 'Descriptive',
          'Analytical', 'Prospective', 'Retrospective',
          'Case report', 'Case series', 'Cross-sectional',
          'Cohort study',
        ]}
        isCreatable={true}
        validators={[FormValidators.REQUIRED]}
        selectConfig={{}}
        defaultValue={getStudyPropertyByKey(formData, 'studyType')}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new StudyType(input.value as string)) }}
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
        selectOptions={[
          // The top properties were extracted from the prod database and deduplicated using the query:
          // SELECT property_value, COUNT(*) FROM dataset_property WHERE property_key = 2 GROUP BY property_value ORDER BY COUNT(*) DESC;
          'CITE-seq',
          'Hybrid Capture',
          'RNA-Seq',
          'scRNA-Seq',
          'Spatial Transcriptomics',
          'snRNA-Seq',
          'Whole Genome (WGS)',
          'Whole Exome (WES)',
        ]}
        defaultValue={formData?.dataTypes}
        onChange={onChange}
      />
      <FormField
        id="phenotypeIndication"
        title="Phenotype/Indication Studied"
        defaultValue={getStudyPropertyByKey(formData, 'phenotypeIndication')}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new PhenotypeIndication(input.value as string)) }}
      />
      <FormField
        id="species"
        title="Species"
        defaultValue={getStudyPropertyByKey(formData, 'species')}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new Species(input.value as string)) }}
      />
      <FormField
        id="piName"
        title="Principal Investigator Name"
        defaultValue={formData?.piName}
        validators={[FormValidators.REQUIRED]}
        onChange={onChange}
      />
      <FormField
        id="dataCustodianEmail"
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
        defaultValue={getStudyPropertyByKey(formData, 'dataCustodianEmail')}
        onChange={(input: { key: string[], value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new DataCustodianEmail(input.value as string[])) }}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <FormField
          id="alternativeDataSharingPlanTargetDeliveryDate"
          style={{ width: '45%' }}
          title="Target Delivery Date"
          placeholder="Please enter date (YYYY-MM-DD)"
          defaultValue={getStudyPropertyByKey(formData, 'alternativeDataSharingPlanTargetDeliveryDate')}
          validators={[FormValidators.DATE]}
          onChange={(input: { key: Date, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new AlternativeDataSharingPlanTargetDeliveryDate(input.value as Date)) }}
        />
        <FormField
          id="alternativeDataSharingPlanTargetPublicReleaseDate"
          style={{ width: '45%' }}
          title="Target Public Release Date"
          placeholder="Please enter date (YYYY-MM-DD)"
          defaultValue={getStudyPropertyByKey(formData, 'alternativeDataSharingPlanTargetPublicReleaseDate')}
          validators={[FormValidators.DATE]}
          onChange={(input: { key: Date, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new AlternativeDataSharingPlanTargetPublicReleaseDate(input.value as Date)) }}
        />
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
