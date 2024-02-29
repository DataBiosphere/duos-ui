import React from 'react';
import { useState, useEffect } from 'react';
import { isEmpty } from 'lodash/fp';

import { Notifications } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormValidators } from '../../components/forms/forms';
import initialFormData from './NIHDataManagement';

import './ds_common.css';

export default function DataSubmissionStudyInformation(props) {
  const {
    onChange,
    validation,
    onValidationChange,
    formData,
    studyEditMode,
  } = props;
  const [user, setUser] = useState();

  //init hook, need to make ajax calls here
  useEffect(() => {
    const updateUserAndFields = async () => {
      const me = await User.getMe();
      setUser(me);
      onChange({key: 'dataSubmitterUserId', value: me.userId, isValid: true});
    };

    const init = async () => {
      try {
        updateUserAndFields();
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, [onChange]);

  return (
    <div className="data-submitter-section">
      <h2>Study Information</h2>
      <FormField
        id="studyName"
        title="Study Name"
        validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
        validation={validation.studyName}
        onChange={onChange}
        onValidationChange={onValidationChange}
        defaultValue={studyEditMode ? formData?.studyName : undefined}
        disabled={studyEditMode}
      />
      <FormField
        id="studyType"
        title="Study Type"
        type={FormFieldTypes.SELECT}
        selectOptions={[
          'Observational', 'Interventional', 'Descriptive',
          'Analytical', 'Prospective', 'Retrospective',
          'Case report', 'Case series', 'Cross-sectional',
          'Cohort study'
        ]}
        isCreatable={true}
        validation={validation.studyType}
        selectConfig={{}}
        defaultValue={studyEditMode ? formData?.studyType : undefined}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <FormField
        type={FormFieldTypes.TEXTAREA}
        rows={6}
        id="studyDescription"
        title="Study Description"
        placeholder="Description"
        defaultValue={studyEditMode ? formData?.studyDescription : undefined}
        validators={[FormValidators.REQUIRED]}
        validation={validation.studyDescription}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <FormField
        id="dataTypes"
        title="Data Types"
        placeholder="Type"
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
        defaultValue={studyEditMode ? formData?.dataTypes : undefined}
        validation={validation.dataTypes}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <FormField
        id="phenotypeIndication"
        title="Phenotype/Indication Studied"
        defaultValue={studyEditMode ? formData?.phenotypeIndication : undefined}
        validation={validation.phenotypeIndication}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <FormField
        id="species"
        title="Species"
        defaultValue={studyEditMode ? formData?.species : undefined}
        validation={validation.species}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <FormField
        id="piName"
        title="Principal Investigator Name"
        defaultValue={studyEditMode ? formData?.piName : undefined}
        validators={[FormValidators.REQUIRED]}
        validation={validation.piName}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      {!isEmpty(user) && <FormField
        id="dataSubmitterName"
        title="Data Submitter Name"
        description="The individual completing this form will be saved with the study."
        defaultValue={studyEditMode ? formData?.dataSubmitterName : user?.displayName}
        validation={validation.dataSubmitterName}
        disabled={true}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />}
      {!isEmpty(user) && <FormField
        id="dataSubmitterEmail"
        title="Data Submitter Email"
        defaultValue={studyEditMode ? formData?.dataSubmitterEmail : user?.email}
        validation={validation.dataSubmitterEmail}
        disabled={true}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />}
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
        defaultValue={studyEditMode ? formData?.dataCustodianEmail : undefined}
        validation={validation.dataCustodianEmail}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <FormField
          id="alternativeDataSharingPlanTargetDeliveryDate"
          style={{ width: '45%' }}
          title="Target Delivery Date"
          placeholder="Please enter date (YYYY-MM-DD)"
          defaultValue={studyEditMode ? formData?.alternativeDataSharingPlanTargetDeliveryDate : initialFormData?.alternativeDataSharingPlanTargetDeliveryDate}
          validators={[FormValidators.DATE]}
          onChange={onChange}
          validation={validation.alternativeDataSharingPlanTargetDeliveryDate}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="alternativeDataSharingPlanTargetPublicReleaseDate"
          style={{ width: '45%' }}
          title="Target Public Release Date"
          placeholder="Please enter date (YYYY-MM-DD)"
          defaultValue={studyEditMode ? formData?.alternativeDataSharingPlanTargetPublicReleaseDate : initialFormData?.alternativeDataSharingPlanTargetPublicReleaseDate}
          validators={[FormValidators.DATE]}
          onChange={onChange}
          validation={validation.alternativeDataSharingPlanTargetPublicReleaseDate}
          onValidationChange={onValidationChange}
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
          { name: false, text: 'No, I do not want my dataset info to be visible and available for requests' }
        ]}
        defaultValue={studyEditMode ? formData?.publicVisibility : undefined}
        onChange={onChange}
        validation={validation.publicVisibility}
        onValidationChange={onValidationChange}
      />
    </div>
  );
}
