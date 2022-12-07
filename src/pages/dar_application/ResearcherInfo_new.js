import { useState, useEffect} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h2, h3, h4, span } from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import CollaboratorList_new from './collaborator/CollaboratorList_new';
import { isEmpty, isNil, get } from 'lodash/fp';
import { FormField, FormValidators, FormFieldTypes } from '../../components/forms/forms';
import './dar_application_new.css';

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
    eRACommonsDestination,
    formFieldChange,
    location,
    onNihStatusUpdate,
    formData,
    researcher,
    setLabCollaboratorsCompleted,
    setInternalCollaboratorsCompleted,
    setExternalCollaboratorsCompleted,
    showValidationMessages,
    ariaLevel = 2
  } = props;

  const formatSOString = (name, email) => {
    if(isEmpty(name)) { return '';}
    const nameString = `${name}`;
    const emailString = !isNil(email) ? ` (${email})` : '';
    return nameString + emailString;
  };

  const [libraryCardReqSatisfied, setLibraryCardReqSatisfied] = useState(false);

  useEffect(() => {
    setLibraryCardReqSatisfied(!isEmpty(get('libraryCards')(researcher)) || formData.checkNihDataOnly);
  }, [formData.checkNihDataOnly, researcher]);

  return (
    div({ datacy: 'researcher-info'}, [
      div({ className: 'dar-step-card' }, [
        div({
          datacy: 'researcher-info-profile-submitted',
          isRendered: (completed === false && libraryCardReqSatisfied === false), className: 'rp-alert' }, [
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
          ]),          div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
            h4({ style: { marginRight: 30 } }, '1.2.2'),
            h(FormField, {
              id: 'checkNihDataOnly',
              toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am exclusively applying for NIH data (ex. GTex)']),
              type: FormFieldTypes.CHECKBOX,
              ariaLevel: ariaLevel + 2,
              onChange: ({key, value}) => formFieldChange({key, value}),
              defaultValue: formData.checkNihDataOnly
            })
          ]),
          div({ className: 'flex-row', style: { justifyContent: 'flex-start' } }, [
            h4({ style: { marginRight: 30 } }, '1.2.3'),
            h(FormField, {
              id: 'checkCollaborator',
              toggleText: span({ style: { fontSize: 14, fontWeight: 'bold' }}, ['I am an NIH intramural researcher (NIH email required)']),
              type: FormFieldTypes.CHECKBOX,
              ariaLevel: ariaLevel + 2,
              onChange: ({key, value}) => formFieldChange({key, value}),
              defaultValue: formData.checkCollaborator
            })
          ]),
        ]),

        div({className: 'dar-application-row'}, [
          h(FormField, {
            id: `piName`,
            description: 'I certify that the principal investigator listed below is aware of this study',
            placeholder: 'Firstname Lastname',
            title: '1.3 Principal Investigator',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            onChange: ({key, value}) => formFieldChange({key, value}),
            defaultValue: formData.piName
          })
        ]),

        div({className: 'dar-application-row', datacy: 'internal-lab-staff'}, [
          h3('1.4 Internal Lab Staff'),
          div(
            `Please add internal Lab Staff here. Internal Lab Staff are defined as users of data from
            this data access request, including any that are downloaded or utilized in the cloud. 
            please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
            level here.`
          ),
          h(CollaboratorList_new, {
            formFieldChange,
            collaborators: formData.labCollaborators,
            collaboratorKey: 'labCollaborators',
            collaboratorLabel: 'Internal Lab Member',
            setCompleted: setLabCollaboratorsCompleted,
            showApproval: true,
            disabled: !isEmpty(darCode)
          }),
        ]),

        div({className: 'dar-application-row', datacy: 'internal-collaborators'}, [
          h3('1.5 Internal Collaborators'),
          div(
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
          h(CollaboratorList_new, {
            formFieldChange,
            collaborators: formData.internalCollaborators,
            collaboratorKey: 'internalCollaborators',
            collaboratorLabel: 'Internal Collaborator',
            setCompleted: setInternalCollaboratorsCompleted,
            showApproval: false,
            disabled: !isEmpty(darCode)
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
            description: 'I certify that the individual listed below is my IT Director',
            placeholder: 'Enter Firstname Lastname',
            title: '1.7 Information Technology (IT) Director',
            validators: [FormValidators.REQUIRED],
            ariaLevel: ariaLevel + 1,
            onChange: ({key, value,}) => formFieldChange({key, value}),
            defaultValue: formData.itDirector
          })
        ]),

        div({className: 'dar-application-row'}, [
          div([
            h(FormField, {
              id: 'anvilUse',
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
                        disabled: !isNil(darCode),
                        validators: [FormValidators.REQUIRED],
                        type: FormFieldTypes.CHECKBOX,
                        toggleText: 'I am requesting permission to use local computing to carry out the research described in my Research Use Statement',
                        defaultValue: formData.localUse,
                        ariaLevel: ariaLevel + 2,
                        onChange: ({ key, value }) => formFieldChange({key, value})
                      })
                    ])
                  ]),
                  div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                    h(FormField, {
                      id: 'cloudUse',
                      disabled: !isNil(darCode),
                      validators: [FormValidators.REQUIRED],
                      type: FormFieldTypes.CHECKBOX,
                      toggleText: 'I am requesting permission to use cloud computing to carry out the research described in my Research Use Statement',
                      defaultValue: formData.cloudUse,
                      ariaLevel: ariaLevel + 2,
                      onChange: ({ key, value }) => formFieldChange({key, value})
                    })
                  ])
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
                    disabled: !isEmpty(darCode),
                    ariaLevel: ariaLevel + 3,
                  })
                ]),
                div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 rp-group'}, [
                  h(FormField, {
                    id: 'cloudProviderType',
                    title: 'Type of Cloud Provider',
                    defaultValue: formData.cloudProviderType,
                    validators: [FormValidators.REQUIRED],
                    disabled: !isNil(darCode),
                    ariaLevel: ariaLevel + 3,
                    onChange: ({ key, value }) => formFieldChange({key, value})
                  })
                ])
              ]),
              div({className: 'row no-margin', isRendered: formData.cloudUse === true}, [
                div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
                  h(FormField, {
                    id: 'cloudProviderDescription',
                    type: FormFieldTypes.TEXTAREA,
                    defaultValue: formData.cloudProviderDescription,
                    disabled: !isNil(darCode),
                    validators: [FormValidators.REQUIRED],
                    placeholder: 'Please describe the type(s) of cloud computing service(s) you wish to obtain (e.g PaaS, SaaS, IaaS, DaaS)'
                    + ' and how you plan to use it (them) to carry out the work described in your Research Use Statement (e.g. datasets to be included, process for data transfer)'
                    + ' analysis, storage, and tools and/or software to be used. Please limit your statement to 2000 characters',
                    rows: 6,
                    maxLength: 2000,
                    ariaLevel: ariaLevel + 3,
                    onChange: ({ key, value}) => formFieldChange({key, value})
                  })
                ])
              ])
            ])
          ])
        ]),

        div({className: 'dar-application-row', datacy: 'external-collaborators'}, [
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
          h(CollaboratorList_new, {
            formFieldChange,
            collaborators: formData.externalCollaborators,
            collaboratorKey: 'externalCollaborators',
            collaboratorLabel: 'External Collaborator',
            setCompleted: setExternalCollaboratorsCompleted,
            showApproval: false,
            disabled: !isEmpty(darCode)
          }),
        ])
      ]),
    ])
  );
}
