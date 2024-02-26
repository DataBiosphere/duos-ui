import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { find, isNil } from 'lodash/fp';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { DAC, DAR, DataSet } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';

export const DatasetUpdate = (props) => {
  const { dataset, history } = props;

  const [formData, setFormData] = useState({ dac: {}, dataUse: {}, properties: {} });

  const searchOntologies = async (query, callback) => {
    let options = [];
    await DAR.getAutoCompleteOT(query).then(
      items => {
        options = items.map((item) => {
          return item.label;
        });
        callback(options);
      });
  };

  const dacOptions = (dacs) => {
    let options = [];
    if (!isNil(dacs)) {
      options = dacs.map((dac) => {
        return { displayText: dac.name, dacId: dac.dacId };
      });
    }
    return options;
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
    const nihFileData = submitData.get('nihInstitutionalCertificationFile');
    const consentGroups = [{ nihInstitutionalCertificationFile: nihFileData }];

    const newDataset = {
      name: formData.properties.datasetName,
      dacId: formData.dac.dacId,
      properties: [
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

    const multiPartFormData = new FormData();
    multiPartFormData.append('dataset', JSON.stringify(newDataset));
    multiPartFormData.append('consentGroups', consentGroups);

    DataSet.updateDatasetV3(dataset.dataSetId, multiPartFormData).then(() => {
      history.push('/dataset_catalog');
      Notifications.showSuccess({ text: 'Update submitted successfully!' });
    }, () => {
      Notifications.showError({ text: 'Some errors occurred, the dataset was not updated.' });
    });
  };

  const prefillFormData = useCallback(async (dataset) => {
    const dac = await DAC.get(dataset?.dacId);
    const dacs = await DAC.list();
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
      dac: { ...dac, dacs }
    });
  }, [extract, normalizeDataUse]);

  useEffect(() => {
    if (isNil(formData.datasetName)) {
      prefillFormData(dataset);
    }
  }, [prefillFormData, dataset, formData]);

  return (
    <div className='data-update-section'>
      <h2>1. Dataset Information</h2>
      <FormField
        id="datasetName"
        title="Dataset Name"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.datasetName}
        onChange={({ value }) => {
          formData.properties.datasetName = value;
        }}
      />
      <FormField
        id="description"
        title="Dataset Description"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.description}
        onChange={({ value }) => {
          formData.properties.description = value;
        }}
      />
      <FormField
        id="dataDepositor"
        title="Data Custodian"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.dataDepositor}
        onChange={({ value }) => {
          formData.properties.dataDepositor = value;
        }}
      />
      <FormField
        id="principalInvestigator"
        title="Principal Investigator (PI)"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.principalInvestigator}
        onChange={({ value }) => {
          formData.properties.principalInvestigator = value;
        }}
      />
      <FormField
        id="dbGap"
        title="Dataset Repository URL"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.dbGap}
        onChange={({ value }) => {
          formData.properties.dbGap = value;
        }}
      />
      <FormField
        id="dataType"
        title="Data Type"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.dataType}
        onChange={({ value }) => {
          formData.properties.dataType = value;
        }}
      />
      <FormField
        id="species"
        title="Species"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.species}
        onChange={({ value }) => {
          formData.properties.species = value;
        }}
      />
      <FormField
        id="phenotype"
        title="Phenotype/Indication"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.phenotype}
        onChange={({ value }) => {
          formData.properties.phenotype = value;
        }}
      />
      <FormField
        id="nrParticipants"
        title="# of Participants"
        type={FormFieldTypes.NUMBER}
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.nrParticipants}
        onChange={({ value }) => {
          formData.properties.nrParticipants = value;
        }}
      />
      <FormField
        id="dac"
        title="Data Access Committee"
        validators={[FormValidators.REQUIRED]}
        type={FormFieldTypes.SELECT}
        selectOptions={dacOptions(formData.dac.dacs)}
        defaultValue={[
          { displayText: formData.dac.name, dacId: formData.dac.dacId },
        ]}
        disabled={true}
      />
      <h2>2. Data Use Terms</h2>
      {/* readonly primary */}
      <div>
        <FormField
          title="Primary Data Use Terms*"
          description="Please select one of the following data use permissions for your dataset"
          type={FormFieldTypes.RADIOBUTTON}
          id="generalUse"
          toggleText="General Research Use"
          value="generalUse"
          defaultValue={formData.dataUse.generalUse === true ? 'generalUse' : undefined}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="hmbResearch"
          toggleText="Health/Medical/Biomedical Research Use"
          value="hmbResearch"
          defaultValue={formData.dataUse.hmbResearch === true ? 'hmbResearch' : undefined}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="diseaseRestrictions"
          toggleText="Disease-Specific Research Use"
          value="diseaseRestrictions"
          defaultValue={Array.isArray(formData.dataUse.diseaseRestrictions) && formData.dataUse.diseaseRestrictions.length > 0 ? 'diseaseRestrictions' : undefined}
          disabled={true}
        />
        <div style={{ marginBottom: '1.0rem' }}>
          <FormField
            type={FormFieldTypes.SELECT}
            isMulti={true}
            isCreatable={true}
            optionsAreString={true}
            isAsync={true}
            id="diseaseRestrictionsText"
            validators={[FormValidators.REQUIRED]}
            placeholder="none"
            loadOptions={searchOntologies}
            defaultValue={formData.dataUse.diseaseLabels}
            disabled={true}
          />
        </div>
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="otherPrimary"
          toggleText="Other"
          value="otherPrimary"
          defaultValue={formData.dataUse.otherRestrictions ? 'otherPrimary' : undefined}
          disabled={true}
        />
        <FormField
          id="otherPrimaryText"
          validators={[FormValidators.REQUIRED]}
          placeholder="none"
          defaultValue={formData.dataUse.other}
          disabled={true}
        />
      </div>
      {/* secondary */}
      <div>
        <FormField
          title="Secondary Data Use Terms"
          description="Please select all applicable data use parameters."
          type={FormFieldTypes.CHECKBOX}
          id="methodsResearch"
          toggleText="No methods development or validation studies (NMDS)"
          defaultValue={formData.dataUse.methodsResearch === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="geneticStudiesOnly"
          toggleText="Genetic studies only (GSO)"
          defaultValue={formData.dataUse.geneticStudiesOnly === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="publicationResults"
          toggleText="Publication Required (PUB)"
          defaultValue={formData.dataUse.publicationResults === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="collaboratorRequired"
          toggleText="Collaboration Required (COL)"
          defaultValue={formData.dataUse.collaboratorRequired === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="ethicsApprovalRequired"
          name="ethicsApprovalRequired"
          toggleText="Ethics Approval Required (IRB)"
          defaultValue={formData.dataUse.ethicsApprovalRequired === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="geographicalRestrictions"
          toggleText="Geographic Restriction (GS-)"
          defaultValue={formData.dataUse.geographicalRestrictions === 'Yes'}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="publicationMoratorium"
          toggleText="Publication Moratorium (MOR)"
          defaultValue={formData.dataUse.publicationMoratorium === 'true'}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="nonCommercialUse"
          toggleText="Non-profit Use Only (NPU)"
          defaultValue={formData.dataUse.commercialUse === false}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="otherSecondary"
          toggleText="Other"
          defaultValue={formData.dataUse.hasSecondaryOther}
          disabled={true}
        />
        <FormField
          id="otherSecondaryText"
          validators={[FormValidators.REQUIRED]}
          placeholder="Please specify"
          defaultValue={formData.dataUse.secondaryOther}
          disabled={true}
        />
      </div>
      <h2>3. NIH Certification</h2>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginRight: '30px' }}>
        <FormField
          type={FormFieldTypes.FILE}
          title="NIH Institutional Certification"
          description="If an Institutional Certification for this dataset exists, please upload it here"
          id="nihInstitutionalCertificationFile"
          placeholder="default.txt"
        />
      </div>
      <div className="flex flex-row" style={{ justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '2rem' }}>
        <button className="button button-white" type="submit" onClick={submitForm}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default DatasetUpdate;
