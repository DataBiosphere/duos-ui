import { useState, useEffect} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h2, h3, h4, input, label, span, button } from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import CollaboratorList from './CollaboratorList';
import { isEmpty, isNil, get } from 'lodash/fp';
import { FormField, FormValidators, FormFieldTypes } from '../../components/forms/forms';
import './dar_application.css';

const linkStyle = {color: '#2FA4E7'};
const profileLink = h(Link, {to:'/profile', style: linkStyle}, ['Your Profile']);
const profileUnsubmitted = span(['Please submit ', profileLink, ' to be able to create a Data Access Request']);
const profileSubmitted = span(['Please make sure ', profileLink, ' is updated as it will be used to pre-populate parts of the Data Access Request']);
const libraryCardLink = a({href: 'https://broad-duos.zendesk.com/hc/en-us/articles/4402736994971-Researcher-FAQs', style: linkStyle, target: '_blank'}, ['Library Card']);
const missingLibraryCard = span(['You must submit ', profileLink, ' and obtain a ', libraryCardLink, ' from your Signing Official before you can submit a Data Access Request']);

export default function ResearcherInfoNew(props) {
  const {
    allSigningOfficials,
    completed,
    darCode,
    cloudProviderDescription,
    eRACommonsDestination,
    externalCollaborators,
    formFieldChange,
    internalCollaborators,
    labCollaborators,
    location,
    onNihStatusUpdate,
    partialSave,
    researcher,
    showValidationMessages,
    nextPage,
    cloudProviderType,
    cloudProvider,
    isCloudUseInvalid,
    isAnvilUseInvalid,
    ariaLevel = 2
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
  const [checkCollaborator, setCheckCollaborator] = useState(props.checkCollaborator);//
  const [checkNihDataOnly, setCheckNihDataOnly] = useState(props.checkNihDataOnly);//
  const [signingOfficial, setSigningOfficial] = useState();//
  const [itDirector, setITDirector] = useState(props.itDirector || '');//
  const [principalInvestigator, setPrincipalInvestigator] = useState(props.principalInvestigator || '');//
  const [anvilUse, setAnvilUse] = useState(props.anvilUse || '');
  const [cloudUse, setCloudUse] = useState(props.cloudUse || '');
  const [localUse, setLocalUse] = useState(props.localUse || '');
  const [researcherUser, setResearcherUser] = useState(props.researcherUser);//
  const [libraryCardReqSatisfied, setLibraryCardReqSatisfied] = useState(false);

  useEffect(() => {
    setLibraryCardReqSatisfied(!isEmpty(get('libraryCards')(researcherUser)) || checkNihDataOnly);
  }, [checkNihDataOnly, researcherUser]);

  useEffect(() => {
    setSigningOfficial(props.signingOfficial);
    setCheckCollaborator(props.checkCollaborator);
    setCheckNihDataOnly(props.checkNihDataOnly);
    setITDirector(props.itDirector);
    setPrincipalInvestigator(props.principalInvestigator);
    setAnvilUse(props.anvilUse);
    setCloudUse(props.cloudUse);
    setLocalUse(props.localUse);
    setResearcherUser(props.researcherUser);
  }, [props.signingOfficial, props.checkCollaborator, props.itDirector, props.principalInvestigator, props.anvilUse, props.cloudUse, props.localUse, props.researcherUser, props.checkNihDataOnly]);

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

  return (
    div({ datacy: 'researcher-info'}, [
      div({ style: { backgroundColor: 'rgba(184, 205, 211, .15)', padding: '20px 30px' } }, [
        div({
          datacy: 'researcher-info-profile-submitted',
          isRendered: (completed === true && libraryCardReqSatisfied), className: 'rp-alert' }, [
          Alert({
            id: 'profileSubmitted',
            type: 'important',
            title: span([
              `You must submit `, profileLink, ` and obtain a `, libraryCardLink,
              ` from your Signing official before you can submit a Data Access Request.`
            ])
          })
        ]),

        h2('Step 1: Researcher Information'),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: `researcher_name`,
            placeholder: 'Enter Firstname Lastname',
            title: '1.1 Researcher',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            onChange: ({key: name, value}) => formFieldChange({name, value}),
            defaultValue: researcher,
          }),
        ]),

        div({className: 'dar-application-row'}, [
          h3('1.2 Researcher Identification'),
          span({ className: 'default-color' }, [
            'Please authenticate with ',
            a({ target: '_blank', href: 'https://era.nih.gov/reg-accounts/register-commons.htm' }, ['eRA Commons']), ' in order to proceed.'
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start', alignItems: 'flex-start' } }, [
            h4({ style: { marginRight: 30, marginTop: 30 } }, '1.2.1'),
            eRACommons({
              destination: eRACommonsDestination,
              onNihStatusUpdate: onNihStatusUpdate,
              location: location,
              validationError: showValidationMessages,
              header: true
            })
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
            h4({ style: { marginRight: 30 } }, '1.2.2'),
            h(FormField, {
              id: 'checkNihDataOnly',
              toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am exclusively applying for NIH data (ex. GTex)']),
              type: FormFieldTypes.CHECKBOX,
              ariaLevel: ariaLevel + 2,
              onChange: ({key: name, value}) => formFieldChange({name, value}),
              defaultValue: checkNihDataOnly
            })
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
            h4({ style: { marginRight: 30 } }, '1.2.3'),
            h(FormField, {
              id: 'checkCollaborator',
              toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am an NIH intramural researcher (NIH email required)']),
              type: FormFieldTypes.CHECKBOX,
              ariaLevel: ariaLevel + 2,
              onChange: ({key: name, value}) => formFieldChange({name, value}),
              defaultValue: checkCollaborator
            })
          ]),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: `principal_investigator`,
            description: 'I certify that the prinicpal investigator listed below is aware of this study',
            placeholder: 'Firstname Lastname',
            title: '1.3 Principal Investigator',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            onChange: ({key: name, value}) => formFieldChange({name, value}),
            defaultValue: principalInvestigator
          })
        ]),

        div({className: 'dar-application-row'}, [
          // TODO: DUOS-1753
          h3('1.4 Internal Lab Staff'),
          div(
            `Please add internal Lab Staff here. Internal Lab Staff are defined as users of data from
            this data access request, including any that are downloaded or utilized in the cloud. 
            please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
            level here.`
          ),
          button({
            type: 'button', // default button element type inside a form is "submit".
            className: 'button button-white btn-xs',
            style: { marginTop: 25 },
            onClick: () => {}
          }, ['Add Collaborator'])
        ]),

        div({className: 'dar-application-row'}, [
          // TODO: DUOS-1754
          h3('1.5 Internal Collaborators'),
          div(
            `Please add Internal Collaborators here Internal Collaborators are defined as individuals
            who are not under the direct supervision of the PI (e.g., not a member of the PI's 
            laboratory) who assists with the PI's research project involving controlled-access data 
            subject to the NIH GDS Policy. Internal collaborators are employees of the Requesting 
            PI's institution and work at the same location/campus as the PI. Internal Collaborators 
            must be at the PI or equivalent level and are required to have a Library Card in order 
            to access data through this request. Internal Collaborators will have Data 
            Downloader/Approver status so that they may add their own relevant Internal Lab Staff. 
            Internal Collaborators will not be required to submit an independent DAR to collaborate 
            on this project.`
          ),
          button({
            type: 'button', // default button element type inside a form is "submit".
            className: 'button button-white',
            style: { marginTop: 25 },
            onClick: () => {}
          }, ['Add Collaborator'])
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: 'signingOfficial',
            type: FormFieldTypes.SELECT,
            description: 'I certify that the individual listed below is my Institutional Signing official',
            title: '1.6 Institutional Signing Official',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            defaultValue: signingOfficial,
            onChange: ({key: name, value}) => {
              const formattedValue = isNil(value) ? '' : formatSOString(value.displayName, value.email);
              formFieldChange({name, value: formattedValue});
            },
            selectOptions: allSigningOfficials,
            creatableConfig: {
              placeholder: 'Signing Official',
              getOptionLabel: (option) => formatSOString(option.displayName, option.email), //formats labels on dropdown
              getNewOptionData: (inputValue) => { //formats user input into object for use within Creatable
                return { displayName: inputValue };
              },
              getOptionValue: (option) => { //value formatter for options, attr used to ensure empty strings are treated as undefined
                if(isNil(option) || isEmpty(option.displayName)) {
                  return null;
                }
                return option;
              }
            },
          }),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: 'itDirector',
            description: 'I certify that the individual listed below is my IT Director',
            placeholder: 'IT Director',
            title: '1.7 Information Technology (IT) Director',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            onChange: ({key: name, value,}) => formFieldChange({name, value}),
            defaultValue: itDirector
          })
        ]),

        div({className: 'dar-application-row'}, [
          h3(['1.8 Cloud Use Statement*']),
          span([
            'Will you perform all of your data storage and analysis for this project on the ',
            a({
              rel: 'noopener noreferrer',
              href: 'https://anvil.terra.bio/',
              target: '_blank'
            }, ['AnVIL']),
            '?'
          ]),
          div([cloudRadioGroup])
        ]),

        div({className: 'dar-application-row'}, [
          div({className: 'row no-margin'}, [
            div({
              isRendered: !anvilUse && anvilUse !== '',
              className: 'computing-use-container',
              style: {
                backgroundColor: showValidationMessages && isCloudUseInvalid ? 'rgba(243, 73, 73, 0.19)' : 'inherit'
              }
            }, [
              div({className: 'row no-margin'}, [
                div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                  h(FormField, {
                    id: 'cloudUse',
                    disabled: !isNil(darCode),
                    validators: [FormValidators.REQUIRED],
                    type: FormFieldTypes.CHECKBOX,
                    toggleText: 'I am requesting permission to use cloud computing to carry out the research described in my Research Use Statement',
                    checked: cloudUse,
                    onChange: ({ key: name, value }) => formFieldChange({name, value})
                  })
                ])
              ]),
              div({className: 'row no-margin'}, [
                div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                  h(FormField, {
                    id: 'localUse',
                    disabled: !isNil(darCode),
                    validators: [FormValidators.REQUIRED],
                    type: FormFieldTypes.CHECKBOX,
                    toggleText: 'I am requesting permission to use local computing to carry out the research described in my Research Use Statement',
                    checked: localUse,
                    onChange: ({ key: name, value }) => formFieldChange({name, value})
                  })
                ])
              ]),
            ]),
            div({className: 'row no-margin', isRendered: cloudUse === true}, [
              div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                h(FormField, {
                  id: 'cloudProvider',
                  title: 'Name of Cloud Provider',
                  onChange: ({ key: name, value }) => formFieldChange({name, value}),
                  defaultValue: cloudProvider,
                  validators: [FormValidators.REQUIRED],
                  disabled: !isEmpty(darCode)
                })
              ]),
              div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                h(FormField, {
                  id: 'cloudProviderType',
                  title: 'Type of Cloud Provider',
                  defaultValue: cloudProviderType,
                  validators: [FormValidators.REQUIRED],
                  disabled: !isNil(darCode),
                  onChange: ({ key: name, value }) => formFieldChange({name, value})
                })
              ])
            ]),
            div({className: 'row no-margin', isRendered: cloudUse === true}, [
              div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                h(FormField, {
                  id: 'cloudProviderDescription',
                  type: FormFieldTypes.TEXTAREA,
                  defaultValue: cloudProviderDescription,
                  disabled: !isNil(darCode),
                  validators: [FormValidators.REQUIRED],
                  placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
                  + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
                  + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
                  rows: 6,
                  maxLength: 2000,
                  onChange: ({ key: name, value}) => formFieldChange({name, value})
                }),
                // textarea({
                //   style: {
                //     backgroundColor: cloudInputStyle(cloudProviderDescription).backgroundColor,
                //     width: '100%',
                //     padding: '1rem'
                //   },
                //   defaultValue: cloudProviderDescription,
                //   disabled: !isNil(darCode),
                //   onBlur: (e) => formFieldChange({name: 'cloudProviderDescription', value: e.target.value}),
                //   name: 'cloudProviderDescription',
                //   id: 'cloudProviderDescription',
                //   rows: '6',
                //   required: true,
                //   placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
                //     + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
                //     + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
                //   maxLength: 2000
                // })
              ])
            ])
          ])
        ]),

        div({className: 'dar-application-row'}, [
          // TODO: DUOS-1754
          h3('1.9 External Collaborators'),
          div(
            `Please list External collaborators here. External Collaborators are not employees of the 
            Requesting PI's institution and/or do not work at the same location as the PI, and 
            consequently must be independently approved to access controlled-access data subject to 
            the GDS Policy. External Collaborators must be at the PI or equivalent level and are not 
            required to have a Library Card in order to access data, although it is encouraged. Note: 
            External Collaborators must submit an independent DAR approved by their signing Official 
            to collaborate on this project. External Collaborators will be able to add their Lab Staff, 
            as needed, via their independent DAR. Approval of this DAR does not indicate approval of 
            the External Collaborators listed.`
          ),
          button({
            type: 'button', // default button element type inside a form is "submit".
            className: 'button button-white',
            style: { marginTop: 25 },
            onClick: () => {}
          }, ['Add Collaborator'])
        ])

      ]),

      fieldset({ disabled: !isNil(darCode) }, [

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
                '1.3 Internal Lab Staff',
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
                '1.4 Internal Collaborators',
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
            // div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
            //   label({className: 'control-label rp-title-question'}, [
            //     '1.7 Cloud Use Statement*',
            //     span([
            //       'Will you perform all of your data storage and analysis for this project on the ',
            //       a({
            //         rel: 'noopener noreferrer',
            //         href: 'https://anvil.terra.bio/',
            //         target: '_blank'
            //       }, ['AnVIL']),
            //       '?'
            //     ]),
            //   ]),
            // ]),
            // div({className: 'row no-margin'}, [
            //   div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
            //     cloudRadioGroup
            //   ]),
            // ]),
            // div({
            //   isRendered: !anvilUse && anvilUse !== '',
            //   className: 'computing-use-container',
            //   style: {
            //     backgroundColor: showValidationMessages && isCloudUseInvalid ? 'rgba(243, 73, 73, 0.19)' : 'inherit'
            //   }
            // }, [
            //   div({className: 'row no-margin'}, [
            //     div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
            //       input({
            //         type: 'checkbox',
            //         id: 'cloud-requested',
            //         name: 'cloudUse',
            //         className: 'checkbox-inline rp-checkbox',
            //         disabled: !isNil(darCode),
            //         required: true,
            //         checked: cloudUse,
            //         onChange: (e) => formFieldChange({name: 'cloudUse', value: e.target.checked})
            //       }),
            //       label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'cloud-requested' },
            //         ['I am requesting permission to use cloud computing to carry out the research described in my Research Use Statement']
            //       )
            //     ])
            //   ]),
            //   div({className: 'row no-margin'}, [
            //     div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
            //       input({
            //         type: 'checkbox',
            //         id: 'local-requested',
            //         name: 'localUse',
            //         className: 'checkbox-inline rp-checkbox',
            //         disabled: !isNil(darCode),
            //         required: true,
            //         checked: localUse,
            //         onChange: (e) => formFieldChange({name: 'localUse', value: e.target.checked})
            //       }),
            //       label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'local-requested' },
            //         ['I am requesting permission to use local computing to carry out the research described in my Research Use Statement']
            //       )
            //     ])
            //   ]),
            // ]),
            // div({className: 'row no-margin', isRendered: cloudUse === true}, [
            //   div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
            //     label({className: 'control-label'}, ['Name of Cloud Provider']),
            //     input({
            //       style: cloudInputStyle(cloudProvider),
            //       type: 'text',
            //       name: 'cloud-provider-name',
            //       defaultValue: cloudProvider || '',
            //       className: 'form-control',
            //       required: true,
            //       disabled: !isEmpty(darCode),
            //       onBlur: (e) => formFieldChange({name: 'cloudProvider', value: e.target.value})
            //     })
            //   ]),
            //   div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
            //     label({className: 'control-label'}, ['Type of Cloud Provider']),
            //     input({
            //       style: cloudInputStyle(cloudProviderType),
            //       type: 'text',
            //       name: 'provider-type-name',
            //       defaultValue: cloudProviderType || '',
            //       className: 'form-control',
            //       required: true,
            //       disabled: !isNil(darCode),
            //       onBlur: (e) => formFieldChange({name: 'cloudProviderType', value: e.target.value})
            //     })
            //   ])
            // ]),
            // div({className: 'row no-margin', isRendered: cloudUse === true}, [
            //   div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
            //     textarea({
            //       style: {
            //         backgroundColor: cloudInputStyle(cloudProviderDescription).backgroundColor,
            //         width: '100%',
            //         padding: '1rem'
            //       },
            //       defaultValue: cloudProviderDescription,
            //       disabled: !isNil(darCode),
            //       onBlur: (e) => formFieldChange({name: 'cloudProviderDescription', value: e.target.value}),
            //       name: 'cloudProviderDescription',
            //       id: 'cloudProviderDescription',
            //       rows: '6',
            //       required: true,
            //       placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
            //         + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
            //         + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
            //       maxLength: 2000
            //     })
            //   ])
            // ])
          ])
        ]),
        div({ className: 'form-group'}, [
          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
              label({ className: 'control-label rp-title-question' }, [
                '1.8 External Collaborators',
                span([
                  `Please list External collaborators here. External Collaboratos are not employees of the Requesting PI's institution and/or do not work
                at the same location as the PI, and consequently must be independently approved to access controlled-access data subject to the GDS 
                Policy. External Collaborators must be at the PI or equivalent level and are not required to have a Library Card in order to access data,
                although it is encouraged. Note: External Collaborators must submit an independent DAR approved by their signing Official
                to collaborate on this project. External Collaborators will be able to add their Lab Staff, as needed, via their independent DAR. Approval of
                this Data Access Request does not indicate approval of the External Collaborators listed.`
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
