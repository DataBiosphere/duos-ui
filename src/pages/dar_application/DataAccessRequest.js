import { useState, useEffect, useRef } from 'react';
import { a, br, div, fieldset, h, h3, input, label, span, textarea } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import forEach from 'lodash/fp/forEach';
import includes from 'lodash/fp/includes';
import cloneDeep from 'lodash/fp/cloneDeep';
import isEqual from 'lodash/fp/isEqual';
import every from 'lodash/fp/every';
import { DAR } from '../../libs/ajax';
import AsyncSelect from 'react-select/async';
import ClearIcon from '@material-ui/icons/Clear';

const uploadFileDiv = (showValidationMessages, formInput) => {
  return {
    padding: '1rem',
    backgroundColor: showValidationMessages && isNil(formInput) ? errorBackgroundColor : 'inherit'
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

const uploadFileLabelColors = {
  standardBackgroundColor: 'rgb(96, 59, 155)',
  hoverBackgroundColor: '#2FA4E7'
};

const fileClearColor = {
  standardColors: {
    backgroundColor: '#fdc3c3ab',
    color: '#fb3737'
  },
  hoverColors: {
    backgroundColor: 'red',
    color: 'white'
  },
  transition: 'background 0.3s ease'
};

//NOTE: if the upload add/remove functionality is needed elsewhere, I can pull the label/input out into its own component
const uploadFileLabel = {
  flex: 2,
  maxWidth: '10rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: uploadFileLabelColors.standardBackgroundColor,
  color: 'white',
  padding: '1.3rem',
  textAlign: 'center',
  borderRadius: '0.6rem',
  cursor: 'pointer',
  fontFamily: 'Roboto, sans-serif',
  fontSize: '1.4rem',
  transition: 'background 0.3s ease',
  margin: 0,
  boxShadow: "-4px 6px 9px 0px #e8e5e5",
};

const uploadFileDescription = {
  paddingBottom: '1.5rem'
};

const filenameStyle = {
  flex: 1,
  justifyContent: 'left',
  whiteSpace: 'nowrap',
  minWidth: '30rem',
  overflow: 'hidden',
  marginLeft: '4rem',
  fontFamily: 'Montserrant',
  fontSize: '1.8rem',
  padding: '0.5rem',
  border: '1px solid #ea5e5',
  backgroundColor: 'rgb(243 248 253)',
  display: 'inline-flex',
  alignItems: 'center',
  borderTopLeftRadius: '2rem',
  borderBottomLeftRadius: '2rem',
  maxWidth: '30rem',
  boxShadow: "-4px 6px 9px 0px #e8e5e5",
};

const uploadFileInput = {
  display: 'none'
};

const clearIconStyle = {
  backgroundColor: fileClearColor.standardColors.backgroundColor,
  color: fileClearColor.standardColors.color,
  fontSize: '5rem',
  flex: 1,
  borderBottomRightRadius: '2rem',
  borderTopRightRadius: '2rem',
  boxShadow: "-4px 6px 9px 0px #e8e5e5",
  transition: fileClearColor.transition,
  maxWidth: '3rem',
  zIndex: -1
};

const errorBackgroundColor = "rgba(243, 73, 73, 0.19)";

const UploadLabelButton = (props) => {
  const {id, formAttribute, file, formFieldChange} = props;
  const fileName = !isNil(file) ? file.name : "";

  const fileRef = useRef(props.file || null);

  const removeUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.standardBackgroundColor;
  };

  const applyUploadLabelHover = (e) => {
    e.target.style.background = uploadFileLabelColors.hoverBackgroundColor;
  };

  const removeClearHover = (e) => {
    e.target.style.backgroundColor = fileClearColor.standardColors.backgroundColor;
    e.target.style.color = fileClearColor.standardColors.color;
  };

  const applyClearHover = (e) => {
    e.target.style.backgroundColor = fileClearColor.hoverColors.backgroundColor;
    e.target.style.color = fileClearColor.hoverColors.color;
  };

  //NOTE: File inputs are uncontrolled inputs no matter what
  //Therefore file name updates need to be updated manually via custom click/change handlers
  //Manually clear or assign file names and call parent function to update file on parent's state
  //useRef hook can be used to initialize/update a value for a DOM element while avoiding re-renders on value change
  const clearFile = (formFieldChange, name) => {
    fileRef.current.value = '';
    formFieldChange({name, value: null});
  };

  const updateFile = (formAttribute, file) => {
    //set current file as default if user cancels upload prompt
    const targetFile = file || fileRef.current;
    fileRef.current = targetFile;
    formFieldChange({name: formAttribute, value: targetFile});
  };

  return (
    div({
      style: {
        margin: '0.5rem 0',
        display: 'inline-flex',
        verticalAlign: 'middle'
      }
    }, [
      input({
        id,
        type: 'file',
        style: uploadFileInput,
        ref: fileRef,
        onChange: (e) => updateFile(formAttribute, e.target.files[0])
        // onChange: (e) => formFieldChange({name: formAttribute, value: e.target.files[0]})
      }),
      label({
        htmlFor: id,
        style: uploadFileLabel,
        onMouseEnter: applyUploadLabelHover,
        onMouseLeave: removeUploadLabelHover,
      }, ['Upload File']),
      span({
        isRendered: !isNil(file),
        style: filenameStyle
      },[fileName]),
      h(ClearIcon, {
        style: clearIconStyle,
        isRendered: !isNil(file),
        onClick: (e) => clearFile(formFieldChange, formAttribute),
        onMouseEnter: applyClearHover,
        onMouseLeave: removeClearHover
      })
    ])
  );
};

export default function DataAccessRequest(props) {
  const {
    darCode,
    // datasets,
    initializeDatasets, //method used to assign dataUse to pre-assgined datasets in the application
    onDatasetsChange,
    showValidationMessages,
    formFieldChange,
    isTypeOfResearchInvalid,
    TypeOfResearch,
    nextPage,
    prevPage,
    partialSave,
    irbDocument,
    collaborationDocument
  } = props;

  const [projectTitle, setProjectTitle] = useState(props.projectTitle);
  const [methods, setMethods] = useState(props.methods);
  const [controls, setControls] = useState(props.controls);
  const [population, setPopulation] = useState(props.population);
  const [forProfit, setForProfit] = useState(props.forProfit);
  const [rus, setRus] = useState(props.rus);
  const [nonTechRus, setNonTechRus] = useState(props.nonTechRus);
  const [datasets, setDatasets] = useState(props.datasets || []);
  const [activeDULQuestions, setActiveDULQuestions] = useState({});
  //parent needs to initialize defaults if value not present
  const [gsoAcknowledgement, setGSOAcknowledgement] = useState(props.gsoAcknowledgement || false);
  const [pubAcknowledgement, setPUBAcknowledgement] = useState(props.pubAcknowledgement || false);
  const [dsAcknowledgement, setDSAcknowledgement] = useState(props.dsAcknowledgement || false);
  // const [irbDocument, setIRBDocument] = useState(props.irbDocument);
  // const [collaborationDocument, setCollaborationDocument] = useState(props.collaborationDocument);

  const targetDULKeys = ['ethicsApprovalRequired', 'collaboratorRequired', 'publicationresults', 'diseaseRestrictions', 'geneticStudiesOnly'];

  const searchDatasets = (query, callback) => {
    DAR.getAutoCompleteDS(query).then(items => {
      let options = items.map(function (item) {
        return {
          key: item.id,
          value: item.id,
          label: item.concatenation
        };
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
                  //otherwise mark question as true
                  updatedDULQuestions[key] = true;
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
          updatedDULQuestions['diseaseRestrictions'] = false;
        }
      }

      if(!isEqual(updatedDULQuestions, activeDULQuestions)) {
        setActiveDULQuestions(updatedDULQuestions);
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
  }, [datasets, initializeDatasets, targetDULKeys, activeDULQuestions]);

  return (
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(darCode) }, [
        h3({ className: 'rp-form-title access-color' }, ['2. Data Access Request']),
        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-title-question' }, [
              '2.1 Select Dataset(s)*',
              span({},
                ['Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:'])
            ])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            h(AsyncSelect, {
              id: 'sel_datasets',
              key: isEmpty(datasets) ? null : datasets.value,
              isDisabled: !isNil(darCode),
              isMulti: true,
              loadOptions: (query, callback) => searchDatasets(query, callback),
              onChange: (option) => onDatasetsChange(option),
              value: datasets,
              noOptionsMessage: () => 'Start typing a Dataset Name, Sample Collection ID, or PI',
              loadingMessage: () => 'Start typing a Dataset Name, Sample Collection ID, or PI',
              classNamePrefix: 'select',
              placeholder: 'Dataset Name, Sample Collection ID, or PI',
              className: (isEmpty(datasets) && showValidationMessages) ?
                'required-select-error select-autocomplete' :
                'select-autocomplete'

            }),
            span({
              className: 'cancel-color required-field-error-span',
              isRendered: isEmpty(datasets) && showValidationMessages,
            },
            ['Required field']),
          ])
        ]),

        div({className: 'form-group'}, [
          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              label({className: 'control-label rp-title-question'}, [
                '2.2 Descriptive Title of Project* ',
                span({},
                  ['Please note that coordinated requests by collaborating institutions should each use the same title.']),
              ]),
            ]),
          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'},
            [
              input({
                type: 'text',
                name: 'projectTitle',
                id: 'inputTitle',
                maxLength: '256',
                defaultValue: projectTitle,
                onBlur: (e) => formFieldChange({name: 'projectTitle', value: e.target.value}),
                className: (isEmpty(projectTitle) && showValidationMessages) ?
                  'form-control required-field-error' :
                  'form-control',
                required: true,
                disabled: darCode !== null,
              }),
              span({
                className: 'cancel-color required-field-error-span',
                isRendered: isEmpty(projectTitle) && showValidationMessages,
              },
              ['Required field']),
            ]),
        ]),

        div({className: 'form-group'}, [
          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              label({className: 'control-label rp-title-question'}, [
                '2.3 Type of Research* ',
                span({},
                  ['Please select one of the following options.']),
              ]),
            ]),
          div({
            style: {'marginLeft': '15px'},
            className: 'row'
          }, [
            span({
              className: 'cancel-color required-field-error-span',
              isRendered: isTypeOfResearchInvalid && showValidationMessages,
            }, [
              'One of the following fields is required.', br(),
              'Disease related studies require a disease selection.', br(),
              'Other studies require additional details.'])
          ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [TypeOfResearch]), //pass in this component as a prop

          div({className: 'form-group'}, [
            div(
              {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
              [
                label({className: 'control-label rp-title-question'},
                  [
                    '2.4 Research Designations ',
                    span({}, ['Select all applicable options.']),
                  ]),
              ]),
          ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              div({className: 'checkbox'}, [
                input({
                  checked: methods,
                  onChange: (e) => checkedStateChange({name: 'methods', value: e.target.checked}, setMethods),
                  id: 'checkMethods',
                  type: 'checkbox',
                  disabled: (darCode !== null),
                  className: 'checkbox-inline rp-checkbox',
                  name: 'methods',
                }),
                label({
                  className: 'regular-checkbox rp-choice-questions',
                  htmlFor: 'checkMethods',
                }, [
                  span({},
                    ['2.4.1 Methods development and validation studies: ']),
                  'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data (e.g., developing more powerful methods to detect epistatic, gene-environment, or other types of complex interactions in genome-wide association studies). Data will be used for developing and/or validating new methods.',
                ]),
              ]),
            ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              div({className: 'checkbox'}, [
                input({
                  checked: controls,
                  onChange: (e) => checkedStateChange({name: 'controls', value: e.target.checked}, setControls),
                  id: 'checkControls',
                  type: 'checkbox',
                  disabled: (!isNil(darCode)),
                  className: 'checkbox-inline rp-checkbox',
                  name: 'controls',
                }),
                label({
                  className: 'regular-checkbox rp-choice-questions',
                  htmlFor: 'checkControls',
                }, [
                  span({}, ['2.4.2 Controls: ']),
                  'The reason for this request is to increase the number of controls available for a comparison group (e.g., a case-control study).',
                ]),
              ]),
            ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              div({className: 'checkbox'}, [
                input({
                  checked: population,
                  onChange: (e) => checkedStateChange({name:'population', value: e.target.checked}, setPopulation),
                  id: 'checkPopulation',
                  type: 'checkbox',
                  disabled: !isNil(darCode),
                  className: 'checkbox-inline rp-checkbox',
                  name: 'population',
                }),
                label({
                  className: 'regular-checkbox rp-choice-questions',
                  htmlFor: 'checkPopulation',
                }, [
                  span({},
                    ['2.4.3 Population structure or normal variation studies: ']),
                  'The primary purpose of the research is to understand variation in the general population (e.g., genetic substructure of a population).',
                ]),
              ]),
            ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [
              div({className: 'checkbox'}, [
                input({
                  checked: forProfit,
                  onChange: (e) => checkedStateChange({name: 'forProfit', value: e.target.checked}, setForProfit),
                  id: 'checkForProfit',
                  type: 'checkbox',
                  disabled: !isNil(darCode),
                  className: 'checkbox-inline rp-checkbox',
                  name: 'forProfit',
                }),
                label({
                  className: 'regular-checkbox rp-choice-questions',
                  htmlFor: 'checkForProfit',
                }, [
                  span({},
                    ['2.4.4 Commercial or For-Profit Purpose: ']),
                  'The primary purpose of the research is exclusively or partially for a commercial purpose',
                ]),
              ]),
            ]),
        ]),
      ]),

      div({className: 'form-group'}, [
        div(
          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
          [
            label({className: 'control-label rp-title-question'}, [
              '2.5 Research Use Statement (RUS)* ',
              span({}, [
                'A RUS is a brief description of the applicant’s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.',
                br(),
                'Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ',
                a({
                  target: '_blank',
                  href: 'https://www.ncbi.nlm.nih.gov/books/NBK482114/',
                }, ['here'], '.'),
              ]),
            ]),
          ]),
        div(
          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
          [
            textarea({
              defaultValue: rus,
              onBlur: (e) => formFieldChange({name: 'rus', value: e.target.value}),
              name: 'rus',
              id: 'inputRUS',
              className: (isEmpty(rus) && showValidationMessages) ?
                ' required-field-error form-control' :
                'form-control',
              rows: '6',
              required: true,
              placeholder: 'Please limit your RUS to 2200 characters.',
              disabled: !isNil(darCode),
            }),
            span({
              className: 'cancel-color required-field-error-span',
              isRendered: isEmpty(rus) && showValidationMessages,
            },
            ['Required field']),
          ]),
      ]),

      div({className: 'form-group'}, [
        div(
          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
          [
            label({className: 'control-label rp-title-question'}, [
              '2.6 Non-Technical Summary* ',
              span({}, [
                'Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below).',
              ]),
            ]),
          ]),
        div(
          {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
          [
            textarea({
              defaultValue: nonTechRus,
              onBlur: (e) => formFieldChange({name: 'nonTechRus', value: e.target.value}),
              name: 'nonTechRus',
              id: 'inputNonTechRus',
              className: (isEmpty(nonTechRus) && showValidationMessages) ?
                'required-field-error form-control' :
                'form-control',
              rows: '3',
              required: true,
              placeholder: 'Please limit your non-technical summary to 1100 characters.',
              disabled: !isNil(darCode),
            }),
            span(
              {
                className: 'cancel-color required-field-error-span',
                isRendered: isEmpty(nonTechRus) && showValidationMessages,
              },
              ['Required field']),
          ]),
      ]),
      div({
        className: 'form-group',
        isRendered: !isNil(activeDULQuestions) && !isEmpty(activeDULQuestions)
      }, [
        div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
          label({className: 'control-label rp-title-question'}, [
            '2.7 Data Use Acknowledgements',
            span({}, [
              'Please confirm listed acknowledgements and/or document requirements below'
            ])
          ])
        ]),

        div({
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 checkbox',
          style: dulQuestionDiv(showValidationMessages, gsoAcknowledgement),
          isRendered: activeDULQuestions['geneticStudiesOnly'],
        }, [
          input({
            type: 'checkbox',
            id: 'chk_gso_confirm',
            name: 'gsoAckowledgement',
            className: 'checkbox-inline rp-checkbox',
            checked: gsoAcknowledgement,
            disabled: !isNil(darCode),
            onChange: (e) => checkedStateChange({name: 'gsoAcknowledgement', value: e.target.checked}, setGSOAcknowledgement)
          }),
          label({
            className: 'regular-checkbox rp-choice-questions',
            htmlFor: 'chk_gso_confirm'
          }, ['I acknowledge that I have selected a dataset limited to use on genetic studies only (GSO). I attest that I will respect this data use condition. '])
        ]),

        div({
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 checkbox',
          style: dulQuestionDiv(showValidationMessages, pubAcknowledgement),
          isRendered: activeDULQuestions['publicationResults']
        }, [
          input({
            type: 'checkbox',
            id: 'chk_pub_confirm',
            name: 'pubAckowledgement',
            className: 'checkbox-inline rp-checkbox',
            checked: pubAcknowledgement,
            disabled: !isNil(darCode),
            onChange: (e) => checkedStateChange({name: 'pubAcknowledgement', value: e.target.checked}, setPUBAcknowledgement)
          }),
          label({
            className: 'regular-checkbox rp-choice-questions',
            htmlFor: 'chk_pub_confirm'
          }, ['I acknowledge that I have selected a dataset which requires results of studies using the data to be made available to the larger scientific community (PUB). I attest that I will respect this data use condition.'])
        ]),

        div({
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 checkbox',
          style: dulQuestionDiv(showValidationMessages, dsAcknowledgement),
          isRendered: activeDULQuestions['diseaseRestrictions']
        }, [
          input({
            type: 'checkbox',
            id: 'chk_ds_confirm',
            name: 'dsAckowledgement',
            className: 'checkbox-inline rp-checkbox',
            checked: dsAcknowledgement,
            disabled: !isNil(darCode),
            onChange: (e) => checkedStateChange({name: 'dsAcknowledgement', value: e.target.checked}, setDSAcknowledgement)
          }),
          label({
            className: 'regular-checkbox rp-choice-questions',
            htmlFor: 'chk_ds_confirm'
          }, ['I acknowledge that the dataset can only be used in research consistent with the Data Use Limitations (DULs) and cannot be combined with other datasets of other phenotypes. Research uses inconsistent with the DUL are considered a violation of the Data Use Certification agreement and any additional terms described in the Addendum.'])
        ]),

        div({
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
          isRendered: activeDULQuestions['ethicsApprovalRequired'],
          style: uploadFileDiv(showValidationMessages, irbDocument)
        }, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
              span({className: 'rp-choice-questions', style: uploadFileDescription}, [
                //NOTE: ask for question to be rephrased, grammar seems odd and I don't know how the conditions tie to each other
                //second statement can either be a condition for the first or last statements (or maybe both?)
                `One or more of the datasets you selected requires local IRB approval for use. Please upload your local IRB apporval(s) here as a single document. 
                When IRB approval is required and Expedited or Full Review is required and must be completed annually.
                Determinations of Not Human Subjects Research (NHSR) by IRBs will not be accepted as IRB approval.`
              ])
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
              h(UploadLabelButton, {
                id: 'btn_irb_uploadFile',
                formAttribute: 'irbDocument',
                file: irbDocument,
                formFieldChange
              })
            ])
          ]),
        ]),

        div({
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
          isRendered: activeDULQuestions['collaboratorRequired'],
          style: uploadFileDiv(showValidationMessages, collaborationDocument)
        }, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
              span({className: 'rp-choice-questions',style: uploadFileDescription
              }, [
                `One or more of the datasets you selected requires collaboration (COL) with the primary study investigator(s) for use. Please upload documentation of your collaboration here.`
              ])
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
              h(UploadLabelButton, {
                id: 'btn_col_uploadFile',
                formAttribute: 'collaborationDocument',
                file: collaborationDocument,
                formFieldChange
              })
            ])
          ])
        ])
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: {marginTop: '2.5rem'} }, [
          a({ id: 'btn_prev', onClick: prevPage, className: 'btn-primary f-left access-background' }, [
            span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
          ]),

          a({ id: 'btn_next', onClick: nextPage, className: 'btn-primary f-right access-background' }, [
            'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
          ]),

          a({
            id: 'btn_save', isRendered: isNil(darCode), onClick: partialSave,
            className: 'btn-secondary f-right access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}
