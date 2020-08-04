import { useState } from 'react';
import { a, div, fieldset, h3, input, label, span } from 'react-hyperscript-helpers';
import isNil from 'lodash/fp/isNil';
import { YesNoRadioGroup} from '../../components/YesNoRadioGroup';

/**
  props
    props.darCode -> darCode
    step3.inputPurpose.invalid -> invalidPurpose
    showValidationMessages -> showValidationMessages
    this.state.formData.forProfit -> forProfit
    this.state.formData.onegender -> oneGender

    NOTE: need to review the two functions below to see if I can refactor them into current state/form change functions
      this.handleGenderChange -> handleGenderChange (seems like I can just use the state change helper)
      this.handleRadioChange -> handleRadioChange
    this.nextPage -> nextPage
    this.prevPage -> prevPage
    this.state.formData.illegalbehave -> illegalBehave
    this.state.formData.addiction -> addiction
    this.state.formData.sexualdiseases -> sexualDiseases
    this.state.formData.stigmatizediseases -> stigmatizeDisease
    this.state.formData.vulnerablepop -> vulnerablePop
    this.state.formData.popMigration -> popMigration
    this.state.formData.psychtraits -> psychTraits
    this.state.formData.nothealth -> notHealth
    this.partialSave -> partialSave
    this.state.formData.pediatric -> pediatric

    const
      genderLabels
        -move from parent to this component

  state (NOTE: maybe these can just exist as props? Need to do an analysis on YesNoGroup)
    forProfit
    oneGender
    gender
*/

export default function ResearchPurposeStatement(props) {

  const genderLabels = ['Female', 'Male'];
  const genderValues = ['F', 'M'];
  const [gender, setGender] = useState(props.gender);

  return(
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(props.darCode) }, [

        h3({ className: 'rp-form-title access-color' }, ['3. Research Purpose Statement']),

        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-title-question' },
              ['3.1 In order to ensure appropriate review, please answer the questions below:'])
          ]),
          div({ className: 'row no-margin' }, [
            span({
              className: 'cancel-color required-field-error-span', isRendered: props.invalidPurpose && props.showValidationMessages,
              style: { 'marginLeft': '15px' }
            }, ['All fields are required'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.1 Will this data be used exclusively or partially for a commercial purpose?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.forProfit, onChange: props.handleRadioChange, id: 'forProfit', name: 'forProfit',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' }, ['3.1.2 Please indicate if this study is limited to one gender?'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.oneGender, onChange: props.handleRadioChange, id: 'onegender', name: 'onegender',
              required: true
            }),
            div({
              isRendered: props.oneGender === 'true' || props.oneGender === true,
              className: 'multi-step-fields', disabled: !isNil(props.darCode)
            }, [
              span({}, ['Please specify']),
              div({ className: 'radio-inline' }, [
                genderLabels.map((option, ix) => {
                  return (
                    label({
                      key: 'gender' + ix,
                      onClick: (e) => props.formStateChange(setGender, {name: 'gender', value: genderValues[ix]}),
                      id: 'lbl_gender_' + ix,
                      htmlFor: 'rad_gender_' + ix,
                      className: 'radio-wrapper'
                    }, [
                      input({
                        type: 'radio',
                        id: 'rad_gender_' + ix,
                        checked: gender === genderValues[ix],
                        onChange: () => { }
                      }),
                      span({ className: 'radio-check' }),
                      span({ className: 'radio-label' }, [genderLabels[ix]])
                    ])
                  );
                })
              ])
            ])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.pediatric, onChange: props.handleRadioChange, id: 'pediatric', name: 'pediatric', required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.illegalBehave, onChange: props.handleRadioChange, id: 'illegalbehave', name: 'illegalbehave',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.addiction, onChange: props.handleRadioChange, id: 'addiction', name: 'addiction', required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.sexualDiseases, onChange: props.handleRadioChange, id: 'sexualdiseases', name: 'sexualdiseases',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.7 Does the research aim involve the study of any stigmatizing illnesses?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.stigmatizeDiseases, onChange: props.handleRadioChange, id: 'stigmatizediseases',
              name: 'stigmatizediseases', required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or ["SIGNIFICANTLY"] economically or educationally disadvantaged persons)?'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.vulnerablePop, onChange: props.handleRadioChange, id: 'vulnerablepop', name: 'vulnerablepop',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.9 Does the research aim involve the study of Population Origins/Migration patterns?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.popMigration, onChange: props.handleRadioChange, id: 'popmigration', name: 'popmigration',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            YesNoRadioGroup({
              value: props.psychTraits, onChange: props.handleRadioChange, id: 'psychtraits', name: 'psychtraits',
              required: true
            })
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-choice-questions' },
              ['3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?'])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group' }, [
            YesNoRadioGroup({
              value: props.notHealth, onChange: props.handleRadioChange, id: 'nothealth', name: 'nothealth', required: true
            })
          ])
        ])
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
            className: 'f-right btn-secondary access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}