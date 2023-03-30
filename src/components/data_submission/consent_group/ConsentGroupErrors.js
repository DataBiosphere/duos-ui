import { selectedPrimaryGroup } from './EditConsentGroup';
import { isNil, isEmpty } from 'lodash/fp';
import { set } from 'lodash';
import { dateValidator } from '../../forms/formValidation';
import { FormValidators } from '../../forms/forms';

const requiredError = {
  valid: false,
  failed: ['required']
};

const invalidFormatError = (format) => {
  return {
    valid: false,
    failed: [format]
  };
};

export const computeConsentGroupValidationErrors = (consentGroup) => {
  const validation = {};

  if (isNil(selectedPrimaryGroup(consentGroup))) {
    validation.primaryConsent = requiredError;
  }

  if (selectedPrimaryGroup(consentGroup) === 'diseaseSpecificUse' && isEmpty(consentGroup.diseaseSpecificUse)) {
    validation.diseaseSpecificUse = requiredError;
  }

  if ((isNil(consentGroup.url) || consentGroup.url === '') && consentGroup.dataLocation !== 'Not Determined') {
    validation.url = requiredError;
  } else {
    try {
      FormValidators.URL.isValid(consentGroup.url);
    } catch(err) {
      validation.url = invalidFormatError('uri');
    }
  }

  if (isNil(consentGroup.consentGroupName) || consentGroup.consentGroupName === '') {
    validation.consentGroupName = requiredError;
  }

  if (isNil(consentGroup.dataLocation) || consentGroup.dataLocation === '') {
    validation.dataLocation = requiredError;
  }

  if (!isNil(consentGroup.gs) && consentGroup.gs == '') {
    validation.gs = requiredError;
  }

  if (!isNil(consentGroup.otherPrimary) && consentGroup.otherPrimary == '') {
    validation.otherPrimary = requiredError;
  }

  if (isNil(consentGroup.dataAccessCommitteeId) && consentGroup.openAccess !== true) {
    validation.dataAccessCommitteeId = requiredError;
  }

  if (!isNil(consentGroup.otherSecondary) && consentGroup.otherSecondary == '') {
    validation.otherSecondary = requiredError;
  }

  if (!isNil(consentGroup.mor) && !dateValidator.isValid(consentGroup.mor)) {
    validation.mor = requiredError;
  }

  if (isNil(consentGroup.fileTypes) || isEmpty(consentGroup.fileTypes)) {
    validation.fileTypes = requiredError;
  } else {
    consentGroup.fileTypes.forEach((ft, idx) => {
      if (isNil(ft.numberOfParticipants)) {
        set(validation, ['fileTypes', idx, 'numberOfParticipants'], requiredError);
      }
    });
  }

  return validation;
};