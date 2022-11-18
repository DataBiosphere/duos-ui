import { a, div, h, h2, span, p } from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../../../components/forms/forms';
import { useEffect, useState } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { v4 as uuidV4} from 'uuid';
import { computeCollaboratorErrors, CollaboratorErrors } from './CollaboratorErrors';

export default function CollaboratorForm (props) {
  const {
    index,
    collaborator,
  } = props;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [title, setTitle] = useState('');
  const [approverStatus, setApproverStatus] = useState('');
  const [uuid, setUuid] = useState('');
  const [collaboratorValidationErrors, setCollaboratorValidationErrors] = useState([]);

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

  return div({
    className: 'form-group row no-margin',
  }, [
    div({
      className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12, collaborator-form-card',
      key: `collaborator-item-${uuid}`}, [
      // name and eraCommonsId
      div({ className: 'row'}, [
        h(CollaboratorErrors,
          {
            errors: collaboratorValidationErrors,
          }),
        h2([`${isNil(collaborator) ? 'New' : 'Edit'} ${props.collaboratorLabel} Information`]),
        h(FormField, {
          id: index+'_collaboratorName',
          name: `collaborator-${uuid}-name`,
          title: `${props.collaboratorLabel} Name`,
          defaultValue: name,
          placeholder: 'Firstname Lastname',
          validators: [FormValidators.REQUIRED],
          onChange: ({value}) => {
            setName(value);
          },
        }),
        h(FormField, {
          id: index+'_collaboratorEraCommonsId',
          name: `collaborator-${uuid}-eraCommonsId`,
          title: `${props.collaboratorLabel} eRA Commons ID`,
          defaultValue: eraCommonsId,
          placeholder: 'eRA Commons ID',
          validators: [FormValidators.REQUIRED],
          onChange: ({value}) => {
            setEraCommonsId(value);
          },
        }),
      ]),
      // title and email
      div({ className: 'row'}, [
        h(FormField, {
          id: index+'_collaboratorTitle',
          name: `collaborator-${uuid}-title`,
          title: `${props.collaboratorLabel} Title`,
          defaultValue: title,
          placeholder: 'Title',
          validators: [FormValidators.REQUIRED],
          onChange: ({value}) => {
            setTitle(value);
          },
        }),
        h(FormField, {
          id: index+'_collaboratorEmail',
          name: `collaborator-${uuid}-email`,
          title: `${props.collaboratorLabel} Email`,
          defaultValue: email,
          placeholder: 'Email',
          validators: [FormValidators.REQUIRED],
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
          name: `collaborator-${uuid}-approval`,
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
          onChange: ({value}) => {
            setApproverStatus(value);
          }
        }),
        p({className: 'control-label rp-choice-questions', style: { fontSize: 14, marginTop: 5, marginBottom: 20 } },
          [`Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well as their Internal Lab Staff.`])
      ]),
      div({className: 'f-right row'}, [
        // Cancel Button
        div({
          className: 'collaborator-form-cancel-button btn',
          role: 'button',
          onClick: () => props.updateEditState(false)
        },['Cancel']),
        // Add/Save Button
        div({
          className: 'collaborator-form-add-save-button btn',
          role: 'button',
          onClick: () => {
            let newCollaborator = {name, eraCommonsId, title, email, approverStatus, uuid};
            const errors = computeCollaboratorErrors(newCollaborator, props.showApproval);
            const valid = errors.length === 0;

            setCollaboratorValidationErrors(errors);
            valid && saveUpdate();
          },
        },
        [`${isNil(collaborator) ? 'Add' : 'Save'}`])
      ]),
      // Delete button
      div({className: 'row', style: { marginTop: 20 }, isRendered: !isNil(props.collaborator)}, [
        div({
          className: 'col-lg-2 col-md-2, col-sm-2 col-xs-2 col-lg-offset-10 col-md-offset-10 col-sm-offset-10 col-xs-offset-10',
        }),
        a({
          id: index+'_deleteMember',
          onClick: () => props.deleteCollaborator(),
        }, [
          span({
            className: 'collaborator-delete-icon glyphicon glyphicon-trash',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
          }),
          span({
            style: {
              marginLeft: '1rem',
              color: '#0948B7',
            }
          }, ['Delete this entry']),
        ]),
      ]),
    ])
  ]);
}
