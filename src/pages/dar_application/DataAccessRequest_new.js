import { a, div, h, h4, span, p } from 'react-hyperscript-helpers';
import { DataSet, DAR } from '../../libs/ajax';
import { FormField, FormFieldTitle, FormFieldTypes, FormValidators } from '../../components/forms/forms';
import {
  needsDsAcknowledgement,
  needsPubAcknowledgement,
  needsIrbApprovalDocument,
  needsCollaborationLetter,
  needsGsoAcknowledgement,
  newIrbDocumentExpirationDate,
} from '../../libs/darFormUtils';

const searchOntologies = (query, callback) => {
  let options = [];
  DAR.getAutoCompleteOT(query).then(
    items => {
      options = items.map(function(item) {
        return {
          value: item.id,
          displayText: item.label,
        };
      });
      callback(options);
    });
};

const searchDatasets = (query, callback, currentDatasets) => {
  const currentDatasetIds = currentDatasets.map((ds) => ds.dataSetId);

  DataSet.searchDatasets(query).then(items => {
    let options = items.filter((ds) => !currentDatasetIds.includes(ds.dataSetId)).map(function (item) {
      return formatSearchDataset(item);
    });
    callback(options);
  });
};

const formatSearchDataset = (ds) => {
  return {
    key: ds.dataSetId.toString(),
    value: ds.dataSetId,
    dataset: ds,
    displayText: ds.datasetIdentifier,
    label: span({}, [
      span({style: {fontWeight: 'bold'}}, [ds.datasetIdentifier]), ' | ', ds.name]),
  };
};

