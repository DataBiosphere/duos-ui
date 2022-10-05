import { useState, useEffect} from 'react';
import { a, br, div, fieldset, h, h4, h3, input, label, span, textarea, p } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import forEach from 'lodash/fp/forEach';
import includes from 'lodash/fp/includes';
import cloneDeep from 'lodash/fp/cloneDeep';
import isEqual from 'lodash/fp/isEqual';
import every from 'lodash/fp/every';
import any from 'lodash/fp/some';
import { DAR } from '../../libs/ajax';
import AsyncSelect from 'react-select/async';
import UploadLabelButton from '../../components/UploadLabelButton';
import { isFileEmpty } from '../../libs/utils';
import { FormField, FormFieldTypes, FormValidators } from '../../components/forms/forms';

const uploadFileDiv = (showValidationMessages, uploadedFile, currentDocumentLocation) => {
  return {
    padding: '1rem',
    backgroundColor: showValidationMessages && (isFileEmpty(uploadedFile) && isEmpty(currentDocumentLocation)) ? errorBackgroundColor : 'inherit'
  };
};

const dulQuestionDiv = (showValidationMessages, questionBool) => {
  return {
    backgroundColor: showValidationMessages && !questionBool ?
      errorBackgroundColor : 'inherit',
    padding: '1rem',
    margin: '0.5rem 0'
  };
};

const uploadFileDescription = {
  paddingBottom: '1.5rem'
};

const errorBackgroundColor = 'rgba(243, 73, 73, 0.19)';

