import React from 'react';
import { FormFieldTypes, FormField, FormValidators } from '../../components/forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty, isNil } from 'lodash/fp';
import { useState } from 'react';
import { YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL  } from './NihAnvilUse';

export const NIHAdministrativeInformation = (props) => {
  const {
    formData,
    onChange,
    studyEditMode,
    institutions,
    validation,
    onValidationChange,
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(formData?.multiCenterStudy === true || false);
  const [showGSRRequiredExplanation, setShowGSRRequiredExplanation] = useState(formData?.controlledAccessRequiredForGenomicSummaryResultsGSR === false || false);
  const [gsrRequiredExplanation, setGSRRequiredExplanation] = useState('');

  const findInstitutionSelectOption = (id) => {
    const institution = institutions.find((inst) => inst.id === id);

    return {
      displayText: institution?.name || 'Unknown',
      id: id,
    };
  };

  const isRendered = studyEditMode ?
    ['yes_nhgri_yes_phs_id', 'yes_nhgri_no_phs_id', 'no_nhgri_yes_anvil'].includes(formData.nihAnvilUse)
    : [YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL].includes(formData.nihAnvilUse);

  return (
    <>
      {isRendered && <div className="data-submitter-section">
        <h2>NIH Administrative Information</h2>
        <FormField
          id="piInstitution"
          title="Principal Investigator Institution"
          isRendered={!isEmpty(institutions)}
          validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
          type={FormFieldTypes.SELECT}
          selectOptions={institutions.map((inst) => ({displayText: inst.name, id: inst.id }))}
          isCreatable={false}
          selectConfig={{}}
          onChange={({ key, value, isValid }) => {
            onChange({ key, value: value?.id, isValid });
          }}
          defaultValue={!isNil(formData.piInstitution) ? findInstitutionSelectOption(formData.piInstitution) : null}
          validation={validation.piInstitution}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="nihGrantContractNumber"
          title="NIH Grant or Contract Number"
          validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
          onChange={onChange}
          defaultValue={formData?.nihGrantContractNumber}
          validation={validation.nihGrantContractNumber}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="nihICsSupportingStudy"
          title="NIH ICs Supporting the Study"
          placeholder="Institute/Center Name"
          onChange={onChange}
          type={FormFieldTypes.SELECT}
          isMulti={true}
          defaultValue={formData?.nihICsSupportingStudy}
          selectOptions={nihInstitutions}
          validation={validation.nihICsSupportingStudy}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="nihProgramOfficerName"
          title="NIH Program Officer Name"
          onChange={onChange}
          placeholder="Officer Name"
          defaultValue={formData?.nihProgramOfficerName}
          validation={validation.nihProgramOfficerName}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="nihInstitutionCenterSubmission"
          title="NIH Institute/Center for Submission"
          placeholder="Institute/Center Name"
          onChange={onChange}
          type={FormFieldTypes.SELECT}
          defaultValue={formData?.nihInstitutionCenterSubmission}
          selectOptions={nihInstitutions}
          validation={validation.nihInstitutionCenterSubmission}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="nihGenomicProgramAdministratorName"
          title="NIH Genomic Program Administrator Name"
          defaultValue={formData?.nihGenomicProgramAdministratorName}
          onChange={onChange}
          validation={validation.nihGenomicProgramAdministratorName}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="multiCenterStudy"
          title="Is this a multi-center study?"
          type={FormFieldTypes.YESNORADIOGROUP}
          defaultValue={formData?.multiCenterStudy}
          onChange={({ key, value }) => {
            setShowMultiCenterStudy(value);
            onChange({ key, value });
          }}
          validation={validation.multiCenterStudy}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="collaboratingSites"
          isRendered={showMultiCenterStudy}
          title="What are the collaborating sites?"
          type={FormFieldTypes.SELECT}
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
          placeholder="List site and hit enter here..."
          defaultValue={formData?.collaboratingSites}
          onChange={onChange}
          validation={validation.collaboratingSites}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="controlledAccessRequiredForGenomicSummaryResultsGSR"
          title="Is controlled access required for genomic summary results (GSR)?"
          defaultValue={formData?.controlledAccessRequiredForGenomicSummaryResultsGSR}
          type={FormFieldTypes.YESNORADIOGROUP}
          onChange={({ key, value }) => {
            setShowGSRRequiredExplanation(value);
            onChange({ key, value });
            onChange({
              key: 'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation',
              value: value ? gsrRequiredExplanation : undefined,
            });
          }}
          validation={validation.controlledAccessRequiredForGenomicSummaryResultsGSR}
          onValidationChange={onValidationChange}
        />
        <FormField
          id="controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation"
          title="If yes, explain why controlled access is needed for GSR."
          isRendered={showGSRRequiredExplanation}
          defaultValue={gsrRequiredExplanation}
          validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
          onChange={({ key, value }) => {
            setGSRRequiredExplanation(value);
            onChange({ key, value });
          }}
          validation={validation.controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation}
          onValidationChange={onValidationChange}
        />
      </div>}
    </>
  );
};

export default NIHAdministrativeInformation;