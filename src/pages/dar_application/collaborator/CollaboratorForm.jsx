import React from 'react';
import { a, div, h, h2, span, p } from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../../../components/forms/forms';
import { useEffect, useState } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { v4 as uuidV4} from 'uuid';
import { computeCollaboratorErrors } from '../../../utils/darFormUtils';
import DeleteCollaboratorModal from './DeleteCollaboratorModal';

export default function CollaboratorForm (props) {
  const {
    index,
    collaborator,
    collaboratorKey,
    validation,
    onCollaboratorValidationChange
  } = props;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [title, setTitle] = useState('');
  const [approverStatus, setApproverStatus] = useState('');
  const [uuid, setUuid] = useState('');
  const [showDeleteCollaboratorModal, setShowDeleteCollaboratorModal] = useState(false);

  const onValidationChange = ({ key, validation }) => {
    onCollaboratorValidationChange({ index, key, validation });
  };

  useEffect(() => {
    if (!isEmpty(collaborator)) {
      setName(collaborator.name);
      setEmail(collaborator.email);
      setEraCommonsId(collaborator.eraCommonsId);
      setTitle(collaborator.title);
      setApproverStatus(collaborator.approverStatus);
      setUuid(collaborator.uuid);
    } else {
      setUuid(uuidV4());
    }
  }, [collaborator]);

  const saveUpdate = () => {
    props.saveCollaborator({name, eraCommonsId, title, email, approverStatus, uuid});
    props.updateEditState(false);
  };

  const closeDelete = () => {
    setShowDeleteCollaboratorModal(false);
  };

  return div({
    className: 'form-group row no-margin',
  }, [
    div({
      className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12, collaborator-form-card',
      key: `collaborator-item-${uuid}`}, [
      // name and eraCommonsId
      div({ className: 'row'}, [

        h2([`${isNil(collaborator) ? 'New' : 'Edit'} ${props.collaboratorLabel} Information`]),
        h(FormField, {
          id: index+'_collaboratorName',
          name: `name`,
          title: `${props.collaboratorLabel} Name`,
          defaultValue: name,
          placeholder: 'Firstname Lastname',
          validators: [FormValidators.REQUIRED],
          validation: validation.name,
          onValidationChange,
          onChange: ({value}) => {
            setName(value);
          },
        }),
        h(FormField, {
          id: index+'_collaboratorEraCommonsId',
          name: `eraCommonsId`,
          title: `${props.collaboratorLabel} eRA Commons ID`,
          defaultValue: eraCommonsId,
          placeholder: 'eRA Commons ID',
          validators: [FormValidators.REQUIRED],
          validation: validation.eraCommonsId,
          onValidationChange,
          onChange: ({value}) => {
            setEraCommonsId(value);
          },
        }),
      ]),
      // title and email
      div({ className: 'row'}, [
        h(FormField, {
          id: index+'_collaboratorTitle',
          name: `title`,
          title: `${props.collaboratorLabel} Title`,
          defaultValue: title,
          placeholder: 'Title',
          validators: [FormValidators.REQUIRED],
          validation: validation.title,
          onValidationChange,
          onChange: ({value}) => {
            setTitle(value);
          },
        }),
        h(FormField, {
          id: index+'_collaboratorEmail',
          name: `email`,
          title: `${props.collaboratorLabel} Email`,
          defaultValue: email,
          placeholder: 'Email',
          validators: [FormValidators.REQUIRED, FormValidators.EMAIL],
          validation: validation.email,
          onValidationChange,
          onChange: ({value}) => {
            setEmail(value);
          },
        }),
      ]),
      div({ className: 'row', isRendered: props.showApproval, style: { marginTop: 25 } }, [
        // approval status
        h(FormField, {
          id: index+'_collaboratorApproval',
          type: FormFieldTypes.RADIOGROUP,
          name: `approverStatus`,
          description: `Are you requesting permission for this member of the Internal Lab Staff to be given
                    Designated Download/Approval" status? This indication should be limited to individuals who
                    the PI designates to download data and/or share the requested data with other Internal Lab Staff
                    (ie., staff members and trainees under the direct supervision of the PI).`,
          options: [
            { name: 'yes', text: 'Yes' },
            { name: 'no', text: 'No' }
          ],
          validators: [FormValidators.REQUIRED],
          orientation: 'horizontal',
          defaultValue: (approverStatus === true || approverStatus ===  'yes') ? 'yes'
            : (approverStatus === false || approverStatus === 'no') ? 'no'
              : undefined,
          validation: validation.approverStatus,
          onValidationChange,
          onChange: ({value}) => {
            setApproverStatus(value);
          }
        }),
        p({className: 'control-label rp-choice-questions', style: { fontSize: 14, marginTop: 5, marginBottom: 5 } },
          [`Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well as their Internal Lab Staff.`])
      ]),
      div({className: 'row', style: { marginTop: 20 } }, [
        // Toggle Delete Buttons (Cancel/Delete)
        a({
          id: index+'_deleteMember',
          isRendered: !isNil(props.collaborator) && !props.deleteMode,
          onClick: () => { setShowDeleteCollaboratorModal(true), props.toggleDeleteBool(false); },
          style: { verticalAlign: 'middle', lineHeight: '4rem', float: 'right' }
        }, [
          span({
            className: 'collaborator-delete-icon glyphicon glyphicon-trash',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete',
          }),
          span({
            style: {
              marginLeft: '1rem',
              color: '#0948B7',
              verticalAlign: 'middle'
            }
          }, ['Delete this entry']),
        ]),
        // Add/Save Button
        div({
          id: `collaborator-${collaboratorKey}-add-save`,
          className: 'collaborator-form-add-save-button f-left btn',
          role: 'button',
          onClick: () => {
            let newCollaborator = {name, eraCommonsId, title, email, approverStatus, uuid};
            const errors = computeCollaboratorErrors({collaborator: newCollaborator, needsApproverStatus: props.showApproval});
            const valid = Object.keys(errors).length === 0;
            onCollaboratorValidationChange({ index, validation: errors });
            if (valid) {
              saveUpdate();
            }
          },
        },
        [`${isNil(collaborator) ? 'Add' : 'Save'}`]),
        // Cancel Button for Add/Update
        div({
          className: 'collaborator-form-cancel-button f-left btn',
          role: 'button',
          onClick: () => props.updateEditState(false)
        },['Cancel']),
        // Delete Modal
        h(DeleteCollaboratorModal, {
          showDelete: showDeleteCollaboratorModal,
          closeDelete: closeDelete,
          header: 'Delete Entry',
          title:<div>Are you sure you want to delete <strong>{name}</strong>?</div>,
          message: <div><i>This action is permanent and cannot be undone.</i></div>,
          onConfirm: () => props.deleteCollaborator(),
        }),
      ]),
    ])
  ]);
}
