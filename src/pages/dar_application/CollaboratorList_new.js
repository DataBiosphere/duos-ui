import { useState, useEffect} from 'react';
import { a, div, input, label, span, p, i } from 'react-hyperscript-helpers';
import { v4 as uuidV4} from 'uuid';

// import { FormField, FormValidators, FormFieldTypes } from '../../components/forms/forms';
// import './dar_application_new.css';


export default function CollaboratorList_new(props) {
  const {formFieldChange, collaboratorLabel, collaboratorKey, showApproval } = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  const [deleteBoolArray, setDeleteBoolArray] = useState(props.deleteBoolArray || []);

  //bootstrap v3 doesn't have outline-button styles, so I'll have to make my own
  const cancelDeleteButtonStyle = {
    flex: 1,
    margin: '2px',
    border: '1px solid #d9534f',
    color: '#d9534f'
  };

  const cardStyle = {
    padding: '3%',
    border: '1px solid #c7c7c7',
    borderRadius: '5px',
    background: '#f0f4ff',
    boxShadow: 'rgb(234, 227, 227) -4px 6px 9px 0px',
    marginBottom: '2%'
  };

  const confirmDeleteButtonStyle = {
    flex: 1,
    margin: '2px'
  };

  const deleteButtonControlStyle = {
    display: 'flex',
    justifyContent: 'flex-end'
  };

  const toggleDeleteBool = (index, updatedBool) => {
    let deleteCopy = deleteBoolArray.slice();
    deleteCopy[index] = updatedBool;
    setDeleteBoolArray(deleteCopy);
  };

  const updateAttribute = (index, key, value) => {
    let collaboratorsCopy = collaborators.slice();
    collaboratorsCopy[index][key] = value;
    setCollaborators(collaboratorsCopy);
  };

  const addCollaborator = () => {
    let newCollaborator = {
      email: '',
      name: '',
      eraCommonsId: '',
      title: '',
      uuid: uuidV4()
    };
    if (props.showApproval) {
      newCollaborator.approverStatus = true;
    }

    const updatedArray = [...collaborators, newCollaborator];
    const deleteBoolCopy = [...deleteBoolArray, false];
    setCollaborators(updatedArray);
    setDeleteBoolArray(deleteBoolCopy);
  };

  const removeCollaborator = (index) => {
    let deleteCopy = deleteBoolArray.slice();
    let collaboratorCopy = collaborators.slice();

    deleteCopy.splice(index, 1);
    collaboratorCopy.splice(index, 1);
    setCollaborators(collaboratorCopy);
    setDeleteBoolArray(deleteCopy);
  };

  useEffect(() => {
    return formFieldChange({name: collaboratorKey, value: collaborators});
  }, [formFieldChange, collaboratorKey, collaborators]);

  useEffect(() => {
    setCollaborators(props.collaborators);
    setDeleteBoolArray(props.deleteBoolArray);
  }, [props.collaborators, props.deleteBoolArray]);

  const ListItems = div({className: 'form-group row no-margin'}, [collaborators.map((collaborator, index) =>
    div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: cardStyle, key: `collaborator-item-${collaborator.uuid}`}, [
      div({className: 'row'}, [
        div({
          className: 'delete-button-control col-lg-2 col-md-2, col-sm-2 col-xs-2 col-lg-offset-10 col-md-offset-10 col-sm-offset-10 col-xs-offset-10',
          style: deleteButtonControlStyle
        }, [
          div({
            isRendered: !deleteBoolArray[index],
            className: 'btn btn-danger',
            role: 'button',
            onClick: () => toggleDeleteBool(index, true)
          }, [
            i({className: 'glyphicon glyphicon-trash'})
          ]),
          div({
            isRendered: deleteBoolArray[index],
            className: 'confirm-delete-btn btn btn-danger',
            style: confirmDeleteButtonStyle,
            role: 'button',
            onClick: () => removeCollaborator(index)
          },['Delete Member']),
          div({
            isRendered: deleteBoolArray[index],
            className: 'cancel-delete-btn btn',
            style: cancelDeleteButtonStyle,
            role: 'button',
            onClick: () => toggleDeleteBool(index, false)
          }, ['Cancel'])
        ])
      ]),
      div({ className: 'row'}, [
        div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12' }, [
          label({ className: 'control-label' }, [`${collaboratorLabel} Name*`]),
          input({
            type: 'text',
            name: `collaborator-${collaborator.uuid}-name`,
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
            name: `collaborator-${collaborator.uuid}-title`,
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
            name: `collaborator-${collaborator.uuid}-eraCommonsID`,
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
            type: 'email',
            name: `collaborator-${collaborator.uuid}-email`,
            defaultValue: collaborator.email || '',
            className: 'form-control',
            required: true,
            onBlur: (e) => updateAttribute(index, 'email', e.target.value)
          })
        ])
      ]),
      div({ className: 'row', isRendered: showApproval }, [
        div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
          p({ className: 'control-label rp-choice-questions'},[
            `Are you requesting permission for this member of the Internal Lab Staff to be given 'Designated Download/Approval' status? This
            indication should be limited to individuals who the PI designates to download data and/or share the requested data with other Internal
            Lab Staff (i.e., staff members and trainees under the direct supervision of the PI)`
          ]),
          div({className: 'radio-inline'}, [
            [{label:'Yes', value: true}, {label:'No', value: false}].map((option) =>
              label({
                className: 'radio-wrapper',
                key: `collaborator-${collaborator.uuid}-option-${option.value}`,
                id: `lbl-collaborator-${collaborator.uuid}-option-${option.value}`,
                htmlFor: `rad-collaborator-${collaborator.uuid}-option-${option.value}`
              }, [
                input({
                  type: 'radio',
                  id: `rad-collaborator-${collaborator.uuid}-option-${option.value}`,
                  checked: collaborator.approverStatus === option.value,
                  name: `collaborator-${collaborator.uuid}-approver-status`,
                  value: option.value,
                  onChange: () => updateAttribute(index, 'approverStatus', option.value)
                }),
                span({ className: 'radio-check'}),
                span({ className: 'radio-label '}, [option.label])
              ])
            )
          ]),
          p({className: 'control-label rp-choice-questions'}, ['Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well as their Internal Lab Staff.'])
        ])
      ]),
    ])
  )]);

  return (
    div({className: 'collaborator-list-component'}, [
      ListItems,
      div({className: 'row no-margin'}, [
        div({className: 'col-lg-12 col-md-12 col-sm-12-col-xs-12', style: { marginTop: 25 }}, [
          a({
            id: 'add-collaborator-btn access-background',
            onClick: () => !props.disabled && addCollaborator(),
            className: 'button button-white btn-xs',
            role: 'button',
            disabled: props.disabled
          },['Add Collaborator'])
        ])
      ])
    ])
  );
}