import { useState } from 'react';
import { a, div, fieldset, h2, h3, h4, h, span } from 'react-hyperscript-helpers';
import isEmpty from 'lodash/fp/isEmpty';
import './dar_application_new.css';
import { FormField, FormFieldTypes, FormValidators } from '../../components/forms/forms';

const ResearchPurposeRow = (props) => {
  const {
    title,
    description,
    id,
    defaultValue,
    onChange,
  } = props;

  return div({
    className: 'rp-row flex flex-row',
  }, [
    div({
      style: {
        width: '70%',
      }
    }, [
      div({
        className: 'rp-row-title',
      }, [title]),
      div({
        className: 'rp-row-description',
      }, [description]),
    ]),
    div({
      style: {
        width: '20%',
      }
    }, [
      h(FormField, {
        type: FormFieldTypes.RADIOGROUP,
        id: id,
        validators: [FormValidators.REQUIRED],
        orientation: 'horizontal',
        options: [
          {
            text: 'Yes',
            name: 'yes',
          },
          {
            text: 'No',
            name: 'no',
          }
        ],
        defaultValue: defaultValue ? 'yes' : 'no',
        onChange: ({key, value, isValid}) => {
          onChange({key: key, value: (value === 'yes'), isValid: isValid});
        }
      }),

    ])
  ]);
};

export default function ResearchPurposeStatement(props) {

  const {
    darCode,
    formFieldChange,
    illegalBehavior,
    notHealth,
    oneGender,
    pediatric,
    psychiatricTraits,
    sexualDiseases,
    stigmatizedDiseases,
    vulnerablePopulation
  } = props;

  const [gender, setGender] = useState(props.gender);

  //NOTE: inputs have both isEmpty and isNil checks
  //currently values are initialized as emptry strings as a way to maintain controlled inputs in components
  //however the inputs, when given a value, can either be a string (as seen with gender), or a boolean
  //isEmpty will give a false negative with booleans and isNil will give a false positive with empty strings

  const onChange = ({ key, value }) => {
    formFieldChange({ name: key, value });
  };

  return(
    div({ className: 'dar-step-card' }, [
      fieldset({ disabled: !isEmpty(darCode) }, [

        h2({ className: '' }, ['Step 3: Research Purpose Statement']),

        div({ className: 'form-group' }, [
          h3({ className: '' },
            ['In order to ensure appropriate review, please answer the questions below:']),

          h4({}, ['Is this study:']),

          h(ResearchPurposeRow, {
            title: 'Limited to one gender',
            id: 'oneGender',
            defaultValue: oneGender,
            onChange: ({key, value}) => {
              onChange({key, value});
              onChange({key: 'gender', value: (value?gender:undefined)});
            },
          }),

          div({
            isRendered: oneGender,
            className: 'flex flex-row rp-subrow',
            style: {
              justifyContent: 'flex-start',
            }
          }, [
            span({
              style: {
                fontStyle: 'italic',
                marginRight: '3rem',
              }
            }, [
              'Please Specify:',
            ]),
            h(FormField, {
              type: FormFieldTypes.RADIOGROUP,
              orientation: 'horizontal',
              id: 'gender',
              options: [
                {
                  text: 'Male',
                  name: 'M',
                },
                {
                  text: 'Female',
                  name: 'F',
                }
              ],
              defaultValue: gender,
              onChange: ({key, value}) => {
                setGender(value);
                onChange({key, value});
              },
            }),
          ]),


          h(ResearchPurposeRow, {
            title: 'Limited to a pediatric population (under the age of 18)',
            id: 'pediatric',
            defaultValue: pediatric,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: span({}, ['Targeting a vulnerable population as defined in ', a({
              href: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-456',
              target: '_blank',
            }, ['456 CFR'])]),
            description: '(children, prisoners, pregnant women, mentally disabled persons, or [“SIGNIFICANTLY”] economically or educationally disadvantaged persons)',
            id: 'vulnerablePopulation',
            defaultValue: vulnerablePopulation,
            onChange,
          }),

          h4({}, ['Does this research involve the study of:']),

          h(ResearchPurposeRow, {
            title: 'Illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)',
            id: 'illegalBehavior',
            defaultValue: illegalBehavior,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Sexual preferences or sexually transmitted diseases',
            id: 'sexualDiseases',
            defaultValue: sexualDiseases,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Psychological traits, intelligence, or attention',
            id: 'psychiatricTraits',
            defaultValue: psychiatricTraits,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Correlating ethnicity, race, or gender with genotypic or phenotypic variables for purposes beyond biomedical or health-related research, or in ways not easily related to health',
            id: 'notHealth',
            defaultValue: notHealth,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Stigmatizing illnesses',
            id: 'stigmatizedDiseases',
            defaultValue: stigmatizedDiseases,
            onChange,
          }),

        ])
      ]),
    ])
  );
}