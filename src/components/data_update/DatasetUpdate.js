import { useCallback, useState, useEffect } from 'react';
import { button, h, h2, div } from 'react-hyperscript-helpers';
import { find, isArray, isNil } from 'lodash/fp';

import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { DAC, DAR, DataSet } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';

export const DatasetUpdate = (props) => {
  const { dataset } = props;

  const [formData, setFormData] = useState({ dac: {}, dataUse: {}, properties: {} });

  const searchOntologies = (query, callback) => {
    let options = [];
    DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map(function (item) {
          return item.label;
        });
        callback(options);
      });
  };

  const getDiseaseLabels = async (ontologyIds) => {
    let labels = [];
    if (!isNil(ontologyIds)) {
      const idList = ontologyIds.join(',');
      const result = await DAR.searchOntologyIdList(idList);
      labels = result.map(r => r.label);
    }
    return labels;
  };

  const extract = useCallback((propertyName) => {
    const property = find({ propertyName })(dataset.properties);
    return property?.propertyValue;
  }, [dataset]);

  const asProperty = (propertyName, propertyValue) => {
    return {
      propertyName,
      propertyValue
    };
  };

  const normalizeDataUse = useCallback(async (dataUse) => {
    let du = dataUse;
    if (!isNil(dataUse.diseaseRestrictions)) {
      du.hasDiseaseRestrictions = true;
      du.diseaseLabels = await getDiseaseLabels(dataUse.diseaseRestrictions);
    }
    if (!isNil(dataUse.other)) {
      du.hasPrimaryOther = true;
    }
    if (!isNil(dataUse.secondaryOther)) {
      du.hasSecondaryOther = true;
    }
    return du;
  }, []);

  const submitForm = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const formElement = event.target.form;
    const submitData = new FormData(formElement);
    const nihFileData = submitData.get('nihInstitutionalCertification');

    const newDataset = {
      name: dataset.name,
      dacId: dataset.dacId,
      datasetProperties: [
        asProperty('Dataset Name', formData.properties.datasetName),
        asProperty('Data Type', formData.properties.dataType),
        asProperty('Species', formData.properties.species),
        asProperty('Phenotype/Indication', formData.properties.phenotype),
        asProperty('# of participants', formData.properties.nrParticipants),
        asProperty('Description', formData.properties.description),
        asProperty('dbGAP', formData.properties.dbGap),
        asProperty('Data Depositor', formData.properties.dataDepositor),
        asProperty('Principal Investigator(PI)', formData.properties.principalInvestigator),
      ]
    };

    DataSet.updateDatasetV3(dataset.dataSetId, newDataset, null, nihFileData).catch(() => {
      Notifications.showError({ text: 'Some errors occurred, the dataset was not updated.' });
    });
  };

  const prefillFormData = useCallback(async (dataset) => {
    const dac = await DAC.get(dataset?.dacId);
    setFormData({
      datasetName: dataset.datasetName,
      properties: {
        datasetName: extract('Dataset Name'),
        dataType: extract('Data Type'),
        species: extract('Species'),
        phenotype: extract('Phenotype/Indication'),
        nrParticipants: extract('# of participants'),
        description: extract('Description'),
        dbGap: extract('dbGAP'),
        dataDepositor: extract('Data Depositor'),
        principalInvestigator: extract('Principal Investigator(PI)'),
      },
      dataUse: await normalizeDataUse(dataset?.dataUse),
      dac
    });
  }, [extract, normalizeDataUse]);

  useEffect(() => {
    if (isNil(formData.datasetName)) {
      prefillFormData(dataset);
    }
  }, [prefillFormData, dataset, formData]);

  return h(div, {
    className: 'data-update-section',
  }, [
    h2('1. Dataset Information'),
    h(FormField, {
      id: 'datasetName',
      title: 'Dataset Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.datasetName,
      onChange: ({ value }) => {
        formData.properties.datasetName = value;
      }
    }),
    h(FormField, {
      id: 'description',
      title: 'Dataset Description',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.description,
      onChange: ({ value }) => {
        formData.properties.description = value;
      }
    }),
    h(FormField, {
      id: 'dataDepositor',
      title: 'Data Custodian',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.dataDepositor,
      onChange: ({ value }) => {
        formData.properties.dataDepositor = value;
      }
    }),
    h(FormField, {
      id: 'principalInvestigator',
      title: 'Principal Investigator (PI)',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.principalInvestigator,
      onChange: ({ value }) => {
        formData.properties.principalInvestigator = value;
      }
    }),
    h(FormField, {
      id: 'dbGap',
      title: 'Dataset Repository URL',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.dbGap,
      onChange: ({ value }) => {
        formData.properties.dbGap = value;
      }
    }),
    h(FormField, {
      id: 'dataType',
      title: 'Data Type',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.dataType,
      onChange: ({ value }) => {
        formData.properties.dataType = value;
      }
    }),
    h(FormField, {
      id: 'species',
      title: 'Species',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.species,
      onChange: ({ value }) => {
        formData.properties.species = value;
      }
    }),
    h(FormField, {
      id: 'phenotype',
      title: 'Phenotype/Indication',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.phenotype,
      onChange: ({ value }) => {
        formData.properties.phenotype = value;
      }
    }),
    h(FormField, {
      id: 'nrParticipants',
      title: '# of Participants',
      type: FormFieldTypes.NUMBER,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.properties.nrParticipants,
      onChange: ({ value }) => {
        formData.properties.nrParticipants = value;
      }
    }),
    h(FormField, {
      id: 'dac',
      title: 'Data Access Committee',
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      selectOptions: [], //TODO: list available DACs
      defaultValue: [
        { displayText: formData.dac.name, data: formData.dac.dacId },
      ],
    }),
    h2('2. Data Use Terms'),
    // readonly primary
    div({}, [
      h(FormField, {
        title: 'Primary Data Use Terms*',
        description: 'Please select one of the following data use permissions for your dataset',
        type: FormFieldTypes.RADIOBUTTON,
        id: 'generalUse',
        toggleText: 'General Research Use',
        value: 'generalUse',
        defaultValue: formData.dataUse.generalUse === true ? 'generalUse' : undefined,
        disabled: true,
      }),
      h(FormField, {
        type: FormFieldTypes.RADIOBUTTON,
        id: 'hmbResearch',
        toggleText: 'Health/Medical/Biomedical Research Use',
        value: 'hmbResearch',
        defaultValue: formData.dataUse.hmbResearch === true ? 'hmbResearch' : undefined,
        disabled: true,
      }),
      h(FormField, {
        type: FormFieldTypes.RADIOBUTTON,
        id: 'diseaseRestrictions',
        toggleText: 'Disease-Specific Research Use',
        value: 'diseaseRestrictions',
        defaultValue: isArray(formData.dataUse.diseaseRestrictions) && formData.dataUse.diseaseRestrictions.length > 0 ? 'diseaseRestrictions' : undefined,
        disabled: true,
      }),
      div({
        style: {
          marginBottom: '1.0rem'
        }
      }, [
        h(FormField, {
          type: FormFieldTypes.SELECT,
          isMulti: true,
          isCreatable: true,
          optionsAreString: true,
          isAsync: true,
          id: 'diseaseRestrictionsText',
          validators: [FormValidators.REQUIRED],
          placeholder: 'none',
          loadOptions: searchOntologies,
          defaultValue: formData.dataUse.diseaseLabels,
          disabled: true,
        }),
      ]),
      h(FormField, {
        type: FormFieldTypes.RADIOBUTTON,
        id: 'otherPrimary',
        toggleText: 'Other',
        value: 'otherPrimary',
        defaultValue: formData.dataUse.otherRestrictions ? 'otherPrimary' : undefined,
        disabled: true,
      }),
      h(FormField, {
        id: 'otherPrimaryText',
        validators: [FormValidators.REQUIRED],
        placeholder: 'none',
        defaultValue: formData.dataUse.other,
        disabled: true,
      }),
    ]),
    // secondary
    div({}, [
      h(FormField, {
        title: 'Secondary Data Use Terms',
        description: 'Please select all applicable data use parameters.',
        type: FormFieldTypes.CHECKBOX,
        id: 'methodsResearch',
        toggleText: 'No methods development or validation studies (NMDS)',
        defaultValue: formData.dataUse.methodsResearch === true,
        onChange: ({ value }) => {
          formData.dataUse.methodsResearch = value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'geneticStudiesOnly',
        toggleText: 'Genetic studies only (GSO)',
        defaultValue: formData.dataUse.geneticStudiesOnly === true,
        onChange: ({ value }) => {
          formData.dataUse.geneticStudiesOnly = value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'publicationResults',
        toggleText: 'Publication Required (PUB)',
        defaultValue: formData.dataUse.publicationResults === true,
        onChange: ({ value }) => {
          formData.dataUse.publicationResults = value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'collaboratorRequired',
        toggleText: 'Collaboration Required (COL)',
        defaultValue: formData.dataUse.collaboratorRequired === true,
        onChange: ({ value }) => {
          formData.dataUse.collaboratorRequired = value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'ethicsApprovalRequired',
        name: 'ethicsApprovalRequired',
        toggleText: 'Ethics Approval Required (IRB)',
        defaultValue: formData.dataUse.ethicsApprovalRequired === true,
        onChange: ({ value }) => {
          formData.dataUse.ethicsApprovalRequired = value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'geographicalRestrictions',
        toggleText: 'Geographic Restriction (GS-)',
        defaultValue: formData.dataUse.geographicalRestrictions === 'Yes',
        onChange: ({ value }) => {
          formData.dataUse.geographicalRestrictions = value ? 'Yes' : 'No';
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'publicationMoratorium',
        toggleText: 'Publication Moratorium (MOR)',
        defaultValue: formData.dataUse.publicationMoratorium === 'true',
        onChange: ({ value }) => {
          formData.dataUse.publicationMoratorium = value ? 'true' : 'false';
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'nonCommercialUse',
        toggleText: 'Non-profit Use Only (NPU)',
        defaultValue: formData.dataUse.commercialUse === false,
        onChange: ({ value }) => {
          formData.dataUse.commercialUse = !value;
        }
      }),
      h(FormField, {
        type: FormFieldTypes.CHECKBOX,
        id: 'otherSecondary',
        toggleText: 'Other',
        defaultValue: formData.dataUse.hasSecondaryOther,
        onChange: ({ value }) => {
          formData.dataUse.hasSecondaryOther = value;
        }
      }),
      h(FormField, {
        id: 'otherSecondaryText',
        validators: [FormValidators.REQUIRED],
        placeholder: 'Please specify',
        defaultValue: formData.dataUse.secondaryOther,
        onChange: ({ value }) => {
          formData.dataUse.secondaryOther = value;
        }
      }),
    ]),
    h2('3. Data Use Limitations'),
    h2('4. NIH Certification'),
    div({ style: { display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginRight: '30px' } }, [
      h(FormField, {
        type: FormFieldTypes.FILE,
        title: 'NIH Institutional Certification',
        description: 'If an Institutional Certification for this dataset exists, please upload it here',
        id: 'nihInstitutionalCertification',
        placeholder: 'default.txt',
      }),
    ]),
    div({ className: 'flex flex-row', style: { justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '2rem' } }, [
      button({
        className: 'button button-white',
        type: 'submit',
        onClick: submitForm,
      }, 'Submit'),
    ]),
  ]);
};

export default DatasetUpdate;
