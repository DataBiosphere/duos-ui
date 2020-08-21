import { useState, useEffect, Fragment} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h3, input, label, span, p } from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import isNil from 'lodash/fp/isNil';
import merge from 'lodash/fp/merge';

const profileLink = h(Link, {to:'/profile', className:'hover-color'}, ['Your Profile']);
const profileUnsubmitted = span(["Please submit ", profileLink, " to be able to create a Data Access Request"]);
const profileSubmitted = span(["Please make sure ", profileLink, " is updated as it will be used to pre-populate parts of the Data Access Request"]);

//NOTE: remember to add parent callback to update collaborator state variable on parent component
const CollaboratorList = (props) => {
  //NOTE: need callback parent from props to update state list on parent container
  //NOTE: need boolean list to keep track of edit view for individual list elements
  //toggle value on edit click, remove from array when corresponding collaborator is deleted from list

  const { formStateChange, collaboratorLabel, collaboratorKey, showApproval } = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  // const [editBoolArray, setEditBoolArray] = useState(new Array(collaborators.length).fill(false));
  const [deleteBoolArray, setDeleteBoolArray] = useState([]);

  //generic function that can be used on edit and delete
  const toggleDeleteBool = (array, setter, index) => {
    let arrayCopy = array.slice();
    arrayCopy[index] = !arrayCopy[index];
    setter(arrayCopy);
  };

  const updateAttribute = (index, key, value) => {
    let collaboratorsCopy = collaborators.slice();
    collaboratorsCopy[index][key] = value;
    setCollaborators(collaboratorsCopy);
  };

  const addCollaborator = () => {
    let updatedArray = [...collaborators, {
      email: '',
      name: '',
      eraCommonsId: '',
      title: ''
    }];
    setCollaborators(updatedArray);
  };

  const removeCollaborator = (index) => {
    let deleteCopy = deleteBoolArray.slice();
    let collaboratorCopy = collaborators.slice();

    deleteCopy.splice(index, 1);
    collaboratorCopy.splice(index, 1);
    setDeleteBoolArray(deleteCopy);
    setCollaborators(collaboratorCopy);
  };

  useEffect(() => {
    return formStateChange(collaboratorKey, collaboratorLabel);
  }, [formStateChange, collaboratorKey, collaboratorLabel]);

  const ListItems = div({className: 'form-group row no-margin'}, [collaborators.map((collaborator, index) =>
    //NOTE: maybe add conditional here later for item container for error handling or additional styling?
    div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group', key: `collaborator-item-${index}`}, [
      div({ className: 'row'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} Name*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-name`,
            defaultValue: collaborator.name || '',
            className: 'form-control',
            required: true,
            onBlur: (e) => updateAttribute(index, 'name', e.target.value)
          })
        ]),

        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} Title*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-title`,
            defaultValue: collaborator.title || '',
            className: 'form-control',
            required: true,
            onBlur: (e) => updateAttribute(index, 'title', e.target.value)
          })
        ])
      ]),
      div({ className: 'row'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} NIH eRA Commons ID*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-eraCommonsID`,
            defaultValue: collaborator.eraCommonsId || '',
            className: 'form-control',
            required: true,
            onBlur: (e) => updateAttribute(index, 'eraCommonsId', e.target.value)
          })
        ]),
        div({
          className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12'
        }, [
          label({
            className: 'control-label'
          }, [`${collaboratorLabel} Email`]),
          input({
            type: 'text',
            name: `collaborator-${index}-email`,
            defaultValue: collaborator.eraCommonsId || '',
            className: 'form-control',
            required: true,
            onBlur: (e) => updateAttribute(index, 'email', e.target.value)
          })
        ])
      ]),
      div({ className: 'row', isRendered: showApproval }, [
        div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
          p({ className: 'control-label rp-choice-questions'},[
            `Are you requesting permission for this member of the Internal Lab Staff to be given "Designated Download/Approval" status? This
            indication should be limited to individuals who the PI designates to download data and/or share the requested data with other Internal
            Lab Staff (i.e., staff members and trainees under the direct supervision of the PI)`
          ]),
          //mapped output of yes and no radio buttons for the list
          //YesNoRadioGroup is not used because it assumes only one instance of a question exists at a time
          //this component requires the question to be rendered multiple times, therefore index needs to be passed to id and key
          //YesNoRadioGroup can probably be refactored to handle this, the issue would be rewritting other uses of the component to match the updated form
          //Thus the YesNoRadioGroup refactor should be handled on a separate PR
          div({className: 'radio-inline'}, [
            ['Yes', 'No'].map((option) =>
              label({
                className: "radio-wrapper",
                key: `collaborator-${index}-option-${option}`,
                id: `lbl-collaborator-${index}-option-${option}`,
                htmlFor: `rad-collaborator-${index}-option-${option}`
              }, [
                input({
                  type: "radio",
                  id: `rad-collaborator-${index}-option-${option}`,
                  checked: collaborator.approval === option,
                  name: `collaborator-${index}-approval`,
                  value: option,
                  onChange: (e) => updateAttribute(index, 'approval', e.target.value)
                }),
                span({ className: "radio-check"}),
                span({ className: 'radio-label '}, [option])
              ])
            )
          ]),
          p({className: 'control-label rp-choice-questions'}, [`Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well as their Internal Lab Staff.`])
        ])
      ]),
    ])
  )]);

  return (
    div({className: 'collaborator-list-component'}, [
      ListItems, //NOTE: debug and add collaboratorList here
      div({className: 'row no-margin'}, [
        div({className: 'col-lg-12 col-md-12 col-sm-12-col-xs-12'}, [
          a({
            id: 'add-collaborator-btn',
            onClick: addCollaborator,
            className: 'btn-primary f-right access-background'
          },[
            span({ className: 'glyphicon glyphicon-plus', 'aria-hidden': 'true'}),
            'Add Collaborator'
          ])
        ])
      ])
    ])
  );
};

export default function ResearcherInfo(props) {
  const {
    completed,
    darCode,
    eRACommonsDestination,
    formStateChange,
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
              onChange: (e) => formStateChange({name: 'checkCollaborator', value: e.target.checked})
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
        ]),

        div({className: 'form-group'}, [
          div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
            label({className: "control-label rp-title-question"}, [
              '1.4 Internal Lab Staff',
              //NOTE: format this line?
              span([`Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this data access request, including any data 
              that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent 
              level here.`])
            ]),
          ]),
          h(CollaboratorList, {formStateChange, collaborators: labCollaborators, collaboratorKey: 'labCollaborators', collaboratorLabel: 'Internal Lab Staff', showApproval: true})
        ]),

        div({className: 'form-group'}, [
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
          h(CollaboratorList, {formStateChange, collaborators: internalCollaborators, collaboratorKey: 'internalCollaborators', collaboratorLabel: 'Internal Lab Staff'})
        ])
      ]),

      div({ className: 'row no-margin' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
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