import React from 'react';
import {DataSet} from '../../libs/ajax/DataSet';
import {DAR} from '../../libs/ajax/DAR';
import {FormField, FormFieldTitle, FormFieldTypes, FormValidators} from '../../components/forms/forms';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import {
  needsIrbApprovalDocument,
  needsCollaborationLetter,
  newIrbDocumentExpirationDate,
} from '../../utils/darFormUtils';
import SelectableDatasets from './SelectableDatasets';
import {DAAUtils} from '../../utils/DAAUtils';
import {DuosDatePicker} from '../../components/DuosDatePicker.js';
import {DataUseAcknowledgements} from 'src/pages/dar_application/DataUseAcknowlegements.js';
import {DownloadLink} from '../../components/DownloadLink';

const titleStyle = { fontSize: '24px', fontWeight: 500, color: '#333333' };
const noTopMarginStyle = { marginTop: '0', paddingTop: '0' };

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
  const currentDatasetIds = currentDatasets.map((ds) => ds.datasetId);

  DataSet.autocompleteDatasets(query).then(items => {
    const processedDatasets = items.map((ds) => {
      // We are working with two different dataset representations, a legacy dataset object and
      // a simplified auto-complete dataset object. We need to standardize the keys to ensure
      // legacy functionality is maintained.
      return {
        id: ds.id || ds.datasetId,
        datasetId: ds.id || ds.datasetId,
        identifier: ds.identifier || ds.datasetIdentifier,
        datasetIdentifier: ds.identifier || ds.datasetIdentifier,
        datasetName: ds.name || ds.datasetName,
        name: ds.name || ds.datasetName,
        ... ds
      };
    });
    const options = processedDatasets.filter((ds) => !currentDatasetIds.includes(ds.datasetId)).map(function (item) {
      return formatSearchDataset(item);
    });
    callback(options);
  });
};

const formatSearchDataset = (ds) => {
  return {
    key: ds.datasetId,
    value: ds.datasetId,
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
    setSelectedDatasets,
    validation,
    readOnlyMode,
    includeInstructions,
    formValidationChange,
    ariaLevel = 2,
    referenceId,
    _draftDar
  } = props;

  const irbProtocolExpiration = formData.irbProtocolExpiration || newIrbDocumentExpirationDate();

  // i need to figure out a way to only actually remove them without using onChange
  const onChange = ({key, value}) => {
    formFieldChange({key, value});
  };

  const onValidationChange = ({key, validation}) => {
    formValidationChange({key, validation});
  };

  const primaryChange = ({key, value}) => {
    const newFormData = {
      diseases: null,
      hmb: null,
      poa: null,
      methods: null,
      other: null,
    };

    // ensure that non visible fields are unselected
    for (const key0 in newFormData) {
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
      <div className={readOnlyMode ? 'dar-accordion-step-card' : 'dar-step-card'}>

        {DAAUtils.isEnabled() ?
          <div>
            <label style={{ ...titleStyle, display: 'block', marginBottom: '0.5rem' }} className="control-label">2.1 Select Dataset(s)</label>
            <p style={{ marginBottom: '1rem' }}>Currently selected datasets:</p>
            <SelectableDatasets
              disabled={readOnlyMode}
              datasets={datasets}
              setSelectedDatasets={setSelectedDatasets}
            />
          </div> :
          <FormField
            id={'datasetIds'}
            key={'datasetIds'}
            type={FormFieldTypes.SELECT}
            disabled={readOnlyMode}
            isAsync={true}
            isMulti={true}
            title={'2.1 Select Dataset(s)'}
            titleStyle={readOnlyMode ? {...titleStyle, ...noTopMarginStyle} : titleStyle}
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
              const datasetIds = datasets?.map((ds) => ds.datasetId);
              const fullDatasets = await DataSet.getDatasetsByIds(datasetIds);
              onChange({key, value: datasetIds});
              setDatasets(fullDatasets);
            }}
          />
        }

        <FormField
          id={'projectTitle'}
          key={'projectTitle'}
          title={'2.2 Descriptive Title of Project'}
          titleStyle={titleStyle}
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
          titleStyle={titleStyle}
          validators={[FormValidators.REQUIRED]}
          description={
            <>
              <p>
                A RUS is a brief description of the applicant&apos;s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.
                <span>
                   Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them.
                </span>
              </p>
            </>
          }
          placeholder={`Please limit your RUS to ${FORM_TEXT_AREA_MAX_LENGTH} characters.`}
          rows={6}
          maxLength={FORM_TEXT_AREA_MAX_LENGTH}
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
                    <div style={{marginTop: '2.0rem', marginBottom: '1.0rem'}}>
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
                      />
                    </div>
        }

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
                      placeholder={'Please specify...'}
                      defaultValue={formData.otherText}
                      validation={validation.otherText}
                      onValidationChange={onValidationChange}
                      onChange={onChange}/>
        }

        <FormField
          id={'nonTechRus'}
          key={'nonTechRus'}
          disabled={readOnlyMode}
          type={FormFieldTypes.TEXTAREA}
          title={'2.4 Non-Technical Summary'}
          titleStyle={titleStyle}
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

        <DataUseAcknowledgements
          title={'2.5 Data Use Acknowledgements'}
          datasets={datasets}
          dataUseTranslations={dataUseTranslations}
          formData={formData}
          readOnlyMode={readOnlyMode}
          onChange={onChange}
          onValidationChange={onValidationChange}
          validation={validation}
          />

        {needsIrbApprovalDocument(datasets) &&
                    <FormFieldTitle
                      key={'irbApprovalDocument'}
                      description={'One or more of the datasets you selected requires local IRB approval for use. Please upload your local IRB approval(s) here as a single document. When IRB approval is required and Expedited of Full Review is required, it must be completed annually. Determinations of Not Human Subjects Research (NHSR) by IRBs will not be accepted as IRB approval.'}
                    />
        }
        {needsIrbApprovalDocument(datasets) &&
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
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
                        {readOnlyMode && formData.irbDocumentName && formData.irbDocumentLocation && referenceId && (
                          <div style={{ marginTop: '10px' }}>
                            <DownloadLink
                              label="Download IRB Document"
                              onDownload={() => {
                                DAR.downloadDARDocument(referenceId, 'irbDocument', formData.irbDocumentName);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div style={{marginTop: 12}}>Expiration Date:</div>
                      <DuosDatePicker
                        readOnly={readOnlyMode}
                        id={'irbProtocolExpiration'}
                        defaultValue={irbProtocolExpiration}
                        onChange={(value) => {
                          onChange({key: 'irbProtocolExpiration', value});
                        }}
                      />
                    </div>
        }

        {needsCollaborationLetter(datasets) &&
                    <FormField
                      type={FormFieldTypes.FILE}
                      readOnly={readOnlyMode}
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
