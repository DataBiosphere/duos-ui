import { a, div, fieldset, h2, h3, h4, h, span } from 'react-hyperscript-helpers';
import isEmpty from 'lodash/fp/isEmpty';
import './dar_application.css';
import { FormField, FormFieldTypes, FormValidators } from '../../components/forms/forms';

const ResearchPurposeRow = (props) => {
  const {
    title,
    description,
    id,
    defaultValue,
    onChange,
    validation,
    disabled,
    onValidationChange,
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
        type: FormFieldTypes.YESNORADIOGROUP,
        id: id,
        validators: [FormValidators.REQUIRED],
        defaultValue,
        orientation: 'horizontal',
        validation,
        onValidationChange,
        disabled,
        onChange,
      }),

    ])
  ]);
};

export default function ResearchPurposeStatement(props) {

  const {
    darCode,
    formFieldChange,
    formData,
    validation,
    readOnlyMode,
    formValidationChange,
  } = props;

  const onValidationChange = formValidationChange;

  //NOTE: inputs have both isEmpty and isNil checks
  //currently values are initialized as emptry strings as a way to maintain controlled inputs in components
  //however the inputs, when given a value, can either be a string (as seen with gender), or a boolean
  //isEmpty will give a false negative with booleans and isNil will give a false positive with empty strings

  const onChange = ({ key, value }) => {
    formFieldChange({ key, value });
  };

  return(
    div({ className: 'dar-step-card' }, [
      fieldset({ disabled: !isEmpty(darCode) }, [

        h2({ className: '' }, ['Step 3: Research Purpose Statement']),

        div({ className: 'form-group' }, [
          h3({ className: '' },
            ['In order to ensure appropriate review, please answer the questions below:']),

          h4({}, ['I am proposing to:']),

          h(ResearchPurposeRow, {
            title: 'Increase controls available for a comparison group (e.g. a case-control study).',
            id: 'controls',
            defaultValue: formData.controls,
            validation: validation.controls,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Study variation in the general population (e.g. calling variants and/or studying their distribution).',
            id: 'population',
            defaultValue: formData.population,
            validation: validation.population,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Conduct research for an exclusively or partially commercial purpose.',
            id: 'forProfit',
            defaultValue: formData.forProfit,
            validation: validation.forProfit,
            onValidationChange,
            onChange,
          }),

          h4({}, ['Is this study:']),

          h(ResearchPurposeRow, {
            title: 'Limited to one gender',
            id: 'oneGender',
            defaultValue: formData.oneGender,
            validation: validation.oneGender,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          div({
            isRendered: formData.oneGender,
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
              disabled: readOnlyMode,
              defaultValue: formData.gender,
              onChange,
              validation: validation.gender,
              onValidationChange,
            }),
          ]),


          h(ResearchPurposeRow, {
            title: 'Limited to a pediatric population (under the age of 18)',
            id: 'pediatric',
            defaultValue: formData.pediatric,
            validation: validation.pediatric,
            onValidationChange,
            disabled: readOnlyMode,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: span({}, ['Targeting a vulnerable population as defined in ', a({
              href: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-456',
              target: '_blank',
            }, ['456 CFR'])]),
            description: '(children, prisoners, pregnant women, mentally disabled persons, or [“SIGNIFICANTLY”] economically or educationally disadvantaged persons)',
            id: 'vulnerablePopulation',
            defaultValue: formData.vulnerablePopulation,
            validation: validation.vulnerablePopulation,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h4({}, ['Does this research involve the study of:']),

          h(ResearchPurposeRow, {
            title: 'Illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)',
            id: 'illegalBehavior',
            defaultValue: formData.illegalBehavior,
            validation: validation.illegalBehavior,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Sexual preferences or sexually transmitted diseases',
            id: 'sexualDiseases',
            defaultValue: formData.sexualDiseases,
            validation: validation.sexualDiseases,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Psychological traits, intelligence, or attention',
            id: 'psychiatricTraits',
            defaultValue: formData.psychiatricTraits,
            validation: validation.psychiatricTraits,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Correlating ethnicity, race, or gender with genotypic or phenotypic variables for purposes beyond biomedical or health-related research, or in ways not easily related to health',
            id: 'notHealth',
            defaultValue: formData.notHealth,
            validation: validation.notHealth,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

          h(ResearchPurposeRow, {
            title: 'Stigmatizing illnesses',
            id: 'stigmatizedDiseases',
            defaultValue: formData.stigmatizedDiseases,
            validation: validation.stigmatizedDiseases,
            disabled: readOnlyMode,
            onValidationChange,
            onChange,
          }),

        ])
      ]),
    ])
  );
}
