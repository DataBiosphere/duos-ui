import React from 'react';
import {DataSet, DAR} from '../../libs/ajax';
import {FormField, FormFieldTitle, FormFieldTypes, FormValidators} from '../../components/forms/forms';
import {
  needsDsAcknowledgement,
  needsPubAcknowledgement,
  needsIrbApprovalDocument,
  needsCollaborationLetter,
  needsGsoAcknowledgement,
  newIrbDocumentExpirationDate,
} from '../../utils/darFormUtils';

const formatOntologyForSelect = (ontology) => {
  return {
    value: ontology.id,
    displayText: ontology.label,
    item: ontology,
  };
};

const formatOntologyForFormData = (ontology) => {
  return {
    id: ontology.id || ontology.item.id,
    key: ontology.id || ontology.item.id,
    value: ontology.id || ontology.item.id,
    label: ontology.label || ontology.item.label,
    item: ontology.item || ontology
  };
};

const autocompleteOntologies = (query, callback) => {
  let options = [];
  DAR.getAutoCompleteOT(query).then(
    items => {
      options = items.map(formatOntologyForSelect);
      callback(options);
    });
};

const searchDatasets = (query, callback, currentDatasets) => {
  const currentDatasetIds = currentDatasets.map((ds) => ds.dataSetId);

  DataSet.autocompleteDatasets(query).then(items => {
    const processedDatasets = items.map((ds) => {
      // We are working with two different dataset representations, a legacy dataset object and
      // a simplified auto-complete dataset object. We need to standardize the keys to ensure
      // legacy functionality is maintained.
      return {
        id: ds.id || ds.dataSetId || ds.datasetId,
        datasetId: ds.id || ds.dataSetId || ds.datasetId,
        dataSetId: ds.id || ds.dataSetId || ds.datasetId,
        identifier: ds.identifier || ds.datasetIdentifier,
        datasetIdentifier: ds.identifier || ds.datasetIdentifier,
        datasetName: ds.name || ds.datasetName,
        name: ds.name || ds.datasetName,
        ... ds
      };
    });
    let options = processedDatasets.filter((ds) => !currentDatasetIds.includes(ds.dataSetId)).map(function (item) {
      return formatSearchDataset(item);
    });
    callback(options);
  });
};

const formatSearchDataset = (ds) => {
  return {
    key: ds.dataSetId,
    value: ds.dataSetId,
    dataset: ds,
    displayText: ds.datasetIdentifier,
    label: <span>
      <span style={{fontWeight: 'bold'}}>{ds.datasetIdentifier}</span> | {ds.name}
    </span>
  };
};

