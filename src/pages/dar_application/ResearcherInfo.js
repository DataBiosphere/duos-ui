import { useState, useEffect} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h3, input, label, span} from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import isNil from 'lodash/fp/isNil';
import CollaboratorList from './CollaboratorList';

const profileLink = h(Link, {to:'/profile', className:'hover-color'}, ['Your Profile']);
const profileUnsubmitted = span(["Please submit ", profileLink, " to be able to create a Data Access Request"]);
const profileSubmitted = span(["Please make sure ", profileLink, " is updated as it will be used to pre-populate parts of the Data Access Request"]);

export default function ResearcherInfo(props) {
  const {
    completed,
    darCode,
    eRACommonsDestination,
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
    nextPage
  } = props;

  const navButtonContainerStyle = {
    marginTop: "5rem"
  };

  //initial state variable assignment
  const [checkCollaborator, setCheckCollaborator] = useState(props.checkCollaborator);

  useEffect(() => {
    setCheckCollaborator(props.checkCollaborator);
  }, [props.checkCollaborator]);

  return (
    div({ className: 'col-lg-10 col-lg-offset-1 col-md-12 col-sm-12 col-xs-12' }, [
      fieldset({ disabled: !isNil(darCode) }, [

        div({ isRendered: completed === false, className: 'rp-alert' }, [
          Alert({ id: 'profileUnsubmitted', type: 'danger', title: profileUnsubmitted })
        ]),
        div({ isRendered: completed === true, className: 'rp-alert' }, [
          Alert({ id: 'profileSubmitted', type: 'info', title: profileSubmitted })
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
                ['Please autenticate with ',
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
              }, ['Required field'])
            ])
          ]) 
        ]),

        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: "control-label rp-title-question"}, [
                '1.4 Internal Lab Staff',
                //NOTE: format this line?
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
                deleteBoolArray: (new Array(labCollaborators.length).fill(false))
              })
            ])
          ])
        ]),

        div({className: 'form-group'}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
              label({className: "control-label rp-title-question"}, [
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
                formFieldChange,
                collaborators: internalCollaborators,
                collaboratorKey: 'internalCollaborators',
                collaboratorLabel: 'Internal Collaborator',
                deleteBoolArray: (new Array(internalCollaborators.length).fill(false)),
                showApproval: false})
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