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
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(initialFormData?.multiCenterStudy === true || false);
  const [showGSRNotRequiredExplanation, setShowGSRNotRequiredExplanation] = useState(initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR === false || false);
  const [gsrNotRequiredExplanation, setGSRNotRequiredExplanation] = useState('');

  return div({
    className: 'data-submitter-section',
  }, [
    h2('NIH Administrative Information'),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.piName,
    }),
    h(FormField, {
      id: 'piInstitution',
      title: 'Principal Investigator Institution',
      isRendered: !isEmpty(institutions),
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      selectOptions: institutions,
      isCreatable: false,
      selectConfig: {},
      onChange,
      defaultValue: initialFormData?.piInstitution,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.nihGrantContractNumber,
    }),
    h(FormField, {
      id: 'nihICsSupportingStudy',
      title: 'NIH ICs Supporting the Study',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.nihICsSupportingStudy,
      selectOptions: nihInstitutions,
    }),
    h(FormField, {
      id: 'nihProgramOfficerName',
      title: 'NIH Program Officer Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      placeholder: 'Officer Name',
      defaultValue: initialFormData?.nihProgramOfficerName,
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
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.nihGenomicProgramAdministratorName,
      onChange,
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
      }
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
    }),
    //NOTE: radio group not equipped to handle yes/no groupings
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR,
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        setShowGSRNotRequiredExplanation(!value);
        onChange({key, value});
        onChange({
          key: 'controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation',
          value: (!value ? gsrNotRequiredExplanation : undefined),
        });
      }
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation',
      title: 'If no, explain why controlled access is needed for GSR.',
      isRendered: showGSRNotRequiredExplanation,
      defaultValue: gsrNotRequiredExplanation,
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        setGSRNotRequiredExplanation(value);
        onChange({key, value});
      },
    }),
  ]);
};

export default NIHAdministrativeInformation;