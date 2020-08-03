import {useEffect, useState} from 'react';
import { a, br, div, fieldset, h, h3, input, label, span, textarea } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import { DAR } from '../../libs/ajax';
import AsyncSelect from 'react-select/async';

export default function DataAccessRequest(props) {
  const [projectTitle, setProjectTitle] = useState(props.projectTitle);
  const [methods, setMethods] = useState(props.methods);
  const [controls, setControls] = useState(props.controls);
  const [population, setPopulation] = useState(props.population);
  const [forProfit, setForProfit] = useState(props.forProfit);
  const [rus, setRus] = useState(props.rus);
  const [nonTechRus, setNonTechRus] = useState(props.nonTechRus);

  //NOTE: this useEffect hook is only present until the rest of the steps have been converted to functional components
  //The end goal is for the components to subscribe parts of the larger data model stored in the parent and handle changes themselves without having props passed in
  //Otherwise you end up with this situation where the component has to re-render twice per state variable (one for props, one to assign value to state)
  //Can be done with Redux or Redux offshoot libraries or with React Context hooks
  //Leaning towards Context hooks since we only have one data model (Redux would be overkill)
  useEffect(() => {
    setProjectTitle(props.projectTitle);
    setMethods(props.methods);
    setControls(props.controls);
    setPopulation(props.population);
    setForProfit(props.forProfit);
    setRus(props.rus);
    setNonTechRus(props.nonTechRus);
  }, [props]);

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

  return (
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(props.darCode) }, [

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
              key: isEmpty(props.datasets) ? null : props.datasets.value,
              isDisabled: !isNil(props.darCode),
              isMulti: true,
              loadOptions: (query, callback) => searchDatasets(query, callback),
              onChange: (option) => props.onDatasetsChange(option),
              value: props.datasets,
              noOptionsMessage: () => 'Start typing a Dataset Name, Sample Collection ID, or PI',
              loadingMessage: () => 'Start typing a Dataset Name, Sample Collection ID, or PI',
              classNamePrefix: 'select',
              placeholder: 'Dataset Name, Sample Collection ID, or PI',
              className: (isEmpty(props.datasets) && props.showValidationMessages) ?
                ' required-select-error select-autocomplete' :
                'select-autocomplete'

            }),
            span({
              className: 'cancel-color required-field-error-span',
              isRendered: isEmpty(props.datasets) && props.showValidationMessages,
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
                onBlur: (e) => props.formStateChange(setProjectTitle, 'value', e),
                className: (isEmpty(projectTitle) && props.showValidationMessages) ?
                  'form-control required-field-error' :
                  'form-control',
                required: true,
                disabled: props.darCode !== null,
              }),
              span({
                className: 'cancel-color required-field-error-span',
                isRendered: isEmpty(projectTitle) && props.showValidationMessages,
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
              isRendered: props.isTypeOfResearchInvalid && props.showValidationMessages,
            }, [
              'One of the following fields is required.', br(),
              'Disease related studies require a disease selection.', br(),
              'Other studies require additional details.'])
          ]),

          div(
            {className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'},
            [props.TypeOfResearch]), //pass in this component as a prop

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
                  onChange: (e) => props.formStateChange(setMethods, 'checked', e),
                  id: 'checkMethods',
                  type: 'checkbox',
                  disabled: (props.darCode !== null),
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
                  onChange: (e) => props.formStateChange(setControls, 'checked', e),
                  id: 'checkControls',
                  type: 'checkbox',
                  disabled: (!isNil(props.darCode)),
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
                  onChange: (e) => props.formStateChange(setPopulation, 'checked', e),
                  id: 'checkPopulation',
                  type: 'checkbox',
                  disabled: !isNil(props.darCode),
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
                  onChange: (e) => props.formStateChange(setForProfit, 'checked', e),
                  id: 'checkForProfit',
                  type: 'checkbox',
                  disabled: !isNil(props.darCode),
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
              onBlur: (e) => props.formStateChange(setRus, 'value', e),
              name: 'rus',
              id: 'inputRUS',
              className: (isEmpty(rus) && props.showValidationMessages) ?
                ' required-field-error form-control' :
                'form-control',
              rows: '6',
              required: true,
              placeholder: 'Please limit your RUS to 2200 characters.',
              disabled: !isNil(props.darCode),
            }),
            span({
              className: 'cancel-color required-field-error-span',
              isRendered: isEmpty(rus) && props.showValidationMessages,
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
              onBlur: (e) => props.formStateChange(setNonTechRus, 'value', e),
              name: 'non_tech_rus',
              id: 'inputNonTechRUS',
              className: (isEmpty(nonTechRus) && props.showValidationMessages) ?
                'required-field-error form-control' :
                'form-control',
              rows: '3',
              required: true,
              placeholder: 'Please limit your non-technical summary to 1100 characters.',
              disabled: !isNil(props.darCode),
            }),
            span(
              {
                className: 'cancel-color required-field-error-span',
                isRendered: isEmpty(nonTechRus) && props.showValidationMessages,
              },
              ['Required field']),
          ]),
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
          a({ id: 'btn_prev', onClick: props.prevPage, className: 'btn-primary f-left access-background' }, [
            span({ className: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true' }), 'Previous Step'
          ]),

          a({ id: 'btn_next', onClick: props.nextPage, className: 'btn-primary f-right access-background' }, [
            'Next Step', span({ className: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true' })
          ]),

          a({
            id: 'btn_save', isRendered: isNil(props.darCode), onClick: props.partialSave,
            className: 'btn-secondary f-right access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}
