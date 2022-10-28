import { a, div, h2, input, label, span, p, i } from 'react-hyperscript-helpers';

import { FormFieldTypes, FormField, FormValidators } from '../../../components/forms/forms';
import { button, h } from "react-hyperscript-helpers";

export const EditCollaborator = (props) => {
  const {
    collaborator,
    setCollaborator,
    index,
  } = props;

  const onChange = ({key, value}) => {
    setCollaborator({
      ...collaborator,
      ...{
        [key]: value,
      },
    });
  };

  const addSaveButtonStyle = {
    flex: 1,
    margin: '2px',
    border: '1px solid #0948B7',
    color: '#FFFFFFFF',
    backgroundColor: '#0948B7',
    padding: '10px 20px',
  };

  const cancelDeleteButtonStyle = {
    flex: 1,
    margin: '2px',
    border: '1px solid #0948B7',
    color: '#0948B7',
    backgroundColor: '#FFFFFFFF',
    padding: '10px 20px'
  };

  const deleteButtonControlStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 25
  };

  const cardStyle = {
    padding: '2% 7%',
    border: '1px solid #0948B7',
    borderRadius: '5px',
    background: '#FFFFFFFF',
    boxShadow: 'rgb(234, 227, 227) -4px 6px 9px 0px',
    marginBottom: '2%'
  };

  const ariaLevel = 2;

  return div({
    className: 'form-group row no-margin',
    // todo: update styling here
  }, [
    div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: cardStyle, key: `collaborator-item-${collaborator.uuid}`}, [
      ((props.editMode === true && collaborator.valid === '')
        ? h2([`New ${props.collaboratorLabel} Information`])
        : h2([`Edit ${props.collaboratorLabel} Information`])
      ),
      // name and eraCommonsId
      div({ className: 'row'}, [
        // name
        h(FormField, {
          id: index+'_collaboratorName',
          name: `collaborator-${collaborator.uuid}-name`,
          title: `${props.collaboratorLabel} Name`,
          validators: [FormValidators.REQUIRED],
          placeholder: 'Firstname Lastname',
          // defaultValue: collaborator.name || '',
          onChange,
        }),
        // eraCommonsId
        h(FormField, {
          id: index+'_collaboratorEraCommonsId',
          name: `collaborator-${collaborator.uuid}-eraCommonsId`,
          title: `${props.collaboratorLabel} eRA Commons ID`,
          validators: [FormValidators.REQUIRED],
          placeholder: 'eRA Commons ID',
          // defaultValue: collaborator.eraCommonsId || '',
          onChange,
        }),
      ]),
      // title and email
      div({ className: 'row'}, [
        // title
        h(FormField, {
          id: index+'_collaboratorTitle',
          name: `collaborator-${collaborator.uuid}-title`,
          title: `${props.collaboratorLabel} Title`,
          validators: [FormValidators.REQUIRED],
          placeholder: 'Title',
          // defaultValue: collaborator.title || '',
          onChange,
        }),
        // email
        h(FormField, {
          id: index+'_collaboratorEmail',
          name: `collaborator-${collaborator.uuid}-email`,
          title: `${props.collaboratorLabel} Email`,
          validators: [FormValidators.REQUIRED],
          placeholder: 'Email',
          // defaultValue: collaborator.email || '',
          onChange,
        }),
      ]),
      // conditionally render this section
      div({ className: 'row', isRendered: props.showApproval }, [
        div({className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'}, [
          p({ className: 'control-label rp-choice-questions'},[
            `Are you requesting permission for this member of the Internal Lab Staff to be given 'Designated Download/Approval' status? This
            indication should be limited to individuals who the PI designates to download data and/or share the requested data with other Internal
            Lab Staff (i.e., staff members and trainees under the direct supervision of the PI)`
          ]),

          // approval status
          h(FormField, {
            id: index+'_collaboratorApproval',
            type: FormFieldTypes.RADIOGROUP,
            // name: `collaborator-${collaborator.uuid}-approval`,
            // title: `${props.collaboratorLabel} Approval`,
            description: `Are you requesting permission for this member of the Internal Lab Staff to be given
                    Designated Download/Approval" status? This indication should be limited to individuals who
                    the PI designates to download data and/or share the requested data with other Internal Lab Staff
                    (ie., staff members and trainees under the direct supervision of the PI).`,
            options: [
              { name: 'yes', text: 'Yes' },
              { name: 'no', text: 'No' }
            ],
            orientation: 'horizontal',
            validators: [FormValidators.REQUIRED],
            onChange,
            // defaultValue: 'no',
          }),
          p({className: 'control-label rp-choice-questions'}, ['Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well as their Internal Lab Staff.'])
        ])
      ]),

      // New Collaborator Cancel / Add
      div({className: 'f-right row', isRendered: (props.editMode && !collaborator.valid)}, [
        div({
          className: 'cancel-delete-btn btn',
          style: cancelDeleteButtonStyle,
          role: 'button',
          onClick: () => props.deleteCollaborator(index)
        },['Cancel']),
        div({
          className: 'add-btn btn',
          style: addSaveButtonStyle,
          role: 'button',
          onClick: () => {
            props.saveCollaborator({ value: collaborator, valid: true });
            props.setEditMode(false);
            collaborator.editMode = false;
          },
        }, ['Add'])
      ]),

      // Update Collaborator Delete / Save
      div({className: 'row', isRendered: (!props.editMode && collaborator.valid)}, [
        div({
          className: 'delete-button-control col-lg-2 col-md-2, col-sm-2 col-xs-2 col-lg-offset-10 col-md-offset-10 col-sm-offset-10 col-xs-offset-10',
          style: deleteButtonControlStyle
        }),
        a({
          id: index+'_deleteMember',
          onClick: () => props.deleteCollaborator(index),
        }, [
          span({
            className: 'cm-icon-button glyphicon glyphicon-trash',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }, ['Delete this entry']),
        ]),
        button({
          id: index+'_saveCollaborator',
          type: 'button',
          className: 'f-right btn-primary',
          style: addSaveButtonStyle,
          // isRendered: props.editMode,
          onClick: () => {
            props.saveCollaborator({ value: collaborator, valid: true });
            props.setEditMode(false);
            collaborator.editMode = true;
          },
        }, ['Save']),
      ]),
    ])
  ]);
};