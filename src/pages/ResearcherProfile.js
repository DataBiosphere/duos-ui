import {useState, useEffect} from 'react';
import {getNames} from 'country-list';
import {cloneDeep, find, get, isEmpty, isNil, omit, omitBy, trim} from 'lodash';
import ReactTooltip from 'react-tooltip';
import {button, div, form, h, hh, hr, ul, li, input, label, option, select, span, textarea,} from 'react-hyperscript-helpers';
import {LibraryCards} from '../components/LibraryCards';
import {ConfirmationDialog} from '../components/ConfirmationDialog';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {YesNoRadioGroup} from '../components/YesNoRadioGroup';
import {Notification} from '../components/Notification';
import {SearchSelect} from '../components/SearchSelect';
import {Institution, Researcher, User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import {Alert} from '../components/Alert';
import {Storage} from '../libs/storage';
import {getPropertyValuesFromUser, setUserRoleStatuses, USER_ROLES,} from '../libs/utils';

export default function ResearcherProfile(props) {
  
  // temporary empty definitions
  const stateNames = [];
  const countryNames = [];
  
  const showIncompleteFields = () => {
    return ul({}, [
      li({}, [
        ['List of']
      ]),
      li({}, [
        ['invalid fields']
      ]),
      li({}, [
        ['will go here']
      ])
    ])
  }
  
  return (
    div({ className: 'container' }, [
      div({ className: 'row no-margin' }, [
        div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          // Notification({notificationData}),
          PageHeading({
            id: 'researcherProfile',
            color: 'common',
            title: 'Your Profile',
            description: 'Please complete the following information to be able to request access to dataset(s)'
          }),
          hr({ className: 'section-separator' })
        ]),
        div({ className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding' }, [
          form({ name: 'researcherForm' }, [
            div({ className: 'form-group' }, [
              div({ className: 'col-xs-12' }, [
                label({
                  id: 'lbl_profileName', className: 'control-label'
                }, ['Full Name*']),
                input({
                  id: 'profileName',
                  name: 'profileName',
                  type: 'text',
                  className: 'form-control',
                  value: '',
                }),
              ]),

              div({ className: 'col-xs-12' }, [
                label({
                  id: 'lbl_profileAcademicEmail',
                  className: 'control-label'
                }, ['Academic/Business Email Address']),
                input({
                  id: 'profileAcademicEmail',
                  name: 'academicEmail',
                  type: 'email',
                  value: '',
                  className: 'form-control',
                  disabled: true
                })
              ]),

              div({ className: 'col-xs-12 rp-group checkbox' }, [
                input({
                  type: 'checkbox',
                  id: 'chk_sendNotificationsAcademicEmail',
                  name: 'checkNotifications',
                  className: 'checkbox-inline rp-checkbox',
                  checked: ''
                }),
                label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_sendNotificationsAcademicEmail' },
                  ['Send Notifications to my Academic/Business Email Address'])
              ]),

              div({ className: 'col-xs-12' }, [
                label({
                  id: 'lbl_notificationsEmail', className: 'control-label'
                }, ['Enter an additional email to receive DUOS notifications ', span({ className: 'italic display-inline' }, ['(optional)'])]),
                input({
                  id: 'additionalEmail',
                  name: 'additionalEmail',
                  type: 'text',
                  className: 'form-control',
                  value: ''
                }),
                // span({
                  // className: 'cancel-color required-field-error-span',
                  // isRendered: (additionalEmail.indexOf('@') === -1) && showValidationMessages
                // }, ['Email Address is empty or has invalid format'])
              ])
            ]),

            div({ className: 'form-group' }, [
              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ className: 'control-label rp-title-question default-color' }, [
                  'Researcher Identification*',
                  span({}, ['Please authenticate your eRA Commons account to submit Data Access Requests. Other profiles are optional:'])
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  eRACommons({
                    className: 'col-md-4 col-sm-6 col-xs-12',
                    destination: 'profile',
                    onNihStatusUpdate: () => {},
                    location: props.location
                  }),
                  div({ className: '' }, [
                    label({ id: 'lbl_profileLibraryCard', className: 'control-label' }, ['Library Cards']),
                    // LibraryCards({
                      // style: { display: 'flex', flexFlow: 'row wrap' },
                      // isRendered: !isNil(libraryCards),
                      // libraryCards: libraryCards
                    // })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileLinkedIn', className: 'control-label' }, ['LinkedIn Profile']),
                    input({
                      id: 'profileLinkedIn',
                      name: 'linkedIn',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileOrcid', className: 'control-label' }, ['ORCID iD']),
                    input({
                      id: 'profileOrcid',
                      name: 'orcid',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileResearcherGate', className: 'control-label' }, ['ResearchGate ID']),
                    input({
                      id: 'profileResearcherGate',
                      name: 'researcherGate',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                  'Institution Name* ',
                  // span({
                    // className: 'glyphicon glyphicon-question-sign tooltip-icon',
                    // 'data-tip': (isSigningOfficial && !isNil(institutionId)) ?
                      // 'As a "Signing Official", your institution cannot be changed here. Please submit a support request via the "Contact Us" form to have it changed.' :
                      // 'If your preferred institution cannot be found, please submit a support request via the "Contact Us" form to have it added.',
                    // 'data-for': 'tip_profileState',
                  // })
                ]),
                // generateInstitutionSelectionDisplay()
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileDepartment', className: 'control-label' }, ['Department*']),
                    input({
                      id: 'profileDepartment',
                      name: 'department',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ]),
                  div({ className: 'col-xs-6' }, [
                    label({
                      id: 'lbl_profileDivision',
                      className: 'control-label'
                    }, ['Division ', span({ className: 'italic' }, ['(optional)'])]),
                    input({
                      id: 'profileDivision',
                      name: 'division',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileAddress1', className: 'control-label' }, ['Street Address 1*']),
                    input({
                      id: 'profileAddress1',
                      name: 'address1',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ]),
                  div({ className: 'col-xs-6' }, [
                    label({
                      id: 'lbl_profileAddress2',
                      className: 'control-label'
                    }, ['Street Address 2 ', span({ className: 'italic' }, ['(optional)'])]),
                    input({
                      id: 'profileAddress2',
                      name: 'address2',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileCity', className: 'control-label' }, ['City*']),
                    input({
                      id: 'profileCity',
                      name: 'city',
                      type: 'text',
                      className: 'form-control',
                      value: ''
                    })
                  ]),

                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileState', className: 'control-label'}, ['State* ',
                      span({
                        className: 'glyphicon glyphicon-question-sign tooltip-icon',
                        'data-tip': 'State cannot be selected if a non-US Country is selected.',
                        'data-for': 'tip_profileState',
                      })
                    ]),
                    select({
                      id: 'profileState',
                      name: 'state',
                      value: '',
                      className: 'form-control',
                      // disabled: (profile.country !== '' && profile.country !== 'United States of America')
                    }, stateNames )
                  ])
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-xs-6 rp-group' }, [
                    label({ id: 'lbl_profileZip', className: 'control-label' }, ['Zip/Postal Code*']),
                    input({
                      id: 'profileZip',
                      name: 'zipcode',
                      type: 'text',
                      className: 'form-control',
                      value: '',
                    })
                  ]),

                  div({ className: 'col-xs-6 rp-group' }, [
                    label({ id: 'lbl_profileCountry', className: 'control-label' }, ['Country*']),
                    select({
                      id: 'profileCountry',
                      name: 'country',
                      value: '',
                      className: 'form-control',
                    }, countryNames )
                  ])
                ])
              ])
            ]),

            div({ className: 'form-group' }, [
              div({ className: 'col-xs-12', style: { 'marginTop': '15px' } }, [
                label({
                  id: 'lbl_isThePI',
                  className: 'control-label '
                }, [
                  'Are you the Principal Investigator?* ',
                  span({
                    className: 'glyphicon glyphicon-question-sign tooltip-icon',
                    'data-tip': 'This information is required in order to classify users as bona fide researchers as part of the process of Data Access approvals.',
                    'data-for': 'tip_isThePI'
                  })
                ])
              ]),

              div({ className: 'col-xs-12 rp-group' }, [
                YesNoRadioGroup({
                  value: '',
                  id: 'rad_isThePI',
                  name: 'isThePI'
                })
              ])
            ]),

            div({
              // isRendered: profile.isThePI === 'false',
              className: 'form-group'
            }, [

              div({ className: 'col-xs-12' }, [
                label({
                  className: 'control-label '
                }, ['Do you have a Principal Investigator?*'])
              ]),

              div({ className: 'col-xs-12 rp-group' }, [
                YesNoRadioGroup({
                  value: '',
                  id: 'rad_havePI',
                  name: 'havePI',
                })
              ]),

              div({
                // isRendered: profile.havePI === true || profile.havePI === 'true',
                className: 'form-group'
              }, [
                div({ className: 'col-xs-12' }, [
                  label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                  input({
                    id: 'profilePIName',
                    name: 'piName',
                    type: 'text',
                    className: 'form-control ',
                    value: '',
                  }),
                ]),

                div({ className: 'col-xs-12' }, [
                  label({
                    id: 'lbl_profilePIEmail',
                    className: 'control-label'
                  }, ['Principal Investigator Email Address*']),
                  input({
                    id: 'profilePIEmail',
                    name: 'piEmail',
                    type: 'email',
                    className: 'form-control ',
                    value: ''
                  })
                ]),

                div({ className: 'col-xs-12' }, [
                  label({
                    id: 'lbl_profileEraCommons',
                    className: 'control-label'
                  }, ['eRA Commons ID ', span({ className: 'italic' }, ['(optional)'])]),
                  input({
                    id: 'profileEraCommons',
                    name: 'eRACommonsID',
                    type: 'text',
                    className: 'form-control',
                    value: ''
                  })
                ])
              ])
            ]),

            div({ className: 'form-group' }, [
              div({ className: 'col-xs-12' }, [
                label({
                  id: 'lbl_profilePubmedID',
                  className: 'control-label'
                }, ['Pubmed ID of a publication ', span({ className: 'italic' }, ['(optional)'])]),
                input({
                  id: 'profilePubmedID',
                  name: 'pubmedID',
                  type: 'text',
                  className: 'form-control',
                  value: ''
                })
              ]),

              div({ className: 'col-xs-12 rp-last-group' }, [
                label({
                  id: 'lbl_profileScientificURL',
                  className: 'control-label'
                }, ['URL of a scientific publication ', span({ className: 'italic' }, ['(optional)'])]),
                textarea({
                  id: 'profileScientificURL',
                  name: 'scientificURL',
                  className: 'form-control',
                  maxLength: '512',
                  rows: '3',
                  value: ''
                })
              ])
            ]),
            
            div ({ className: 'row no-margin' }, [
              div ({
                // isRendered: showValidationMessages,
                className: 'col-xs-12'
              },[
                Alert({
                  id: 'researcherIncompleteFields',
                  type: 'info', 
                  title: 'Researchers: Please complete the following required fields before submitting Data Access Requests',
                  description: showIncompleteFields()
                })
              ])
            ]),
            
            div({ className: 'row margin-top-20' }, [
              div({ className: 'col-lg-4 col-xs-6' }, [
                div({ className: 'italic default-color' }, ['*Required field'])
              ]),

              div({ className: 'col-lg-8 col-xs-6' }, [
                button({
                  id: 'btn_submit',
                  // onClick: submitForm,
                  className: 'f-right btn-primary common-background'
                }, [
                  'Submit'
                ]),
                h(ReactTooltip, {
                  id: 'tip_profileState',
                  place: 'left',
                  effect: 'solid',
                  multiline: true,
                  className: 'tooltip-wrapper'
                }),
                h(ReactTooltip, {
                  id: 'tip_isThePI',
                  place: 'left',
                  effect: 'solid',
                  multiline: true,
                  className: 'tooltip-wrapper'
                })
              ])
            ])
          ])
        ])
      ])
    ])
  );
}