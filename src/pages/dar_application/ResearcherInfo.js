import { useState, useEffect} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h3, input, label, span, textarea} from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import CollaboratorList from './CollaboratorList';
import { isEmpty, isNil, get } from 'lodash/fp';
import Creatable from 'react-select/creatable';

const linkStyle = {color: '#2FA4E7'};
const profileLink = h(Link, {to:'/profile', style: linkStyle}, ['Your Profile']);
const profileUnsubmitted = span(['Please submit ', profileLink, ' to be able to create a Data Access Request']);
const profileSubmitted = span(['Please make sure ', profileLink, ' is updated as it will be used to pre-populate parts of the Data Access Request']);
const libraryCardLink = a({href: 'https://broad-duos.zendesk.com/hc/en-us/articles/4402736994971-Researcher-FAQs', style: linkStyle, target: '_blank'}, ['Library Card']);
const missingLibraryCard = span(['You must submit ', profileLink, ' and obtain a ', libraryCardLink, ' from your Signing Official before you can submit a Data Access Request']);

export default function ResearcherInfo(props) {
  const {
    allSigningOfficials,
    completed,
    darCode,
    cloudProviderDescription,
    eRACommonsDestination,
    externalCollaborators,
    formFieldChange,
    internalCollaborators,
    invalidInvestigator,
    invalidResearcher,
    investigator,
    labCollaborators,
    linkedIn,
    location,
    nihValid,
    onNihStatusUpdate,
    orcid,
    partialSave,
    researcher,
    researcherGate,
    showValidationMessages,
    nextPage,
    cloudProviderType,
    cloudProvider,
    isCloudUseInvalid,
    isCloudProviderInvalid,
    isAnvilUseInvalid
  } = props;

  const navButtonContainerStyle = {
    marginTop: '5rem'
  };

  const formatSOString = (name, email) => {
    if(isEmpty(name)) { return '';}
    const nameString = `${name}`;
    const emailString = !isNil(email) ? ` (${email})` : '';
    return nameString + emailString;
  };

  //initial state variable assignment
  const [checkCollaborator, setCheckCollaborator] = useState(props.checkCollaborator);
  const [checkNihDataOnly, setCheckNihDataOnly] = useState(props.checkNihDataOnly);
  const [signingOfficial, setSigningOfficial] = useState();
  const [itDirector, setITDirector] = useState(props.itDirector || '');
  const [anvilUse, setAnvilUse] = useState(props.anvilUse || '');
  const [cloudUse, setCloudUse] = useState(props.cloudUse || '');
  const [localUse, setLocalUse] = useState(props.localUse || '');
  const [researcherUser, setResearcherUser] = useState(props.researcherUser);
  const [libraryCardReqSatisfied, setLibraryCardReqSatisfied] = useState(false);

  useEffect(() => {
    setLibraryCardReqSatisfied(!isEmpty(get('libraryCards')(researcherUser)) || checkNihDataOnly);
  }, [checkNihDataOnly, researcherUser]);

  useEffect(() => {
    setSigningOfficial(props.signingOfficial);
    setCheckCollaborator(props.checkCollaborator);
    setCheckNihDataOnly(props.checkNihDataOnly);
    setITDirector(props.itDirector);
    setAnvilUse(props.anvilUse);
    setCloudUse(props.cloudUse);
    setLocalUse(props.localUse);
    setResearcherUser(props.researcherUser);
  }, [props.signingOfficial, props.checkCollaborator, props.itDirector, props.anvilUse, props.cloudUse, props.localUse, props.researcherUser, props.checkNihDataOnly]);

  const cloudRadioGroup = div({
    className: 'radio-inline',
    style: {
      marginBottom: '2rem',
      backgroundColor: showValidationMessages && isAnvilUseInvalid ? 'rgba(243, 73, 73, 0.19)' : 'inherit'
    }
  }, [
    [{label: 'Yes', value: true}, {label: 'No', value: false}].map((option) =>
      label({
        className: 'radio-wrapper',
        key: `anvil-use-option-${option.value}`,
        id: `lbl-anvil-use-option-${option.value}`,
        htmlFor: `rad-anvil-use-option-${option.value}`
      }, [
        input({
          type: 'radio',
          id: `rad-anvil-use-option-${option.value}`,
          name: 'anvil-use-approval-status',
          checked: option.value === anvilUse,
          value: option.value,
          onChange: () => (formFieldChange({name: 'anvilUse', value: option.value}))
        }),
        span({ className: 'radio-check'}),
        span({ className: 'radio-label'}, [option.label])
      ])
    )
  ]);

  const cloudInputStyle = (input) => {
    return {
      backgroundColor: showValidationMessages && isCloudProviderInvalid && isEmpty(input) ? 'rgba(243, 73, 73, 0.19)' :
        isEmpty(darCode) ? 'inherit' : '#eee'
    };
  };

  return (
    div({
      datacy: 'researcher-info',
      className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(darCode) }, [

        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
          input({
            type: 'checkbox',
            id: 'chk_nih_data_only',
            name: 'checkNihDataOnly',
            className: 'checkbox-inline rp-checkbox',
            disabled: !isNil(darCode),
            checked: checkNihDataOnly,
            onChange: (e) => formFieldChange({name: 'checkNihDataOnly', value: e.target.checked})
          }),
          label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_nih_data_only' },
            ['I am exclusively applying for NIH/NHGRI data (ex. GTex)'])
        ]),

        h3({ className: 'rp-form-title access-color' }, ['1. Researcher Information']),

        div({ className: 'form-group' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            label({ className: 'control-label rp-title-question' }, ['1.1 Researcher*'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
            input({
              type: 'text',
              name: 'researcher',
              id: 'inputResearcher',
              value: researcher,
              disabled: true,
              className: invalidResearcher && showValidationMessages ? 'form-control required-field-error' : 'form-control',
              required: true
            }),
            span({
              isRendered: (invalidResearcher) && (showValidationMessages), className: 'cancel-color required-field-error-span'
            }, ['Required field'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
            input({
              type: 'checkbox',
              id: 'chk_collaborator',
              name: 'checkCollaborator',
              className: 'checkbox-inline rp-checkbox',
              disabled: !isNil(darCode),
              checked: checkCollaborator,
              onChange: (e) => formFieldChange({name: 'checkCollaborator', value: e.target.checked})
            }),
            label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_collaborator' },
              ['I am an NIH Intramural researcher (NIH email required), or internal collaborator of the PI for the selected dataset(s)'])
          ]),

          div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12' }, [
            label({ className: 'control-label rp-title-question' }, [
              '1.2 Researcher Identification',
              div({ isRendered: checkCollaborator !== true, className: 'display-inline' }, ['*']),
              div({ isRendered: checkCollaborator === true, className: 'display-inline italic' }, [' (optional)']),
              span({ className: 'default-color' },
                ['Please authenticate with ',
                  a({ target: '_blank', href: 'https://era.nih.gov/reg-accounts/register-commons.htm' }, ['eRA Commons']), ' in order to proceed. Your ORCID iD is optional.'
                ])
            ])
          ]),

          span({
            isRendered: (showValidationMessages && !nihValid && !checkCollaborator), className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 cancel-color required-field-error-span'
          }, ['NIH eRA Authentication is required']),

          div({ className: 'row no-margin' }, [
            eRACommons({
              className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group',
              destination: eRACommonsDestination,
              onNihStatusUpdate: onNihStatusUpdate,
              location: location,
              validationError: showValidationMessages
            }),
            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group' }, [
              label({ className: 'control-label' }, ['LinkedIn Profile']),
              input({
                type: 'text',
                name: 'linkedIn',
                id: 'inputLinkedIn',
                value: linkedIn,
                disabled: true,
                className: 'form-control',
              })
            ])
          ]),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
              label({ className: 'control-label' }, ['ORCID iD']),
              input({
                type: 'text',
                name: 'orcid',
                id: 'inputOrcid',
                value: orcid,
                disabled: true,
                className: 'form-control',
              })
            ]),

            div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
              label({ className: 'control-label' }, ['ResearchGate ID']),
              input({
                type: 'text',
                name: 'researcherGate',
                id: 'inputResearcherGate',
                value: researcherGate,
                disabled: true,
                className: 'form-control',
              })
            ])
          ])
        ]),

        div({ className: 'form-group' }, [
          div( {className: 'row no-margin' }, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              label({ className: 'control-label rp-title-question' }, [
                '1.3 Principal Investigator* ',
                span({}, ['I certify that the principal investigator listed below is aware of this study'])
              ])
            ]),
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              input({
                type: 'text',
                name: 'investigator',
                id: 'inputInvestigator',
                value: investigator,
                disabled: true,
                className: invalidInvestigator && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                required: true
              }),
              span({
                className: 'cancel-color required-field-error-span', isRendered: (invalidInvestigator) && (showValidationMessages)
              }, ['Required field, ensure your Profile has a PI listed, or that you are selected as the PI'])
            ])
          ])
        ]),

        div({
          datacy: 'researcher-info-missing-library-cards',
          isRendered: !libraryCardReqSatisfied, className: 'rp-alert' }, [
          Alert({ id: 'missingLibraryCard', type: 'danger', title: missingLibraryCard })
        ]),
        div({
          datacy: 'researcher-info-profile-unsubmitted',
          isRendered: (completed === false && libraryCardReqSatisfied), className: 'rp-alert' }, [
          Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
        ]),
        div({
          datacy: 'researcher-info-profile-submitted',
          isRendered: (completed === true && libraryCardReqSatisfied), className: 'rp-alert' }, [
          Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
        ]),

        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: 'control-label rp-title-question'}, [
                '1.4 Internal Lab Staff',
                span([`Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this data access request, including any data 
                that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
                level here.`])
              ]),
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              h(CollaboratorList, {
                formFieldChange,
                collaborators: labCollaborators,
                collaboratorKey: 'labCollaborators',
                collaboratorLabel: 'Internal Lab Member',
                showApproval: true,
                disabled: !isEmpty(darCode),
                deleteBoolArray: (new Array(labCollaborators.length).fill(false))
              })
            ])
          ])
        ]),
        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: 'control-label rp-title-question'}, [
                '1.5 Internal Collaborators',
                span([
                  `Please add Internal Collaborators here Internal Collaborators are defined as individuals who are not under the direct supervision of 
                  the PI (e.g., not a member of the PI's laboratory) who assists with the PI's research project involving controlled-access data subject to 
                  the NIH GDS Policy. Internal collaborators are employees of the Requesting PI's institution and work at the same location/campus as
                  the PI. Internal Collaborators must be at the PI or equivalent level and are required to have a Library Card in order to access data
                  through this request. Internal Collaborators will have Data Downloader/Approver status so that they may add their own
                  relevant Internal Lab Staff. Internal Collaborators will not be required to submit an independent DAR to collaborate on this project.`
                ])
              ])
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              h(CollaboratorList, {
                disabled: !isEmpty(darCode),
                formFieldChange,
                collaborators: internalCollaborators,
                collaboratorKey: 'internalCollaborators',
                collaboratorLabel: 'Internal Collaborator',
                deleteBoolArray: (new Array(internalCollaborators.length).fill(false)),
                showApproval: false})
            ])
          ])
        ]),
        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: 'control-label rp-title-question'}, [
                '1.6 Institutional Signing Official*',
                span(['I certify the individual listed below is my Institutional Signing Official.'])
              ])
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              h(Creatable, {
                key: 'selectSO',
                isClearable: true, //ensures that selections can be cleared from dropdown, adds an 'x' within input box
                required: true,
                isDisabled: !isNil(darCode),
                placeholder: 'Select from the list or type your SO\'s full name if it is not present. Clear selection with the Backspace key or the \'X\' at the end of this input box',
                onChange: (option) => {
                  const value = isNil(option) ? '' : formatSOString(option.displayName, option.email);
                  formFieldChange({name: 'signingOfficial', value});
                },
                onInputChange: (input, {action}) => {
                  if(action !== 'input-blur' && action !== 'menu-close') {
                    const value = isNil(input) ? '' : formatSOString(input, null);
                    formFieldChange({name: 'signingOfficial', value});
                  }
                },
                options: allSigningOfficials, //dropdown options
                getOptionLabel: (option) => formatSOString(option.displayName, option.email), //formats labels on dropdown
                getNewOptionData: (inputValue) => { //formats user input into object for use within Creatable
                  return { displayName: inputValue };
                },
                getOptionValue: (option) => { //value formatter for options, attr used to ensure empty strings are treated as undefined
                  if(isNil(option) || isEmpty(option.displayName)) {
                    return null;
                  }
                  return option;
                },
                value: props.signingOfficial
              }),
              span({
                isRendered: showValidationMessages && (isNil(signingOfficial) || isEmpty(signingOfficial.displayName)),
                className: 'cancel-color required-field-error-span'
              }, ['Required field'])
            ])
          ])
        ]),
        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: 'control-label rp-title-question'}, [
                '1.7 Information Technology (IT) Director*',
                span(['I certify the individual listed below is my IT Director.'])
              ])
            ]),
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              input({
                type: 'text',
                defaultValue: itDirector,
                name: 'itDirector',
                required: true,
                className: isEmpty(itDirector) && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                onBlur: (e) => formFieldChange({name: 'itDirector', value: e.target.value})
              }),
              span({
                isRendered: showValidationMessages && isEmpty(itDirector),
                className: 'cancel-color required-field-error-span'
              }, ['Required field'])
            ])
          ])
        ]),
        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: 'control-label rp-title-question'}, [
                '1.8 Cloud Use Statement*',
                span([
                  'Will you perform all of your data storage and analysis for this project on the ',
                  a({
                    rel: 'noopener noreferrer',
                    href: 'https://anvil.terra.bio/',
                    target: '_blank'
                  }, ['AnVIL']),
                  '?'
                ]),
              ]),
            ]),
            div({className: 'row no-margin'}, [
              div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
                cloudRadioGroup
              ]),
            ]),
            div({
              isRendered: !anvilUse && anvilUse !== '',
              className: 'computing-use-container',
              style: {
                backgroundColor: showValidationMessages && isCloudUseInvalid ? 'rgba(243, 73, 73, 0.19)' : 'inherit'
              }
            }, [
              div({className: 'row no-margin'}, [
                div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                  input({
                    type: 'checkbox',
                    id: 'cloud-requested',
                    name: 'cloudUse',
                    className: 'checkbox-inline rp-checkbox',
                    disabled: !isNil(darCode),
                    required: true,
                    checked: cloudUse,
                    onChange: (e) => formFieldChange({name: 'cloudUse', value: e.target.checked})
                  }),
                  label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'cloud-requested' },
                    ['I am requesting permission to use cloud computing to carry out the research described in my Research Use Statement']
                  )
                ])
              ]),
              div({className: 'row no-margin'}, [
                div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                  input({
                    type: 'checkbox',
                    id: 'local-requested',
                    name: 'localUse',
                    className: 'checkbox-inline rp-checkbox',
                    disabled: !isNil(darCode),
                    required: true,
                    checked: localUse,
                    onChange: (e) => formFieldChange({name: 'localUse', value: e.target.checked})
                  }),
                  label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'local-requested' },
                    ['I am requesting permission to use local computing to carry out the research described in my Research Use Statement']
                  )
                ])
              ]),
            ]),
            div({className: 'row no-margin', isRendered: cloudUse === true}, [
              div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                label({className: 'control-label'}, ['Name of Cloud Provider']),
                input({
                  style: cloudInputStyle(cloudProvider),
                  type: 'text',
                  name: 'cloud-provider-name',
                  defaultValue: cloudProvider || '',
                  className: 'form-control',
                  required: true,
                  disabled: !isEmpty(darCode),
                  onBlur: (e) => formFieldChange({name: 'cloudProvider', value: e.target.value})
                })
              ]),
              div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                label({className: 'control-label'}, ['Type of Cloud Provider']),
                input({
                  style: cloudInputStyle(cloudProviderType),
                  type: 'text',
                  name: 'provider-type-name',
                  defaultValue: cloudProviderType || '',
                  className: 'form-control',
                  required: true,
                  disabled: !isNil(darCode),
                  onBlur: (e) => formFieldChange({name: 'cloudProviderType', value: e.target.value})
                })
              ])
            ]),
            div({className: 'row no-margin', isRendered: cloudUse === true}, [
              div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                textarea({
                  style: {
                    backgroundColor: cloudInputStyle(cloudProviderDescription).backgroundColor,
                    width: '100%',
                    padding: '1rem'
                  },
                  defaultValue: cloudProviderDescription,
                  disabled: !isNil(darCode),
                  onBlur: (e) => formFieldChange({name: 'cloudProviderDescription', value: e.target.value}),
                  name: 'cloudProviderDescription',
                  id: 'cloudProviderDescription',
                  rows: '6',
                  required: true,
                  placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
                    + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
                    + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
                  maxLength: 2000
                })
              ])
            ])
          ])
        ]),
        div({ className: 'form-group'}, [
          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              label({ className: 'control-label rp-title-question' }, [
                '1.9 External Collaborators',
                span([
                  `Please list External collaborators here. External Collaboratos are not employees of the Requesting PI's institution and/or do not work
                at the same location as the PI, and consequently must be independently approved to access controlled-access data subject to the GDS 
                Policy. External Collaborators must be at the PI or equivalent level and are not required to have a Library Card in order to access data,
                although it is encouraged. Note: External Collaborators must submit an independent DAR approved by their signing Official
                to collaborate on this project. External Collaborators will be able to add their Lab Staff, as needed, via their independent DAR. Approval of
                this DAR does not indicate approval of the External Collaborators listed.`
                ])
              ])
            ]),
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              h(CollaboratorList, {
                disabled: !isEmpty(darCode),
                formFieldChange,
                collaborators: externalCollaborators,
                collaboratorKey: 'externalCollaborators',
                collaboratorLabel: 'External Collaborator',
                deleteBoolArray: (new Array(externalCollaborators.length).fill(false)),
                showApproval: false
              })
            ])
          ])
        ])
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: navButtonContainerStyle }, [
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
