import { selectedPrimaryGroup } from './EditConsentGroup';
import { isNil, isEmpty } from 'lodash/fp';
import { dateValidator, uniqueValidator } from '../../../components/forms/formValidation';
import { FormValidators } from '../../../components/forms/forms';

const requiredError = {
  valid: false,
  failed: ['required']
};

const uniqueError = {
  valid: false,
  failed: ['unique']
};

const invalidFormatError = (format) => {
  return {
    valid: false,
    failed: [format]
  };
};

export const computeConsentGroupValidationErrors = (consentGroup, datasetNames = []) => {
  const validation = {};

  if (isNil(consentGroup.accessManagement)) {
    validation.accessManagement = requiredError;
  }

  if (isNil(selectedPrimaryGroup(consentGroup)) && consentGroup.accessManagement !== 'open') {
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
  } else {
    if (!uniqueValidator.isValid(consentGroup.consentGroupName, datasetNames)) {
      validation.consentGroupName = uniqueError;
    }
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

  if (isNil(consentGroup.dataAccessCommitteeId) && consentGroup.accessManagement === 'controlled') {
    validation.dataAccessCommitteeId = requiredError;
  }

  if (!isNil(consentGroup.otherSecondary) && consentGroup.otherSecondary == '') {
    validation.otherSecondary = requiredError;
  }

  if (!isNil(consentGroup.mor) && !dateValidator.isValid(consentGroup.mor)) {
    validation.mor = requiredError;
  }

  if (isNil(consentGroup.numberOfParticipants)) {
    validation.numberOfParticipants = requiredError;
  }

  return validation;
};