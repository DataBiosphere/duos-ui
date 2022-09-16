import { selectedPrimaryGroup } from './EditConsentGroup';
import { div, h } from 'react-hyperscript-helpers';
import { isNil } from 'lodash/fp';
import { Notification } from '../../Notification';
import { dateValidator } from '../../forms/formUtils';

export const computeConsentGroupValidationErrors = (consentGroup) => {
  const errors = [];

  if (isNil(selectedPrimaryGroup(consentGroup))) {
    errors.push('Please select a primary consent group.');
  }

  if (isNil(consentGroup.url) || consentGroup.url === '') {
    errors.push('Must specify the URL of the data.');
  } else {
    try {
      new URL(consentGroup.url);
    } catch(err) {
      errors.push('The data location URL must be a valid URL.');
    }
  }

  if (isNil(consentGroup.consentGroupName) || consentGroup.consentGroupName === '') {
    errors.push('Must specify the name of the consent group');
  }

  if (isNil(consentGroup.dataLocation) || consentGroup.dataLocation.length === 0) {
    errors.push('Must specify data location (or specify \'Not Determined\')');
  }

  if (!isNil(consentGroup.gs) && consentGroup.gs == '') {
    errors.push('Please specify the geographic restrictions.');
  }

  if (!isNil(consentGroup.otherPrimary) && consentGroup.otherPrimary == '') {
    errors.push('Please specify the \'Other\' primary consent.');
  }

  if (!isNil(consentGroup.otherSecondary) && consentGroup.otherSecondary == '') {
    errors.push('Please specify the \'Other\' secondary consent.');
  }

  if (!isNil(consentGroup.mor) && !dateValidator.isValid(consentGroup.mor)) {
    errors.push('Please enter a valid date for the Publication Moratorium (MOR) field.')
  }

  return errors;
};

export const ConsentGroupErrors = (props) => {

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