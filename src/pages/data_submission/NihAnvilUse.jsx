import React from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../../components/forms/forms';
import { isNil, toLower } from 'lodash/fp';

export const YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already';
export const YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID';
export const NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL';
export const NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL';

const nihAnvilUseLabels = {
  yes_nhgri_yes_phs_id: YES_NHGRI_YES_PHS_ID,
  yes_nhgri_no_phs_id: YES_NHGRI_NO_PHS_ID,
  no_nhgri_yes_anvil: NO_NHGRI_YES_ANVIL,
  no_nhgri_no_anvil: NO_NHGRI_NO_ANVIL,
};

const radioSelectionToLabels = (selection) => {
  if (!isNil(selection)) {
    const lowerCaseSelection = toLower(selection);
    switch (lowerCaseSelection) {
      case 'i am nhgri funded and i have a dbgap phs id already':
        return 'yes_nhgri_yes_phs_id';
      case 'i am nhgri funded and i do not have a dbgap phs id already':
        return 'yes_nhgri_no_phs_id';
      case 'i am not nhgri funded but i am seeking to submit data to anvil':
        return 'no_nhgri_yes_anvil';
      case 'i am not nhgri funded and do not plan to store data in anvil':
        return 'no_nhgri_no_anvil';
      default:
        return undefined;
    }
  }
};

export default function NihAnvilUse(props) {
  const {
    onChange,
    formData,
    studyEditMode,
    validation,
    onValidationChange,
  } = props;

  return (
    <div className="data-submitter-section">
      <h2>NIH and AnVIL use</h2>
      <FormField
        id="nihAnvilUse"
        title="Will you or did you submit data to the NIH?"
        type={FormFieldTypes.RADIOGROUP}
        options={[
          {text: YES_NHGRI_YES_PHS_ID, name: 'yes_nhgri_yes_phs_id'},
          {text: YES_NHGRI_NO_PHS_ID, name: 'yes_nhgri_no_phs_id'},
          {text: NO_NHGRI_YES_ANVIL, name: 'no_nhgri_yes_anvil'},
          {text: NO_NHGRI_NO_ANVIL, name: 'no_nhgri_no_anvil'},
        ]}
        defaultValue={studyEditMode ? radioSelectionToLabels(formData?.nihAnvilUse) : undefined}
        validators={[FormValidators.REQUIRED]}
        onChange={(config) => {
          const value = nihAnvilUseLabels[config.value];
          onChange({key: config.key, value: value, isValid: config.isValid});
          studyEditMode ? formData.nihAnvilUse = config.value : undefined;
        }}
        validation={validation.nihAnvilUse}
        onValidationChange={onValidationChange}
      />

      {formData.nihAnvilUse === YES_NHGRI_YES_PHS_ID && (
        <>
          <FormField
            id="dbGaPPhsID"
            title="dbGaP phs ID"
            placeholder="Firstname Lastname"
            validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
            defaultValue={formData.dbGaPPhsID}
            onChange={onChange}
            validation={validation.dbGaPPhsID}
            onValidationChange={onValidationChange}
          />
          <FormField
            id="dbGaPStudyRegistrationName"
            title="dbGaP Study Registration Name"
            placeholder="Name"
            defaultValue={formData.dbGaPStudyRegistrationName}
            onChange={onChange}
            validation={validation.dbGaPStudyRegistrationName}
            onValidationChange={onValidationChange}
          />
          <FormField
            id="embargoReleaseDate"
            title="Embargo Release Date"
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            defaultValue={formData.embargoReleaseDate}
            onChange={onChange}
            validation={validation.embargoReleaseDate}
            onValidationChange={onValidationChange}
          />
          <FormField
            id="sequencingCenter"
            title="Sequencing Center"
            placeholder="Name"
            defaultValue={formData.sequencingCenter}
            onChange={onChange}
            validation={validation.sequencingCenter}
            onValidationChange={onValidationChange}
          />
        </>
      )}
    </div>
  );
}