import { useState, useEffect } from 'react';
import { a, br, div, fieldset, h, h3, input, label, span, textarea } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import cloneDeep from 'lodash/fp/cloneDeep';
import every from 'lodash/fp/every';
import { DAR } from '../../libs/ajax';
import AsyncSelect from 'react-select/async';

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
    partialSave
  } = props;

  const [projectTitle, setProjectTitle] = useState(props.projectTitle);
  const [methods, setMethods] = useState(props.methods);
  const [controls, setControls] = useState(props.controls);
  const [population, setPopulation] = useState(props.population);
  const [forProfit, setForProfit] = useState(props.forProfit);
  const [rus, setRus] = useState(props.rus);
  const [nonTechRus, setNonTechRus] = useState(props.nonTechRus);
  const [datasets, setDatasets] = useState(props.datasets || []);

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

  //function needed to update state for 2.4
  const checkedStateChange = (dataset, setter) => {
    const { value } = dataset;
    setter(value);
    formFieldChange(dataset);
  };


  useEffect(() => {
    setProjectTitle(props.projectTitle);
    setRus(props.rus);
    setNonTechRus(props.nonTechRus);
    setDatasets(props.datasets);
  }, [props.rus, props.nonTechRus, props.projectTitle, props.datasets]);

  //seperate useEffect hook to initialize dataUse on attached datasets (legacy partials)
  useEffect(() => {
    //if datasets array is populated, check for dataUse objects
    //if any dataSet has an empty value or has the key missing, attach dataUse objects to partials
    const updateDatasets = async(datasets) => {
      if (!every((dataset) => !isNil(dataset.dataUse) && !isEmpty(dataset.dataUse), datasets)) {
        const clonedDatasets = cloneDeep(datasets);
        const updatedDatasets = await initializeDatasets(clonedDatasets);
        setDatasets(updatedDatasets);
      }
    };
    updateDatasets(datasets);
  }, [datasets, initializeDatasets]);

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
                ' required-select-error select-autocomplete' :
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

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
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
