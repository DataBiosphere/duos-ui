import { useState } from 'react';
import { a, div, fieldset, h3, input, label, span } from 'react-hyperscript-helpers';
import isEmpty from 'lodash/fp/isEmpty';
import { YesNoRadioGroup} from '../../components/YesNoRadioGroup';

export default function ResearchPurposeStatement(props) {

  const {
    addiction,
    darCode,
    formFieldChange,
    forProfit,
    handleRadioChange,
    illegalBehavior,
    nextPage,
    notHealth,
    oneGender,
    partialSave,
    pediatric,
    populationMigration,
    prevPage,
    psychiatricTraits,
    sexualDiseases,
    showValidationMessages,
    stigmatizedDiseases,
    vulnerablePopulation
  } = props;

  const genderLabels = ['Female', 'Male'];
  const genderValues = ['F', 'M'];
  const [gender, setGender] = useState(props.gender);

  const alertBackgroundColor = '#f3494930';

  const genderClickHandler = (genderValue) => {
    formFieldChange({ name: 'gender', value: genderValue });
    setGender(genderValue);
  };

  //NOTE: inputs have both isEmpty and isNil checks
  //currently values are initialized as emptry strings as a way to maintain controlled inputs in components
  //however the inputs, when given a value, can either be a string (as seen with gender), or a boolean
  //isEmpty will give a false negative with booleans and isNil will give a false positive with empty strings

  return(
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isEmpty(darCode) }, [

        h3({ className: 'rp-form-title access-color' }, ['3. Research Purpose Statement']),

        div({ className: 'form-group' }, [
          div({className: 'row no-margin'}, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group row no-margin' }, [
              label({ className: 'control-label rp-title-question' },
                ['3.1 In order to ensure appropriate review, please answer the questions below:'])
            ]),
          ]),
          div({className: 'radio-question-container row no-margin', style: {
            backgroundColor: showValidationMessages && forProfit.toString().length === 0 ? alertBackgroundColor : 'inherit'
          }}, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group ' }, [
              label({ className: 'control-label rp-choice-questions' },
                ['3.1.1 Will this data be used exclusively or partially for a commercial purpose?'])
            ]),
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              YesNoRadioGroup({
                optionLabels: ['Yes, exclusively or partially for a commercial purpose', 'No, non-profit purposes only'],
                value: forProfit, onChange: handleRadioChange, id: 'forProfit', name: 'forProfit',
                required: true
              })
            ]),
          ]),

          div({className: 'radio-question-container row no-margin', style: {
            backgroundColor:
              showValidationMessages && (
                (oneGender.toString().length === 0) ||
                (oneGender && gender.toString().length === 0)
              ) ? alertBackgroundColor : 'inherit'
          }}, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              label({ className: 'control-label rp-choice-questions' }, ['3.1.2 Please indicate if this study is limited to one gender?'])
            ]),
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              YesNoRadioGroup({
                value: oneGender, onChange: handleRadioChange, id: 'oneGender', name: 'oneGender',
                required: true
              }),
              div({
                isRendered: oneGender === 'true' || oneGender === true,
                className: 'multi-step-fields', disabled: !isEmpty(darCode)
              }, [
                span({}, ['Please specify']),
                div({ className: 'radio-inline' }, [
                  genderLabels.map((option, ix) => {
                    return (
                      label({
                        key: 'gender' + ix,
                        onClick: () => genderClickHandler(genderValues[ix]),
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
            ])
          ]),

          div({className: 'radio-question-container row no-margin', style: {
            backgroundColor: showValidationMessages && pediatric.toString().length === 0 ? alertBackgroundColor : 'inherit'
          }}, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: pediatric,
                onChange: handleRadioChange,
                id: 'pediatric',
                name: 'pediatric',
                required: true
              })
            ]),
          ]),

          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && illegalBehavior.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: illegalBehavior,
                onChange: handleRadioChange,
                id: 'illegalBehavior',
                name: 'illegalBehavior',
                required: true
              })
            ])
          ]),

          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && addiction.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: addiction,
                onChange: handleRadioChange,
                id: 'addiction',
                name: 'addiction',
                required: true
              })
            ])
          ]),

          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && sexualDiseases.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: sexualDiseases,
                onChange: handleRadioChange,
                id: 'sexualDiseases',
                name: 'sexualDiseases',
                required: true
              })
            ])
          ]),
          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && stigmatizedDiseases.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.7 Does the research aim involve the study of any stigmatizing illnesses?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: stigmatizedDiseases,
                onChange: handleRadioChange,
                id: 'stigmatizedDiseases',
                name: 'stigmatizedDiseases',
                required: true
              })
            ]),
          ]),

          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && vulnerablePopulation.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or ["SIGNIFICANTLY"] economically or educationally disadvantaged persons)?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: vulnerablePopulation,
                onChange: handleRadioChange,
                id: 'vulnerablePopulation',
                name: 'vulnerablePopulation',
                required: true
              })
            ]),
          ]),

          //NOTE: Question should be disabled since answer is based on whether or not poa is selected
          //Question will reamain here since Executive Board made conscious decision to leave step 3 questions as is
          //Value equivalency is explained on DataAccessRequestApplication comments (in the middle of props assignment for this component)
          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && populationMigration.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions',
              },
              ['3.1.9 Does the research aim involve the study of Population Origins/Migration patterns? (Answer is pre-determined based on selections made in Step 2)',
              ])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: populationMigration,
                id: 'populationMigration',
                name: 'populationMigration',
                required: true,
                disabled: true
              })
            ]),
          ]),
          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && psychiatricTraits.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              YesNoRadioGroup({
                value: psychiatricTraits,
                onChange: handleRadioChange,
                id: 'psychiatricTraits',
                name: 'psychiatricTraits',
                required: true
              })
            ]),
          ]),

          div({
            className: 'radio-question-container row no-margin', style: {
              backgroundColor: showValidationMessages && notHealth.toString().length === 0 ? alertBackgroundColor : 'inherit'
            }
          }, [
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'
            }, [
              label({
                className: 'control-label rp-choice-questions'
              },
              ['3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?'])
            ]),
            div({
              className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group'
            }, [
              YesNoRadioGroup({
                value: notHealth,
                onChange: handleRadioChange,
                id: 'notHealth',
                name: 'notHealth',
                required: true
              })
            ])
          ])
        ])
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
            id: 'btn_save', isRendered: isEmpty(darCode), onClick: partialSave,
            className: 'f-right btn-secondary access-color'
          }, ['Save'])
        ])
      ])
    ])
  );
}