//NOTE: need to change props to account for file locations for previous uploaded file
export default function DataAccessRequest(props) {
  const {
    darCode,
    initializeDatasets, //method used to assign dataUse to pre-assgined datasets in the application
    onDatasetsChange,
    showValidationMessages,
    formFieldChange,
    isTypeOfResearchInvalid,
    TypeOfResearch,
    nextPage,
    prevPage,
    partialSave,
    irbDocumentLocation,
    irbDocumentName,
    collaborationLetterLocation,
    collaborationLetterName,
    uploadedIrbDocument,
    uploadedCollaborationLetter,
    changeDARDocument,
    referenceId,
    ariaLevel = 2
  } = props;

  const [projectTitle, setProjectTitle] = useState(props.projectTitle);
  const [methods, setMethods] = useState(props.methods);
  const [controls, setControls] = useState(props.controls);
  const [population, setPopulation] = useState(props.population);
  const [rus, setRus] = useState(props.rus);
  const [nonTechRus, setNonTechRus] = useState(props.nonTechRus);
  const [datasets, setDatasets] = useState(props.datasets || []);
  const [activeDULQuestions, setActiveDULQuestions] = useState({});
  //parent needs to initialize defaults if value not present
  const [gsoAcknowledgement, setGSOAcknowledgement] = useState(props.gsoAcknowledgement || false);
  const [pubAcknowledgement, setPUBAcknowledgement] = useState(props.pubAcknowledgement || false);
  const [dsAcknowledgement, setDSAcknowledgement] = useState(props.dsAcknowledgement || false);

  const onChange = ({key, value}) => {
    formFieldChange({name: key, value});
  }

  const formatSearchDataset = (ds) => {
    return {
      key: ds.key,
      value: ds.value,
      displayText: ds.label
    }
  }

  const searchDatasets = (query, callback) => {
    DAR.getAutoCompleteDS(query).then(items => {
      let options = items.map(function (item) {
        return formatSearchDataset(item);
      });
      callback(options);
    });
  };

  //function needed to update state for checkboxes
  const checkedStateChange = (dataset, setter) => {
    const { value } = dataset;
    setter(value);
    formFieldChange(dataset);
  };

  const calculateDSTally = (diseaseRestrictions, ontologyTally) => {
    forEach((diseaseLink) => {
      if(!ontologyTally[diseaseLink]) {
        ontologyTally[diseaseLink] = 0;
      }
      ontologyTally[diseaseLink]++;
    })(diseaseRestrictions);
  };

  //initialization hook, loads data from props
  useEffect(() => {
    setProjectTitle(props.projectTitle);
    setRus(props.rus);
    setNonTechRus(props.nonTechRus);
    setDatasets(props.datasets); //initialization of datasets from props
  }, [props.rus, props.nonTechRus, props.projectTitle, props.datasets]);

  //seperate hook for datasets once state is assigned value from props
  //used for updates as users add/remove items from AsyncSelect
  useEffect(() => {
    const uncappedForEach = forEach.convert({cap:false});

    const calculateRestrictionEquivalency = (datasetCollection) => {
      const targetDULKeys = ['ethicsApprovalRequired', 'collaboratorRequired', 'publicationResults', 'diseaseRestrictions', 'geneticStudiesOnly'];
      let updatedDULQuestions = {};
      let ontologyTally = {};
      if (!isNil(datasetCollection)) {
        const collectionLength = datasetCollection.length;
        datasetCollection.forEach(dataset => {
          const dataUse = dataset.dataUse;
          if (!isNil(dataUse) && !isEmpty(dataUse)) {
            uncappedForEach((value, key) => {
              if(includes(key, targetDULKeys)) {
                if (key === 'diseaseRestrictions' && collectionLength > 1) {
                  //process DS attributes seperately due to unique attributes
                  calculateDSTally(value, ontologyTally);
                } else {
                  //otherwise check value. If true, update with value, otherwise defer to current status on updatedDULQuestions
                  updatedDULQuestions[key] = value || updatedDULQuestions[key];
                }
              }
            })(dataUse);
          }
        });

        if(Object.keys(ontologyTally).length > 0) {
          updatedDULQuestions['diseaseRestrictions'] = !every((count) => {
            return count === collectionLength && count > 0;
          })(ontologyTally);
        } else {
          //ds rendering logic is compromised with submitted dars due to datasets being split into groups of one
          //therefore dsAcknowledgement is maintained in order to ensure conditional rendering on that value
          //Example: if dsAcknowledgement is true, question should be rendered
          //if false, question should not be rendered since
          //  1) if ds question is active, statement needs to be marked true for submission (false would not be a valid answer)
          //  2) if ds question is inactive, false value will indicate that the question should not be rendered. (True would not be a valid answer)
          updatedDULQuestions['diseaseRestrictions'] = false;
        }
      }

      if(!isEqual(updatedDULQuestions, activeDULQuestions)) {
        setActiveDULQuestions(updatedDULQuestions);
        //integrity checks/actions only occur on drafts
        if(isEmpty(darCode)) {
          //maintain dsAcknowledgement integrity when question is no longer active
          if(!updatedDULQuestions['diseaseRestrictions']) {
            setDSAcknowledgement(false);
            formFieldChange({name: 'dsAcknowledgement', value: false});
          }
          //clear document files if associated question is inactive
          //active clearing allows submitted DAR to control document rendering confidently when referencing these variables
          if(!updatedDULQuestions['ethicsApprovalRequired']) {
            formFieldChange({name: 'irbDocumentName', value: ''});
            formFieldChange({name: 'irbDocumentLocation', value: ''});
          }
          if(!updatedDULQuestions['collaboratorRequired']) {
            formFieldChange({name: 'collaborationLetterName', value: ''});
            formFieldChange({name: 'collaborationLetterLocation', value: ''});
          }
        }
        //State update is asynchronous, send updatedDULQuestions for parent component
        formFieldChange({name: 'activeDULQuestions', value: updatedDULQuestions});
      }
    };

    const updateDatasetsAndDULQuestions = async(rawDatasetCollection) => {
      const clonedDatasets = cloneDeep(rawDatasetCollection);
      if (!every((dataset) => !isNil(dataset.dataUse) || !isEmpty(dataset.dataUse), rawDatasetCollection)) {
        const updatedDatasets = await initializeDatasets(clonedDatasets);
        setDatasets(updatedDatasets);
        calculateRestrictionEquivalency(updatedDatasets);
      } else {
        calculateRestrictionEquivalency(clonedDatasets);
      }
    };

    updateDatasetsAndDULQuestions(datasets);
  }, [datasets, initializeDatasets, activeDULQuestions, formFieldChange, darCode]);

  const renderDULQuestions = (darCode) => {
    let renderBool = !(isNil(activeDULQuestions) && isEmpty(activeDULQuestions)) && any(value => value === true)(activeDULQuestions);

    if(!isEmpty(darCode)) {
      //for submitted dars dsAcknowledgement is not processed properly due to dataset split, therefore you need to check dsAcknowledgement directly
      renderBool = renderBool || (dsAcknowledgement === true);
    }
    return renderBool;
  };

  return (
    div({ datacy: 'data-access-request' }, [
      div({ className: 'dar-step-card' }, [
        // dataset searchbar:
        // async select with custom inner render
        // to look like the mock

        h(FormField, {
          type: FormFieldTypes.SELECT,
          id: 'datasets',
          isAsync: true,
          isMulti: true,
          title: '2.1 Select Dataset(s)',
          validators: [FormValidators.REQUIRED],
          description: 'Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:',
          defaultValue: datasets.map((ds) => formatSearchDataset(ds)),
          loadOptions: (query, callback) => searchDatasets(query, callback),
          placeholder: 'Dataset Name, Sample Collection ID, or PI',
          onChange,
        }),

        h(FormField, {
          title: '2.2 Descriptive Title of Project',
          validators: [FormValidators.REQUIRED],
          description: 'Please note that coordinated requests by collaborating institutions should each use the same title.',
          id: 'projectTitle',
          onChange,
        }),

        div({}, [
          span({}, [
            'In sections 2.3, 2.4, and 2.5, you are attesting that your proposed research will remain with the scope of the items selected below, and will be liable for any deviations. Further, it is to your benefit to be as specific as possible in your selections, as it will maximize the data available to you.'
          ])
        ]),

        h3({}, ['2.3 Type of Research*']),
        h4({}, ['2.3.1 Is the primary purpose of this research to investigate a specific disease(s)?']),
        h(FormField, {
          id: 'primaryPurpose',
          type: FormFieldTypes.YESNORADIOGROUP,
          orientation: 'horizontal',
          onChange,
        }),

        h3({}, ['2.4 Research Designations']),
        p({}, ['Select all applicable options that describe your proposed research.']),
        p({}, ['I am proposing to:']),

        h(FormField, {
          id: 'developNewMethods',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Develop or validate new methods for analysing/interpreting data.',
          onChange,
        }),

        h(FormField, {
          id: 'caseControl',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Increase controls available for a comparison group (e.g. a case-control study).',
          onChange,
        }),

        h(FormField, {
          id: 'generalPop',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Study variation in the general population.',
          onChange,
        }),

        h(FormField, {
          id: 'commercial',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'Conduct research for an exclusively or partially commercial purpose.',
          onChange,
        }),

        h(FormField, {
          id: 'rus',
          type: FormFieldTypes.TEXTAREA,
          title: '2.5 Research Use Statement (RUS)',
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
        }),

        h(FormField, {
          id: 'nonTechnicalSummary',
          type: FormFieldTypes.TEXTAREA,
          title: '2.6 Non-Technical Summary',
          validators: [FormValidators.REQUIRED],
          description: 'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).',
          placeholder: 'Please limit your your non-technical summary to 1100 characters',
          rows: 6,
          maxLength: 1100,
          ariaLevel: ariaLevel + 3,
        }),

        h(FormField, {
          title: '2.7 Data Use Acknowledgements',
          description: 'Please confirm listed acknowledgements and/or document requirements below:',
          id: 'gso',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'I acknowledge that I have selected a dataset limited to use on genetic studies only (SO). I attest that I will respect this data use condition.',
          onChange,
        }),

        h(FormField, {
          id: 'pub',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'I acknowledge that I have selected a dataset which requires results of studies using the data to be made available to the larger scientific community (PUB). I attest that I will respect this data use condition.',
          onChange,
        }),

        h(FormField, {
          id: 'dul',
          type: FormFieldTypes.CHECKBOX,
          toggleText: 'I acknowledge that the dataset can only be used in research consistent with the Data Use Limitations (DULs) and cannot be combined with other datasets of other phenotypes. Research uses inconsistent with DUL are considered a violation of the Data Use Certification agreement and any additional terms descried in the addendum',
          onChange,
        }),


        p({}, [
          'One or more of the datasets you selected requires local IRB approval for use. Please upload your local IRB approval(s) here as a single document. When IRB approval is required and Expedited of Full Review is required, it must be completed annually. Determinations of Not Human Subjects Research (NHSR) by IRBs will not be accepted as IRB approval.'
        ]),


      ]),
    ])
  );
}
