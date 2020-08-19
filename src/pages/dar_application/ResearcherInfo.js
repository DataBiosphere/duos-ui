import { useState, useEffect, Fragment} from 'react';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { a, div, fieldset, h, h3, input, label, span, table, tr, td } from 'react-hyperscript-helpers';
import { eRACommons } from '../../components/eRACommons';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';

const profileLink = h(Link, {to:'/profile', className:'hover-color'}, ['Your Profile']);
const profileUnsubmitted = span(["Please submit ", profileLink, " to be able to create a Data Access Request"]);
const profileSubmitted = span(["Please make sure ", profileLink, " is updated as it will be used to pre-populate parts of the Data Access Request"]);

//NOTE: remember to add parent callback to update collaborator state variable on parent component
const CollaboratorList = (props) => {
  //NOTE: need callback parent from props to update state list on parent container
  //NOTE: need boolean list to keep track of edit view for individual list elements
  //toggle value on edit click, remove from array when corresponding collaborator is deleted from list

  const { formStateChange, collaboratorLabel, collaboratorKey } = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  // const [editBoolArray, setEditBoolArray] = useState(new Array(collaborators.length).fill(false));
  const [deleteBoolArray, setDeleteBoolArray] = useState(new Array(collaborators.length).fill(false));

  //generic function that can be used on edit and delete
  const toogleDeleteBool = (array, setter, index) => {
    let arrayCopy = array.slice();
    arrayCopy[index] = !arrayCopy[index];
    setter(arrayCopy);
  };

  const updateAttribute = (index, key, value) => {
    let collaboratorsCopy = Array.slice(collaborators);
    collaboratorsCopy[index][key] = value;
    setCollaborators()
  }

  const addCollaborator = () => {
    setCollaborators([...collaborators, {name: '', email: ''}]);
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

  const collaboratorList = collaborators.map((collaborator, index) => 
    div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group'}, [
      div({ className: 'row no-margin'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} + Name*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-name`,
            value: collaborator.name || '',
            className: 'name-input',
            required: true,
            onChange: (e) => updateAttribute(index, 'name', e.target.value)
          })
        ]),
        div({ className: 'control-label' }, [
          div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
            label({ className: 'control-label' }, [`${collaboratorLabel} + Title*`]),
            input({
              type: 'text',
              name: `collaborator-${index}-title`,
              value: collaborator.title || '',
              className: 'title-input',
              required: true,
              onChange: (e) => updateAttribute(index, 'title', e.target.value)
            })
          ])
        ])
      ]),
      div({ className: 'row no-margin'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} + NIH eRA Commons ID*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-eraCommonsID`,
            value: collaborator.eraCommonsId || '',
            className: 'eraCommonsId-input',
            required: true,
            onChange: (e) => updateAttribute(index, 'eraCommonsId', e.target.value)
          })
        ])
      ]),
      div({ className: 'row no-margin'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12'}, [
          label({ className: 'control-label' }, [`${collaboratorLabel} + Email*`]),
          input({
            type: 'text',
            name: `collaborator-${index}-email`,
            value: collaborator.eraCommonsId || '',
            className: 'email-input',
            required: true,
            onChange: (e) => updateAttribute(index, 'email', e.target.value)
          })
        ])
      ])
    ])
  );

  return {collaboratorList};
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
  const [otherCollaborators, setOtherCollaborators] = useState(props.otherCollaborators);

  useEffect(() => {
    setCheckCollaborator(props.checkCollaborator);
  }, [props.checkCollaborator]);

  useEffect(() => {
    setOtherCollaborators(props.otherCollaborators);
  }, [props.otherCollaborators]);

  useEffect(() => {
    return formStateChange({name: 'otherCollaborators', value: otherCollaborators})
  })

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
              '1.4 Internal Lab Staff'
            ],
            //NOTE: format this line?
            span('Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this data access request, including any data that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent level here.'))
          ]),
          h(CollaboratorList, {collaborators: labCollaborators, collaboratorKey: 'labCollaborators', collaboratorLabel: 'Internal Lab Staff'}),
          div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group collaborator-buttons'}, [
            //NOTE: add button should add collaborator, call parent state function to update formData
          ])
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