import { div, h } from 'react-hyperscript-helpers';
import { isEmpty, isNil } from 'lodash/fp';
import { Notification } from '../../../components/Notification';
import { FormValidators } from '../../../components/forms/forms';

export const computeCollaboratorErrors = (collaborator, showApproval) => {
  const errors = [];

  if (isNil(collaborator.name) || collaborator.name === '') {
    errors.push('Must specify the name of the collaborator.');
  }

  if (isNil(collaborator.eraCommonsId) || collaborator.eraCommonsId === '') {
    errors.push('Must specify the eRA Commons ID of the collaborator.');
  }

  if (isNil(collaborator.title) || collaborator.title === '') {
    errors.push('Must specify the title of the collaborator.');
  }

  if (isNil(collaborator.email) || collaborator.email === '') {
    errors.push('Must specify the email of the collaborator.');
  } else {
    var testEmail = FormValidators.EMAIL.isValid(collaborator.email);
    if(testEmail === false) errors.push(FormValidators.EMAIL.msg);
  }

  if (showApproval) {
    if (isEmpty(collaborator.approverStatus)) {
      errors.push('Must specify the Designated Download/Approval status.');
    }
  }


  return errors;
};

export const CollaboratorErrors = (props) => {

  const {
    errors
  } = props;

  return div({dataCy: 'collaborator-form-errors'},
    errors.map((err, idx) => {
      return div({style: {marginBottom: '2rem'}}, [
        h(Notification,
          {
            key: idx,
            notificationData: {
              level: 'danger',
              message: err,
            }
          }),
      ]);
    }),
  );
};