export default function DataAccessRequest(props) {
  const {
    formFieldChange,
    batchFormFieldChange,
    formData,
    datasets,
    dataUseTranslations,
    updateUploadedIrbDocument,
    updateCollaborationLetter,
    setDatasets,
    ariaLevel = 2
  } = props;

  const irbProtocolExpiration = formData.irbProtocolExpiration || newIrbDocumentExpirationDate();

  const onChange = ({key, value}) => {
    formFieldChange({key, value});
  };

  const primaryChange = ({key, value}) => {
    if (key === 'diseases' && value === true) {
      // in this case, reset all fields.
      batchFormFieldChange({
        diseases: true,
        hmb: false,
        poa: false,
        other: false,
      });
      return;
    }


    const newFormData = {
      ...formData,
      ...{
        [key]: value,
      },
    };

    // if, after updating, 'hmb', 'diseases', and 'poa' are false, then 'other' is true.
    if (newFormData['hmb'] === false && newFormData['diseases'] === false && newFormData['poa'] === false) {
      batchFormFieldChange({
        [key]: value,
        other: true,
      });
      return;
    }

    formFieldChange({key, value});
  };

  return (
    div({ datacy: 'data-access-request' }, [
      div({ className: 'dar-step-card' }, [
        // dataset searchbar:
        // async select with custom inner render
        // to look like the mock

        h(FormField, {
          type: FormFieldTypes.SELECT,
          id: 'datasetIds',
          isAsync: true,
          isMulti: true,
          title: '2.1 Select Dataset(s)',
          validators: [FormValidators.REQUIRED],
          description: 'Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:',
          defaultValue: datasets?.map((ds) => formatSearchDataset(ds)),
          selectConfig: {
            // return custom html for displaying
            // dataset options
            formatOptionLabel: (opt) => opt.label,
            // return string value of dataset
            // for accessibility / html keys
            getOptionLabel: (opt) => opt.displayText,
          },
          loadOptions: (query, callback) => searchDatasets(query, callback, datasets),
          placeholder: 'Dataset Name, Sample Collection ID, or PI',
          onChange: ({key, value}) => {
            const datasets = value.map((val) => val.dataset);
            onChange({key, value: datasets?.map((ds) => ds.dataSetId)});
            setDatasets(datasets);
          },
        }),

        h(FormField, {
          title: '2.2 Descriptive Title of Project',
          validators: [FormValidators.REQUIRED],
          description: 'Please note that coordinated requests by collaborating institutions should each use the same title.',
          id: 'projectTitle',
          placeholder: 'Project Title',
          defaultValue: formData.projectTitle,
          onChange,
        }),

        div({
          className: 'dar-form-notice-card',
        }, [
          span({}, [
            'In sections 2.3, 2.4, and 2.5, you are attesting that your proposed research will remain with the scope of the items selected below, and will be liable for any deviations. Further, it is to your benefit to be as specific as possible in your selections, as it will maximize the data available to you.'
          ])
        ]),

        h(FormField, {
          id: 'rus',
          type: FormFieldTypes.TEXTAREA,
          title: '2.3 Research Use Statement (RUS)',
          validators: [FormValidators.REQUIRED],
          description: p({}, [
            'A RUS is a brief description of the applicant\'s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.',
            span({},
              ['Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ',
                a({

                }, 'here'),
                '.'
              ]),
          ]),
          placeholder: 'Please limit your RUS to 2200 characters.',
          rows: 6,
          maxLength: 2200,
          ariaLevel: ariaLevel + 3,
          defaultValue: formData.rus,
          onChange,
        }),

        h(FormField, {
          title: h4({}, 'Is the primary purpose of this research to investigate a specific disease(s)?'),
          id: 'diseases',
          type: FormFieldTypes.YESNORADIOGROUP,
          orientation: 'horizontal',
          defaultValue: formData.diseases,
          onChange: primaryChange,
        }),

        div({
          isRendered: formData.diseases === true,
          style: {
            marginTop: '2.0rem',
            marginBottom: '1.0rem'
          }
        }, [
          h(FormField, {
            type: FormFieldTypes.SELECT,
            isMulti: true,
            isCreatable: true,
            isAsync: true,
            optionsAreString: false,
            loadOptions: searchOntologies,
            id: 'ontologies',
            validators: [FormValidators.REQUIRED],
            placeholder: 'Please enter one or more diseases',
            defaultValue: formData.ontologies,
            onChange: ({key, value}) => onChange({key, value: value.map(v => v.value)}),
          }),
        ]),

        div({
          isRendered: formData.diseases === false,
          style: {
            marginBottom: '1.0rem',
          }
        }, [
          h(FormField, {
            type: FormFieldTypes.YESNORADIOGROUP,
            title: h4({}, 'Is the primary purpose health/medical/biomedical research in nature?'),
            id: 'hmb',
            defaultValue: formData.hmb,
            onChange: primaryChange,
          }),

          h(FormField, {
            type: FormFieldTypes.YESNORADIOGROUP,
            title: h4({}, 'Is the primary purpose of this research regarding population origins or ancestry?'),
            id: 'poa',
            defaultValue: formData.poa,
            onChange: primaryChange,
          }),

          div({
            isRendered: formData.poa === false && formData.hmb === false,
          }, [
            h(FormField, {
              title: h4({}, 'If none of the above, please describe the primary purpose of your research:'),
              id: 'otherText',
              placeholder: 'Please specify...',
              defaultValue: formData.otherText,
              onChange,
            }),
          ]),
        ]),


        h(FormField, {
          id: 'nonTechRus',
          type: FormFieldTypes.TEXTAREA,
          title: '2.4 Non-Technical Summary',
          validators: [FormValidators.REQUIRED],
          description: 'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).',
          placeholder: 'Please limit your your non-technical summary to 1100 characters',
          rows: 6,
          maxLength: 1100,
          ariaLevel: ariaLevel + 3,
          defaultValue: formData.nonTechRus,
          onChange,
        }),

        h(FormFieldTitle, {
          title: '2.5 Data Use Acknowledgements',
          description: 'Please confirm listed acknowledgements and/or document requirements below:',
          isRendered: needsGsoAcknowledgement(datasets) || needsDsAcknowledgement(dataUseTranslations) || needsPubAcknowledgement(datasets),
        }),

        h(FormField, {
          id: 'gsoAcknowledgement',
          type: FormFieldTypes.CHECKBOX,
          isRendered: needsGsoAcknowledgement(datasets),
          toggleText: 'I acknowledge that I have selected a dataset limited to use on genetic studies only (GSO). I attest that I will respect this data use condition.',
          defaultValue: formData.gsoAcknowledgement,
          onChange,
        }),

        h(FormField, {
          id: 'pubAcknowledgement',
          isRendered: needsPubAcknowledgement(datasets),
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'I acknowledge that I have selected a dataset which requires results of studies using the data to be made available to the larger scientific community (PUB). I attest that I will respect this data use condition.',
          defaultValue: formData.pubAcknowledgement,
          onChange,
        }),

        h(FormField, {
          id: 'dsAckowledgement',
          isRendered: needsDsAcknowledgement(dataUseTranslations),
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'I acknowledge that the dataset can only be used in research consistent with the Data Use Limitations (DULs) and cannot be combined with other datasets of other phenotypes. Research uses inconsistent with DUL are considered a violation of the Data Use Certification agreement and any additional terms descried in the addendum',
          defaultValue: formData.dsAckowledgement,
          onChange,
        }),


        h(FormFieldTitle, {
          description: 'One or more of the datasets you selected requires local IRB approval for use. Please upload your local IRB approval(s) here as a single document. When IRB approval is required and Expedited of Full Review is required, it must be completed annually. Determinations of Not Human Subjects Research (NHSR) by IRBs will not be accepted as IRB approval.',
          isRendered: needsIrbApprovalDocument(datasets),
        }),
        div({
          isRendered: needsIrbApprovalDocument(datasets),
          style: {
            display: 'flex',
            justifyContent: 'space-between',
          }
        }, [
          div({}, [
            h(FormField, {
              type: FormFieldTypes.FILE,
              id: 'irbDocument',
              defaultValue: {
                name: formData.irbDocumentName,
              },
              onChange: ({value}) => updateUploadedIrbDocument(value, irbProtocolExpiration),
            }),
          ]),

          div({
            style: {
              width: '250px',
            }
          }, [
            h(FormField, {
              readOnly: true,
              id: 'irbProtocolExpiration',
              defaultValue: `IRB Expires on ${irbProtocolExpiration}`,
            }),
          ]),
        ]),

        h(FormField, {
          type: FormFieldTypes.FILE,
          isRendered: needsCollaborationLetter(datasets),
          defaultValue: {
            name: formData.collaborationLetterName,
          },
          id: 'collaborationLetter',
          description: 'One or more of the datasets you selected requires collaboration (COL) with the primary study investigators(s) for use. Please upload documentation of your collaboration here.',
          onChange: ({value}) => updateCollaborationLetter(value),
        }),
      ]),
    ])
  );
}
