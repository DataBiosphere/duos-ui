import { useState, useEffect} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h2, h3, h4, span } from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import CollaboratorList from './collaborator/CollaboratorList';
import { isEmpty, isNil, get } from 'lodash/fp';
import { FormField, FormValidators, FormFieldTypes } from '../../components/forms/forms';
import './dar_application.css';

const linkStyle = {color: '#2FA4E7'};
const profileLink = h(Link, {to:'/profile', style: linkStyle}, ['Your Profile']);
const profileUnsubmitted = span(['Please submit ', profileLink, ' to be able to create a Data Access Request']);
const profileSubmitted = span(['Please make sure ', profileLink, ' is updated as it will be used to pre-populate parts of the Data Access Request']);
const libraryCardLink = a({href: 'https://broad-duos.zendesk.com/hc/en-us/articles/4402736994971-Researcher-FAQs', style: linkStyle, target: '_blank'}, ['Library Card']);
const missingLibraryCard = span(['You must submit ', profileLink, ' and obtain a ', libraryCardLink, ' from your Signing Official before you can submit a Data Access Request']);

export default function ResearcherInfo(props) {
  const {
    allSigningOfficials,
    readOnlyMode,
    includeInstructions,
    completed,
    darCode,
    eRACommonsDestination,
    formFieldChange,
    location,
    onNihStatusUpdate,
    formData,
    researcher,
    setLabCollaboratorsCompleted,
    setInternalCollaboratorsCompleted,
    setExternalCollaboratorsCompleted,
    showNihValidationError,
    showValidationMessages,
    validation,
    formValidationChange,
    ariaLevel = 2
  } = props;

  const formatSOString = (name, email) => {
    if(isEmpty(name)) { return '';}
    const nameString = `${name}`;
    const emailString = !isNil(email) ? ` (${email})` : '';
    return nameString + emailString;
  };

  const onValidationChange = formValidationChange;

  const [libraryCardReqSatisfied, setLibraryCardReqSatisfied] = useState(false);

  useEffect(() => {
    setLibraryCardReqSatisfied(!isEmpty(get('libraryCards')(researcher)));
  }, [researcher]);

  return (
    div({ datacy: 'researcher-info'}, [
      div({ className: 'dar-step-card' }, [
        div({
          datacy: 'researcher-info-profile-submitted',
          isRendered: (completed === false && libraryCardReqSatisfied === false), className: 'rp-alert' }, [
          !readOnlyMode && Alert({
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
            id: `researcherName`,
            placeholder: 'Enter Firstname Lastname',
            title: '1.1 Researcher',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            defaultValue: researcher.displayName,
            disabled: true
          }),
        ]),

        div({className: 'dar-application-row'}, [
          h3('1.2 Researcher Identification' + (formData.checkCollaborator ? ' (optional)' : '')),
          !readOnlyMode && span({ className: `${showNihValidationError ? 'errored' : 'default-color'}`, isRendered: formData.checkCollaborator !== true }, [
            'Please authenticate with ',
            a({ target: '_blank', href: 'https://era.nih.gov/reg-accounts/register-commons.htm' }, ['eRA Commons']), ' in order to proceed.'
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start', alignItems: 'flex-start' } }, [
            h4({ style: { marginRight: 30, marginTop: 30 } }, '1.2.1'),
            eRACommons({
              destination: eRACommonsDestination,
              researcherProfile: researcher,
              onNihStatusUpdate: onNihStatusUpdate,
              location: location,
              validationError: showNihValidationError,
              readOnly: readOnlyMode,
              header: true,
              required: formData.checkCollaborator !== true,
            })
          ]),
          fieldset({ }, [
            div({
              datacy: 'researcher-info-missing-library-cards',
              isRendered: libraryCardReqSatisfied === false, className: 'rp-alert' }, [
              Alert({ id: 'missingLibraryCard', type: 'danger', title: missingLibraryCard })
            ]),
            div({
              datacy: 'researcher-info-profile-unsubmitted',
              isRendered: (completed === false && libraryCardReqSatisfied === true), className: 'rp-alert' }, [
              Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
            ]),
            div({
              datacy: 'researcher-info-profile-submitted',
              isRendered: (completed === true && libraryCardReqSatisfied === true), className: 'rp-alert' }, [
              Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
            ]),
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
            h4({ style: { marginRight: 30 } }, '1.2.2'),
            h(FormField, {
              id: 'checkCollaborator',
              disabled: readOnlyMode,
              toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am an NIH intramural researcher (NIH email required)']),
              type: FormFieldTypes.CHECKBOX,
              ariaLevel: ariaLevel + 2,
              validation: validation.checkCollaborator,
              onValidationChange,
              onChange: ({key, value}) => formFieldChange({key, value}),
              defaultValue: formData.checkCollaborator
            })
          ]),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: `piName`,
            disabled: readOnlyMode,
            description: 'I certify that the principal investigator listed below is aware of this study',
            placeholder: 'Firstname Lastname',
            title: '1.3 Principal Investigator',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            validation: validation.piName,
            onValidationChange,
            onChange: ({key, value}) => formFieldChange({key, value}),
            defaultValue: formData.piName
          })
        ]),

        div({className: 'dar-application-row', datacy: 'internal-lab-staff'}, [
          h3('1.4 Internal Lab Staff'),
          includeInstructions && div(
            `Please add internal Lab Staff here. Internal Lab Staff are defined as users of data from
            this data access request, including any that are downloaded or utilized in the cloud. 
            please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
            level here. If your DAR is approved, you will be responsible for the appropriate use of the 
            data by each individual listed in this section.`
          ),
          h(CollaboratorList, {
            formFieldChange,
            collaborators: formData.labCollaborators,
            collaboratorKey: 'labCollaborators',
            collaboratorLabel: 'Internal Lab Member',
            setCompleted: setLabCollaboratorsCompleted,
            validation: validation.labCollaborators,
            onValidationChange,
            showApproval: true,
            disabled: !isEmpty(darCode) || readOnlyMode,
          }),
        ]),

        div({className: 'dar-application-row', datacy: 'internal-collaborators'}, [
          h3('1.5 Internal Collaborators'),
          includeInstructions && div(
            `Please list Internal Collaborators here. Internal Collaborators are defined as individuals
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
          h(CollaboratorList, {
            formFieldChange,
            collaborators: formData.internalCollaborators,
            collaboratorKey: 'internalCollaborators',
            collaboratorLabel: 'Internal Collaborator',
            setCompleted: setInternalCollaboratorsCompleted,
            validation: validation.internalCollaborators,
            onValidationChange,
            showApproval: false,
            disabled: !isEmpty(darCode) || readOnlyMode
          }),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: 'signingOfficial',
            type: FormFieldTypes.SELECT,
            description: 'I certify that the individual listed below is my Institutional Signing official',
            title: '1.6 Institutional Signing Official',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            defaultValue: formData.signingOfficial,
            validation: validation.signingOfficial,
            onValidationChange,
            disabled: readOnlyMode,
            onChange: ({key, value}) => {
              formFieldChange({key, value});
            },
            selectOptions: allSigningOfficials?.map((so) => {
              return formatSOString(so.displayName, so.email);
            }) || [''],
          }),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: 'itDirector',
            disabled: readOnlyMode,
            description: 'I certify that the individual listed below is my IT Director',
            placeholder: 'Enter Firstname Lastname',
            title: '1.7 Information Technology (IT) Director',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            validation: validation.itDirector,
            onValidationChange,
            onChange: ({key, value,}) => formFieldChange({key, value}),
            defaultValue: formData.itDirector
          })
        ]),

        div({className: 'dar-application-row'}, [
          div([
            h(FormField, {
              id: 'anvilUse',
              disabled: readOnlyMode,
              type: FormFieldTypes.RADIOGROUP,
              title: '1.8 Cloud Use Statement',
              description: [span([
                'Will you perform all of your data storage and analysis for this project on the ',
                a({
                  rel: 'noopener noreferrer',
                  href: 'https://anvil.terra.bio/',
                  target: '_blank'
                }, ['AnVIL']),
                '?'
              ])],
              options: [
                { name: 'yes', text: 'Yes' },
                { name: 'no', text: 'No' }
              ],
              validators: [FormValidators.REQUIRED],
              ariaLevel: ariaLevel + 1,
              orientation: 'horizontal',
              validation: validation.anvilUse,
              onValidationChange,
              onChange: ({key, value}) => {
                const normalizedValue = value === 'yes';
                formFieldChange({key, value: normalizedValue});
              },
              defaultValue: formData.anvilUse === true ? 'yes'
                : formData.anvilUse === false ? 'no'
                  : undefined
            }),

            div({className: 'row no-margin'}, [
              div({
                isRendered: formData.anvilUse === false,
                className: 'computing-use-container',
                style: {
                  backgroundColor: showValidationMessages ? 'rgba(243, 73, 73, 0.19)' : 'inherit'
                }
              }, [
                div({className: 'row no-margin'}, [
                  div({className: 'row no-margin'}, [
                    div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                      h(FormField, {
                        id: 'localUse',
                        disabled: !isNil(darCode) || readOnlyMode,
                        validators: [FormValidators.REQUIRED],
                        type: FormFieldTypes.CHECKBOX,
                        toggleText: 'I am requesting permission to use local computing to carry out the research described in my Research Use Statement',
                        defaultValue: formData.localUse,
                        ariaLevel: ariaLevel + 2,
                        validation: validation.localUse,
                        onValidationChange,
                        onChange: ({ key, value }) => formFieldChange({key, value})
                      })
                    ])
                  ]),
                  div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                    h(FormField, {
                      id: 'cloudUse',
                      disabled: !isNil(darCode) || readOnlyMode,
                      validators: [FormValidators.REQUIRED],
                      type: FormFieldTypes.CHECKBOX,
                      toggleText: 'I am requesting permission to use cloud computing to carry out the research described in my Research Use Statement',
                      defaultValue: formData.cloudUse,
                      ariaLevel: ariaLevel + 2,
                      validation: validation.cloudUse,
                      onValidationChange,
                      onChange: ({ key, value }) => formFieldChange({key, value})
                    })
                  ])
                ]),
                div({className: 'row no-margin', isRendered: formData.cloudUse === true}, [
                  div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                    h(FormField, {
                      id: 'cloudProvider',
                      title: 'Name of Cloud Provider',
                      onChange: ({ key, value }) => formFieldChange({key, value}),
                      defaultValue: formData.cloudProvider,
                      validators: [FormValidators.REQUIRED],
                      disabled: !isEmpty(darCode) || readOnlyMode,
                      ariaLevel: ariaLevel + 3,
                      validation: validation.cloudProvider,
                      onValidationChange,
                    })
                  ]),
                  div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                    h(FormField, {
                      id: 'cloudProviderType',
                      title: 'Type of Cloud Provider',
                      defaultValue: formData.cloudProviderType,
                      validators: [FormValidators.REQUIRED],
                      disabled: !isNil(darCode) || readOnlyMode,
                      ariaLevel: ariaLevel + 3,
                      onChange: ({ key, value }) => formFieldChange({key, value}),
                      validation: validation.cloudProviderType,
                      onValidationChange,
                    })
                  ])
                ]),
                div({className: 'row no-margin', isRendered: formData.cloudUse === true}, [
                  div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                    h(FormField, {
                      id: 'cloudProviderDescription',
                      type: FormFieldTypes.TEXTAREA,
                      defaultValue: formData.cloudProviderDescription,
                      disabled: !isNil(darCode) || readOnlyMode,
                      validators: [FormValidators.REQUIRED],
                      placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
                    + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
                    + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
                      rows: 6,
                      maxLength: 2000,
                      ariaLevel: ariaLevel + 3,
                      onChange: ({ key, value}) => formFieldChange({key, value}),
                      validation: validation.cloudProviderDescription,
                      onValidationChange,
                    })
                  ])
                ])
              ])
            ])
          ])
        ]),

        div({className: 'dar-application-row', datacy: 'external-collaborators'}, [
          h3('1.9 External Collaborators'),
          includeInstructions && div(
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
          h(CollaboratorList, {
            formFieldChange,
            collaborators: formData.externalCollaborators,
            collaboratorKey: 'externalCollaborators',
            collaboratorLabel: 'External Collaborator',
            setCompleted: setExternalCollaboratorsCompleted,
            showApproval: false,
            disabled: !isEmpty(darCode) || readOnlyMode,
            validation: validation.externalCollaborators,
            onValidationChange,
          }),
        ])
      ]),
    ])
  );
}