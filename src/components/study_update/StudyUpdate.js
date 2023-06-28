import { useCallback, useState, useEffect } from 'react';
import { button, h, h2, div } from 'react-hyperscript-helpers';
import { find, isNil, isEmpty } from 'lodash/fp';

import { Notifications } from '../../libs/utils';
import { DataSet } from '../../libs/ajax';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import initialFormData from '../data_submission/NIHDataManagement';

export default function StudyUpdate(props) {
  const { study, history, user } = props;
  const [formData, setFormData] = useState({});

  const extract = useCallback((propertyName) => {
    const property = find({ propertyName })(study.properties);
    return property?.propertyValue;
  }, [study]);

  const asProperty = (propertyName, propertyValue) => {
    return {
      propertyName,
      propertyValue
    };
  };

  const submitForm = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const formElement = event.target.form;
    const submitData = new FormData(formElement);
    const nihFileData = submitData.get('nihInstitutionalCertificationFile');
    const consentGroups = [{ nihInstitutionalCertificationFile: nihFileData }];

    const newStudy = {
      name: formData.properties.name,
      studyType: formData.properties.name,
      studyDescription: formData.properties.studyDescription,
      properties: [
        asProperty('Study Name', formData.properties.name),
        asProperty('Study Type', formData.properties.studyType),
        asProperty('Study Description', formData.properties.studyDescription),
        asProperty('Data Types', formData.properties.dataTypes),
        asProperty('Phenotype/Indication', formData.properties.phenotypeIndication),
        asProperty('Species', formData.properties.species),
        asProperty('Principal Investigator Name', formData.properties.principalInvestigator),
        asProperty('Data Submitter Name ', formData.properties.dataSubmitterName),
        asProperty('Data Submitter Email ', formData.properties.dataSubmitterEmail),
        asProperty('Data Custodian Email ', formData.properties.dataCustodianEmail)
      ]
    };

    const multiPartFormData = new FormData();
    multiPartFormData.append('study', JSON.stringify(newStudy));
    multiPartFormData.append('consentGroups', consentGroups);

    DataSet.updateStudy(study.studyId, multiPartFormData).then(() => {
      history.push('/dataset_catalog');
      Notifications.showSuccess({ text: 'Update submitted successfully!' });
    }, () => {
      Notifications.showError({ text: 'Some errors occurred, the dataset was not updated.' });
    });
  };

  const prefillFormData = useCallback(async (study) => {
    setFormData({
      name: study.name,
      studyType: study.studyType,
      studyDescription: study.studyDescription,
    //   properties: {
    //     name: extract('Study Name'),
    //     studyType: extract('Study Type'),
    //     studyDescription: extract('Study Description'),
    //     dataTypes: extract('Data Types'),
    //     phenotypeIndication: extract('Phenotype/Indication'),
    //     species: extract('Species'),
    //     piName: extract('Principal Investigator Name'),
    //     dataSubmitterName: extract('Data Submitter Name '),
    //     dataSubmitterEmail: extract('Data Submitter Email'),
    //     dataCustodianEmail: extract('Data Custodian Email')
    //   },
    //   //dataset: await normalizeDataUse(dataset?.dataUse),
    //   //dac: { ...dac, dacs }
    });
  }, [extract]);

  useEffect(() => {
    if (isNil(formData.name)) {
      prefillFormData(study);
    }
  }, [prefillFormData, study, formData]);

  return h(div, {
    className: 'data-submitter-section',
  }, [
    h2('Study Information'),
    h(FormField, {
      id: 'studyName',
      title: 'Study Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.name,
      onChange: ({ value }) => {
        formData.properties.name = value;
      },
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
      onChange: ({ value }) => {
        formData.properties.studyType = value;
      },
    }),
    h(FormField, {
      type: FormFieldTypes.TEXTAREA,
      rows: 6,
      id: 'studyDescription',
      title: 'Study Description',
      placeholder: 'Description',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.studyDescription,
      onChange: ({ value }) => {
        formData.properties.studyDescription = value;
      },
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
      onChange: ({ value }) => {
        formData.properties.dataTypes = value;
      },
    }),
    h(FormField, {
      id: 'phenotypeIndication',
      title: 'Phenotype/Indication Studied',
      defaultValue: formData?.phenotypeIndication,
      onChange: ({ value }) => {
        formData.properties.phenotypeIndication = value;
      },
    }),
    h(FormField, {
      id: 'species',
      title: 'Species',
      defaultValue: formData?.species,
      onChange: ({ value }) => {
        formData.properties.species = value;
      },
    }),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData?.piName,
      onChange: ({ value }) => {
        formData.properties.piName = value;
      },
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterName',
      title: 'Data Submitter Name ',
      description: `The individual completing this form will be saved with the study.`,
      defaultValue: user?.displayName,
      disabled: true,
      onChange: ({ value }) => {
        formData.properties.dataSubmitterName = value;
      },
    }),
    h(FormField, {
      isRendered: !isEmpty(user),
      id: 'dataSubmitterEmail',
      title: 'Data Submitter Email',
      defaultValue: user?.email,
      disabled: true,
      onChange: ({ value }) => {
        formData.properties.dataSubmitterEmail = value;
      },
    }),
    h(FormField, {
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      description: `Insert the email for any individual with the 
      authority to add/remove users access to this study’s datasets.`,
      type: FormFieldTypes.SELECT,
      validators: [ FormValidators.REQUIRED ],
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
      placeholder: 'Add one or more emails',
      defaultValue: formData?.dataCustodianEmail,
      onChange: ({ value }) => {
        formData.properties.dataCustodianEmail = value;
      },
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
        onChange: ({ value }) => {
          formData.properties.alternativeDataSharingPlanTargetDeliveryDate = value;
        },
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
        onChange: ({ value }) => {
          formData.properties.alternativeDataSharingPlanTargetPublicReleaseDate = value;
        },
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
      onChange: ({ value }) => {
        formData.properties.publicVisibility = value;
      },
    }),
    div({ className: 'flex flex-row', style: { justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '2rem' } }, [
      button({
        className: 'button button-white',
        type: 'submit',
        onClick: submitForm,
      }, 'Submit'),
    ]),
  ]);
}