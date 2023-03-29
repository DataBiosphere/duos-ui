import {div, h, h2} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty } from 'lodash/fp';
import { useState } from 'react';
import { YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL  } from './NihAnvilUse';

export const NIHAdministrativeInformation = (props) => {
  const {
    formData,
    onChange,
    institutions,
    validation,
    onValidationChange,
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(formData?.multiCenterStudy === true || false);
  const [showGSRRequiredExplanation, setShowGSRRequiredExplanation] = useState(formData?.controlledAccessRequiredForGenomicSummaryResultsGSR === false || false);
  const [gsrRequiredExplanation, setGSRRequiredExplanation] = useState('');

  return div({
    isRendered: ((formData.nihAnvilUse === YES_NHGRI_YES_PHS_ID) || (formData.nihAnvilUse === YES_NHGRI_NO_PHS_ID) || (formData.nihAnvilUse === NO_NHGRI_YES_ANVIL)),
    className: 'data-submitter-section',
  }, [
    h2('NIH Administrative Information'),
    h(FormField, {
      id: 'piInstitution',
      title: 'Principal Investigator Institution',
      isRendered: !isEmpty(institutions),
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      selectOptions: institutions.map((inst) => { return { displayText: inst.name, id: inst.id };}),
      isCreatable: false,
      selectConfig: {},
      onChange: ({key, value, isValid}) => {
        onChange({key, value: value?.id, isValid});
      },
      defaultValue: formData?.piInstitution,
      validation: validation.piInstitution,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: formData?.nihGrantContractNumber,
      validation: validation.nihGrantContractNumber,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihICsSupportingStudy',
      title: 'NIH ICs Supporting the Study',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      isMulti: true,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.nihICsSupportingStudy,
      selectOptions: nihInstitutions,
      validation: validation.nihICsSupportingStudy,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihProgramOfficerName',
      title: 'NIH Program Officer Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      placeholder: 'Officer Name',
      defaultValue: formData?.nihProgramOfficerName,
      validation: validation.nihProgramOfficerName,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihInstitutionCenterSubmission',
      title: 'NIH Institute/Center for Submission',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.nihInstitutionCenterSubmission,
      selectOptions: nihInstitutions,
      validation: validation.nihInstitutionCenterSubmission,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.nihGenomicProgramAdministratorName,
      onChange,
      validation: validation.nihGenomicProgramAdministratorName,
      onValidationChange,
    }),
    h(FormField, {
      id: 'multiCenterStudy',
      title: 'Is this a multi-center study?',
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.multiCenterStudy,
      onChange: ({key, value}) => {
        setShowMultiCenterStudy(value);
        onChange({key, value});
      },
      validation: validation.multiCenterStudy,
      onValidationChange,
    }),
    h(FormField, {
      id: 'collaboratingSites',
      isRendered: showMultiCenterStudy,
      title: 'What are the collaborating sites?',
      type: FormFieldTypes.MULTITEXT,
      placeholder: 'List site(s) here...',
      defaultValue: formData?.collaboratingSites,
      validators: [FormValidators.REQUIRED],
      onChange,
      validation: validation.collaboratingSites,
      onValidationChange,
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: formData?.controlledAccessRequiredForGenomicSummaryResultsGSR,
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        setShowGSRRequiredExplanation(value);
        onChange({key, value});
        onChange({
          key: 'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation',
          value: (value ? gsrRequiredExplanation : undefined),
        });
      },
      validation: validation.controlledAccessRequiredForGenomicSummaryResultsGSR,
      onValidationChange,
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation',
      title: 'If yes, explain why controlled access is needed for GSR.',
      isRendered: showGSRRequiredExplanation,
      defaultValue: gsrRequiredExplanation,
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        setGSRRequiredExplanation(value);
        onChange({key, value});
      },
      validation: validation.controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation,
      onValidationChange,
    }),
  ]);
};

export default NIHAdministrativeInformation;