export default function DataAccessRequest(props) {
  const {
    formFieldChange,
    batchFormFieldChange,
    formData,
    datasets,
    dataUseTranslations,
    uploadedIrbDocument,
    updateUploadedIrbDocument,
    uploadedCollaborationLetter,
    updateCollaborationLetter,
    setDatasets,
    validation,
    readOnlyMode,
    includeInstructions,
    formValidationChange,
    ariaLevel = 2
  } = props;

  const irbProtocolExpiration = formData.irbProtocolExpiration || newIrbDocumentExpirationDate();

  const onChange = ({key, value}) => {
    formFieldChange({key, value});
  };


  const onValidationChange = ({key, validation}) => {
    formValidationChange({key, validation});
  };

  const primaryChange = ({key, value}) => {
    let newFormData = {
      diseases: null,
      hmb: null,
      poa: null,
      methods: null,
      other: null,
    };

    // ensure that non visible fields are unselected
    for (var key0 in newFormData) {
      if (key === key0) {
        newFormData[key0] = value;
        break;
      } else {
        newFormData[key0] = false;
      }
    }

    // if, after updating, 'diseases', 'hmb', 'poa', and 'methods' are false, then 'other' is true.
    if (newFormData['diseases'] === false && newFormData['hmb'] === false && newFormData['poa'] === false && newFormData['methods'] === false) {
      newFormData['other'] = true;
    }

    batchFormFieldChange(newFormData);
  };

  return (
  // eslint-disable-next-line react/no-unknown-property
    <div datacy={'data-access-request'}>
      <div className={'dar-step-card'}>
        <FormField
          id={'datasetIds'}
          key={'datasetIds'}
          type={FormFieldTypes.SELECT}
          disabled={readOnlyMode}
          isAsync={true}
          isMulti={true}
          title={'2.1 Select Dataset(s)'}
          validators={[FormValidators.REQUIRED]}
          validation={validation.datasetIds}
          onValidationChange={onValidationChange}
          description={includeInstructions ? 'Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:' : ''}
          defaultValue={datasets?.map((ds) => formatSearchDataset(ds))}
          selectConfig={{
            // return custom html for displaying dataset options
            formatOptionLabel: (opt) => opt.label,
            // return string value of dataset for accessibility / html keys
            getOptionLabel: (opt) => opt.displayText,
          }}
          loadOptions={(query, callback) => searchDatasets(query, callback, datasets)}
          placeholder={'Dataset Name, Sample Collection ID, or PI'}
          onChange={async ({key, value}) => {
            const datasets = value.map((val) => val.dataset);
            const datasetIds = datasets?.map((ds) => ds.dataSetId);
            const fullDatasets = await DataSet.getDatasetsByIds(datasetIds);
            onChange({key, value: datasetIds});
            setDatasets(fullDatasets);
          }}
        />

        <FormField
          id={'projectTitle'}
          key={'projectTitle'}
          title={'2.2 Descriptive Title of Project'}
          disabled={readOnlyMode}
          validators={[FormValidators.REQUIRED]}
          validation={validation.projectTitle}
          description={includeInstructions ? 'Please note that coordinated requests by External Collaborators should each use the same title.' : ''}
          placeholder={'Project Title'}
          defaultValue={formData.projectTitle}
          onChange={onChange}
          onValidationChange={onValidationChange}
        />

        <div className={'dar-form-notice-card'}>
          <span>
                In sections 2.3, 2.4, and 2.5, you are attesting that your proposed research will remain with the scope of the items selected below, and will be liable for any deviations. Further, it is to your benefit to be as specific as possible in your selections, as it will maximize the data available to you.
          </span>
        </div>

        <FormField
          id={'rus'}
          key={'rus'}
          disabled={readOnlyMode}
          type={FormFieldTypes.TEXTAREA}
          title={'2.3 Research Use Statement (RUS)'}
          validators={[FormValidators.REQUIRED]}
          description={includeInstructions ? 'A RUS is a brief description of the applicant\'s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public. Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at' : ''}
          placeholder={'Please limit your RUS to 2200 characters.'}
          rows={6}
          maxLength={2200}
          ariaLevel={ariaLevel + 3}
          defaultValue={formData.rus}
          validation={validation.rus}
          onValidationChange={onValidationChange}
          onChange={onChange}
        />

        <FormField
          id={'diseases'}
          key={'diseases'}
          title={<h4>Is the primary purpose of this research to investigate a specific disease(s)?</h4>}
          disabled={readOnlyMode}
          type={FormFieldTypes.YESNORADIOGROUP}
          orientation={'horizontal'}
          defaultValue={formData.diseases}
          validation={validation.diseases}
          onValidationChange={onValidationChange}
          onChange={primaryChange}
        />

        {formData.diseases === true &&
                    <div style={{marginTop: '2.0rem', marginBottom: '1.0rem'}}></div>
        }

        {formData.diseases === false &&
                    <FormField
                      id={'ontologies'}
                      key={'ontologies'}
                      type={FormFieldTypes.SELECT}
                      disabled={readOnlyMode}
                      isMulti={true}
                      isCreatable={false}
                      isAsync={true}
                      optionsAreString={false}
                      loadOptions={autocompleteOntologies}
                      validators={[FormValidators.REQUIRED]}
                      placeholder={'Please enter one or more diseases'}
                      defaultValue={formData.ontologies.map(formatOntologyForSelect)}
                      validation={validation.ontologies}
                      onValidationChange={onValidationChange}
                      onChange={({key, value}) => onChange({key, value: value.map(formatOntologyForFormData)})}
                    />}

        {formData.diseases === false &&
                    <FormField
                      id={'hmb'}
                      key={'hmb'}
                      type={FormFieldTypes.YESNORADIOGROUP}
                      disabled={readOnlyMode}
                      title={<h4>Is the primary purpose health/medical/biomedical research in nature?</h4>}
                      orientation={'horizontal'}
                      defaultValue={formData.hmb}
                      validation={validation.hmb}
                      onValidationChange={onValidationChange}
                      onChange={primaryChange}
                    />}
        {formData.hmb === false &&
                    <FormField
                      id={'poa'}
                      key={'poa'}
                      type={FormFieldTypes.YESNORADIOGROUP}
                      disabled={readOnlyMode}
                      title={<h4>Is the primary purpose of this research regarding population origins or ancestry?</h4>}
                      orientation={'horizontal'}
                      defaultValue={formData.poa}
                      validation={validation.poa}
                      onValidationChange={onValidationChange}
                      onChange={primaryChange}
                    />}

        {formData.poa === false &&
                    <FormField
                      id={'methods'}
                      key={'methods'}
                      type={FormFieldTypes.YESNORADIOGROUP}
                      disabled={readOnlyMode}
                      title={<h4>Is the primary purpose of this research to develop or validate new methods for analyzing/interpreting data?</h4>}
                      orientation={'horizontal'}
                      defaultValue={formData.methods}
                      validation={validation.methods}
                      onValidationChange={onValidationChange}
                      onChange={primaryChange}
                    />
        }

        {formData.methods === false &&
                    <FormField
                      id={'otherText'}
                      key={'otherText'}
                      disabled={readOnlyMode}
                      title={<h4>If none of the above, please describe the primary purpose of your research:</h4>}
                      orientation={'horizontal'}
                      placeholder={'Please specify...'}
                      defaultValue={formData.other}
                      validation={validation.other}
                      onValidationChange={onValidationChange}
                      onChange={primaryChange}/>
        }

        <FormField
          id={'nonTechRus'}
          key={'nonTechRus'}
          disabled={readOnlyMode}
          type={FormFieldTypes.TEXTAREA}
          title={'2.4 Non-Technical Summary'}
          validators={[FormValidators.REQUIRED]}
          description={includeInstructions ? 'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).' : ''}
          placeholder={'Please limit your your non-technical summary to 1100 characters'}
          rows={6}
          maxLength={1100}
          ariaLevel={ariaLevel + 3}
          defaultValue={formData.nonTechRus}
          validation={validation.nonTechRus}
          onValidationChange={onValidationChange}
          onChange={onChange}
        />

        {(needsGsoAcknowledgement(datasets) || needsDsAcknowledgement(dataUseTranslations) || needsPubAcknowledgement(datasets)) &&
            <FormFieldTitle
              id={'dataUseAcknowledgements'}
              key={'dataUseAcknowledgements'}
              title={'2.5 Data Use Acknowledgements'}
              description={includeInstructions ? 'Please confirm listed acknowledgements and/or document requirements below:' : ''}
            />
        }

        {needsGsoAcknowledgement(datasets) &&
            <FormField
              id={'gsoAcknowledgement'}
              key={'gsoAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that I have selected a dataset limited to use on genetic studies only (GSO). I attest that I will respect this data use condition.'}
              defaultValue={formData.gsoAcknowledgement}
              onChange={onChange}
              validation={validation.gsoAcknowledgement}
              onValidationChange={onValidationChange}
            />
        }

        {needsPubAcknowledgement(datasets) &&
            <FormField
              id={'pubAcknowledgement'}
              key={'pubAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that I have selected a dataset which requires results of studies using the data to be made available to the larger scientific community (PUB). I attest that I will respect this data use condition.'}
              defaultValue={formData.pubAcknowledgement}
              validation={validation.pubAcknowledgement}
              onValidationChange={onValidationChange}
              onChange={onChange}
            />
        }

        {needsDsAcknowledgement(dataUseTranslations) &&
            <FormField
              id={'dsAcknowledgement'}
              key={'dsAcknowledgement'}
              disabled={readOnlyMode}
              type={FormFieldTypes.CHECKBOX}
              toggleText={'I acknowledge that the dataset can only be used in research consistent with the Data Use Limitations (DULs) and cannot be combined with other datasets of other phenotypes. Research uses inconsistent with DUL are considered a violation of the Data Use Certification agreement and any additional terms descried in the addendum'}
              defaultValue={formData.dsAcknowledgement}
              validation={validation.dsAcknowledgement}
              onValidationChange={onValidationChange}
              onChange={onChange}
            />
        }

        {needsIrbApprovalDocument(datasets) &&
                    <FormFieldTitle
                      key={'irbApprovalDocument'}
                      description={includeInstructions ? 'One or more of the datasets you selected requires local IRB approval for use. Please upload your local IRB approval(s) here as a single document. When IRB approval is required and Expedited of Full Review is required, it must be completed annually. Determinations of Not Human Subjects Research (NHSR) by IRBs will not be accepted as IRB approval.' : ''}
                    />
        }
        {needsIrbApprovalDocument(datasets) &&
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <FormField
                        key={'irbDocument'}
                        type={FormFieldTypes.FILE}
                        disabled={readOnlyMode}
                        id={'irbDocument'}
                        defaultValue={uploadedIrbDocument || {
                          name: formData.irbDocumentName,
                        }}
                        validation={validation.irbDocument}
                        onValidationChange={onValidationChange}
                        onChange={({value}) => updateUploadedIrbDocument(value, irbProtocolExpiration)}
                      />
                      <FormField
                        key={'irbProtocolExpiration'}
                        readOnly={true}
                        id={'irbProtocolExpiration'}
                        defaultValue={`IRB Expires on ${irbProtocolExpiration}`}
                      />
                    </div>
        }

        {needsCollaborationLetter(datasets) &&
                    <FormField
                      type={FormFieldTypes.FILE}
                      disabled={readOnlyMode}
                      defaultValue={uploadedCollaborationLetter || {
                        name: formData.collaborationLetterName,
                      }}
                      id={'collaborationLetter'}
                      validation={validation.collaborationLetter}
                      onValidationChange={onValidationChange}
                      description={'One or more of the datasets you selected requires collaboration (COL) with the primary study investigators(s) for use. Please upload documentation of your collaboration here.'}
                      onChange={({value}) => updateCollaborationLetter(value)}
                    />
        }

      </div>
    </div>

  );
}
