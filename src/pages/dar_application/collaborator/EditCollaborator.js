import { div, h, h3 } from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../../../components/forms/forms';

export const EditCollaborator = (props) => {
  const {
    collaborator,
    setCollaborator,
    idx,
  } = props;

  const onChange = ({key, value}) => {
    setCollaborator({
      ...collaborator,
      ...{
        [key]: value,
      },
    });
  };

  return div({
    style: {
      width: '70%'
    }
  }, [

    // todo: display type of collaborator (Internal Lab Member / Internal Collaborator / External Collaborator)
    // todo: add conditional logic for add/edit collaborator
    // todo: The placement of the edit form depends on where it is called from.
    // todo: If it’s the add button, the form shows up under the button. If it’s called from an edit icon, it shows up under the row for that edit icon.
    h3(['New Collaborator Information']),

    // name
    h(FormField, {
      id: idx+'_collaboratorName',
      name: 'collaboratorName',
      title: 'Name',
      validators: [FormValidators.REQUIRED],
      placeholder: 'First & Last Name',
      defaultValue: collaborator.name,
      onChange,
    }),

    // title
    h(FormField, {
      id: idx+'_collaboratorTitle',
      name: 'collaboratorTitle',
      title: 'Title',
      validators: [FormValidators.REQUIRED],
      placeholder: 'Title',
      defaultValue: collaborator.title,
      onChange,
    }),

    // eRA commons id
    h(FormField, {
      id: idx+'_collaboratorEraCommonsId',
      name: 'collaboratorEraCommonsId',
      title: 'eRACommonsId',
      validators: [FormValidators.REQUIRED],
      placeholder: 'eRA Commons ID',
      defaultValue: collaborator.eraCommonsId,
      onChange,
    }),

    // email
    h(FormField, {
      id: idx+'_collaboratorEmail',
      name: 'collaboratorEmail',
      title: 'Email',
      validators: [FormValidators.EMAIL],
      placeholder: 'Email',
      defaultValue: collaborator.email,
      onChange,
    }),

    // todo: download/approval permission - only for internal lab members
    h(FormField, {
      description: `Are you requesting permission for this member of the Internal Lab Staff to be given
            Designated Download/Approval" status? This indication should be limited to individuals who 
            the PI designates to download data and/or share the requested data with other Internal Lab Staff
            (ie., staff members and trainees under the direct supervision of the PI).`,
      type: FormFieldTypes.RADIOBUTTON,
      id: idx+'_collaborator_permission',
      name: 'collaboratorPermission',
      value: 'downloadPermission',
      options: [
        { name: 'yes', text: 'Yes' },
        { name: 'no', text: 'No' }
      ],
      validators: [FormValidators.REQUIRED],
      orientation: 'horizontal',
      defaultValue: 'no',
      onChange,
    })
  ]);
};