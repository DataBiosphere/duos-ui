import { div, h } from 'react-hyperscript-helpers';
import { isNil } from 'lodash/fp';
import { Notification } from '../../../components/Notification';

export const computeCollaboratorErrors = (collaborator) => {
  const errors = [];

  if (isNil(collaborator.name) || collaborator.name === '') {
    errors.push('Must specify the name of the collaborator');
  }

  if (isNil(collaborator.title) || collaborator.title === '') {
    errors.push('Must specify the title of the collaborator');
  }

  if (isNil(collaborator.eraCommonsId) || collaborator.eraCommonsId === '') {
    errors.push('Must specify the eRA Commons ID of the collaborator');
  }

  if (isNil(collaborator.email) || collaborator.email === '') {
    errors.push('Must specify the email of the collaborator.');
  } else {
    try {
      new URL(collaborator.email);
    } catch(err) {
      errors.push('The email must be a valid email.');
    }
  }

  return errors;
};

export const CollaboratorErrors = (props) => {

  const {
    errors
  } = props;

  return div({},
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