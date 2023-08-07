import {div, h, h2} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
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

  return div({
    isRendered:
      (studyEditMode ?
        ['yes_nhgri_yes_phs_id', 'yes_nhgri_no_phs_id', 'no_nhgri_yes_anvil'].includes(formData.properties.nihAnvilUse)
        : [YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL].includes(formData.nihAnvilUse)),
    className: 'data-submitter-section',
  }, [
    h2('NIH Administrative Information'),
    h(FormField, {
      id: 'piInstitution',
      title: 'Principal Investigator Institution',
      isRendered: !isEmpty(institutions),
      validators: studyEditMode ? undefined : [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      selectOptions: institutions.map((inst) => { return { displayText: inst.name, id: inst.id };}),
      isCreatable: false,
      selectConfig: {},
      onChange: ({key, value, isValid}) => {
        onChange({key, value: value?.id, isValid});
      },
      defaultValue:
        (studyEditMode ?
          (!isNil(formData.properties.piInstitution) ? findInstitutionSelectOption(formData.properties.piInstitution) : null)
          : (!isNil(formData.piInstitution) ? findInstitutionSelectOption(formData.piInstitution) : null)),
      validation: validation.piInstitution,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: studyEditMode ? undefined : [FormValidators.REQUIRED],
      onChange,
      defaultValue: studyEditMode ? formData?.properties.nihGrantContractNumber : formData?.nihGrantContractNumber,
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
      defaultValue: studyEditMode ? formData?.properties.nihICsSupportingStudy : formData?.nihICsSupportingStudy,
      selectOptions: nihInstitutions,
      validation: validation.nihICsSupportingStudy,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihProgramOfficerName',
      title: 'NIH Program Officer Name',
      onChange,
      placeholder: 'Officer Name',
      defaultValue: studyEditMode ? formData?.properties.nihProgramOfficerName : formData?.nihProgramOfficerName,
      validation: validation.nihProgramOfficerName,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihInstitutionCenterSubmission',
      title: 'NIH Institute/Center for Submission',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      defaultValue: studyEditMode ? formData?.properties.nihInstitutionCenterSubmission : formData?.nihInstitutionCenterSubmission,
      selectOptions: nihInstitutions,
      validation: validation.nihInstitutionCenterSubmission,
      onValidationChange,
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      defaultValue: studyEditMode ? formData?.properties.nihGenomicProgramAdministratorName : formData?.nihGenomicProgramAdministratorName,
      onChange,
      validation: validation.nihGenomicProgramAdministratorName,
      onValidationChange,
    }),
    h(FormField, {
      id: 'multiCenterStudy',
      title: 'Is this a multi-center study?',
      type: FormFieldTypes.YESNORADIOGROUP,
      defaultValue: studyEditMode ? formData?.properties.multiCenterStudy : formData?.multiCenterStudy,
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
      type: FormFieldTypes.SELECT,
      selectOptions: [],
      isCreatable: true,
      isMulti: true,
      optionsAreString: true,
      selectConfig: {
        components: {
          DropdownIndicator: null,
          Menu: () => null,
        },
      },
      placeholder: 'List site and hit enter here...',
      defaultValue: studyEditMode ? formData?.properties.collaboratingSites : formData?.collaboratingSites,
      onChange,
      validation: validation.collaboratingSites,
      onValidationChange,
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: studyEditMode ? formData?.properties.controlledAccessRequiredForGenomicSummaryResultsGSR : formData?.controlledAccessRequiredForGenomicSummaryResultsGSR,
      type: FormFieldTypes.YESNORADIOGROUP,
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
      validators: studyEditMode ? undefined : [FormValidators.REQUIRED],
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