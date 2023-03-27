import {div, h, h2} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty } from 'lodash/fp';
import { useState } from 'react';

export const NIHAdministrativeInformation = (props) => {
  const {
    initialFormData,
    onChange,
    institutions,
    validation,
    onValidationChange,
    nihAdminRendered,
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(initialFormData?.multiCenterStudy === true || false);
  const [showGSRRequiredExplanation, setShowGSRRequiredExplanation] = useState(initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR === false || false);
  const [gsrRequiredExplanation, setGSRRequiredExplanation] = useState('');

  return div({
    isRendered: nihAdminRendered === true,
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
      defaultValue: initialFormData?.piInstitution,
      validation: validation.piInstitution,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.nihGrantContractNumber,
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
      defaultValue: initialFormData?.nihICsSupportingStudy,
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
      defaultValue: initialFormData?.nihProgramOfficerName,
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
      defaultValue: initialFormData?.nihInstitutionCenterSubmission,
      selectOptions: nihInstitutions,
      validation: validation.nihInstitutionCenterSubmission,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.nihGenomicProgramAdministratorName,
      onChange,
      validation: validation.nihGenomicProgramAdministratorName,
      onValidationChange,
    }),
    h(FormField, {
      id: 'multiCenterStudy',
      title: 'Is this a multi-center study?',
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.multiCenterStudy,
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
      defaultValue: initialFormData?.collaboratingSites,
      validators: [FormValidators.REQUIRED],
      onChange,
      validation: validation.collaboratingSites,
      onValidationChange,
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR,
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