import { h, h2, div } from 'react-hyperscript-helpers';
import { isEmpty } from 'lodash/fp';

import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';

export default function StudyInformationUpdate(props) {
  const { user, formData, onChange, validation, onValidationChange } = props;

  return h(div, {
    className: 'study-update-section',
  }, [
    h2('Study Information'),
    h(FormField, {
      id: 'studyName',
      title: 'Study Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.name,
      disabled: true,
      validation: validation.studyName,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'studyType',
      title: 'Study Type',
      type: FormFieldTypes.SELECT,
      selectOptions: [
        'Observational', 'Interventional', 'Descriptive',
        'Analytical', 'Prospective', 'Retrospective',
        'Case report', 'Case series', 'Cross-sectional',
        'Cohort study'
      ],
      isCreatable: true,
      selectConfig: {},
      defaultValue: formData?.studyType,
      validation: validation.studyType,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      type: FormFieldTypes.TEXTAREA,
      rows: 6,
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.description,
      validation: validation.description,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'dataTypes',
      title: 'Data Types',
      placeholder: 'Type',
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      isCreatable: true,
      isMulti: true,
      optionsAreString: true,
      // The top properties were extracted from the prod database and deduplicated using the query:
      // SELECT property_value, COUNT(*) FROM dataset_property WHERE property_key = 2 GROUP BY property_value ORDER BY COUNT(*) DESC;
      selectOptions: [
        'CITE-seq',
        'Hybrid Capture',
        'RNA-Seq',
        'scRNA-Seq',
        'Spatial Transcriptomics',
        'snRNA-Seq',
        'Whole Genome (WGS)',
        'Whole Exome (WES)',
      ],
      defaultValue: formData?.dataTypes,
      validation: validation.dataTypes,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      defaultValue: formData?.phenotypeIndication,
      validation: validation.phenotypeIndication,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'species',
      title: 'Species',
      defaultValue: formData?.species,
      validation: validation.species,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.piName,
      validation: validation.piName,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterName',
      title: 'Data Submitter Name ',
      description: `The individual completing this form will be saved with the study.`,
      defaultValue: user?.displayName,
      disabled: true,
      validation: validation.displayName,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      disabled: true,
      validation: validation.email,
      onChange,
      onValidationChange
    }),
    h(FormField, {
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      description: `Insert the email for any individual with the 
      authority to add/remove users access to this study’s datasets.`,
      type: FormFieldTypes.SELECT,
      validators: [FormValidators.REQUIRED],
      selectOptions: [],
      isMulti: true,
      optionsAreString: true,
      selectConfig: {
        components: {
          DropdownIndicator: null,
          Menu: () => null,
        },
      },
      placeholder: 'Add one or more emails',
      defaultValue: formData?.dataCustodianEmail,
      validation: validation.dataCustodianEmail,
      onChange,
      onValidationChange
    }),
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    }, [

      h(FormField, {
        id: 'alternativeDataSharingPlanTargetDeliveryDate',
        style: {
          width: '45%',
        },
        defaultValue: formData?.alternativeDataSharingPlanTargetDeliveryDate,
        title: 'Target Delivery Date',
        placeholder: 'Please enter date (YYYY-MM-DD)',
        validators: [FormValidators.DATE],
        validation: validation.alternativeDataSharingPlanTargetDeliveryDate,
        onChange,
        onValidationChange
      }),
      h(FormField, {
        id: 'alternativeDataSharingPlanTargetPublicReleaseDate',
        style: {
          width: '45%',
        },
        defaultValue: formData?.alternativeDataSharingPlanTargetPublicReleaseDate,
        title: 'Target Public Release Date',
        placeholder: 'Please enter date (YYYY-MM-DD)',
        validators: [FormValidators.DATE],
        validation: validation.alternativeDataSharingPlanTargetPublicReleaseDate,
        onChange,
        onValidationChange
      }),
    ]),
    h(FormField, {
      id: 'publicVisibility',
      title: 'Public Visibility',
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.RADIOGROUP,
      description: 'Please select one of the following data use permissions for your dataset',
      name: 'publicVisibility',
      options: [
        { name: true, text: 'Yes, I want my dataset info to be visible and available for requests' },
        { name: false, text: 'No, I do not want my dataset info to be visible and available for requests' }
      ],
      defaultValue: formData?.publicVisibility,
      validation: validation.publicVisibility,
      onChange,
      onValidationChange
    }),
  ]);
}