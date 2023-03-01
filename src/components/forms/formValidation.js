import { isEmailAddress } from '../../libs/utils';
import { isString, isEmpty, isNil, isArray } from 'lodash';

export const requiredValidator = {
  id: 'required',
  isValid: (value) => {
    return value !== undefined && value !== null &&
      (isString(value) ? value.trim() !== '' : true);
  },
  msg: 'Please enter a value',
};

export const urlValidator = {
  id: 'uri',
  isValid: (val) => {
    return validURLObject(val) || validURLObject('https://' + val);
  },
  msg: 'Please enter a valid url (e.g., duos.org)',
};

export const emailValidator = {
  id: 'email',
  isValid: isEmailAddress,
  msg: 'Please enter a valid email address (e.g., person@example.com)'
};

export const dateValidator = {
  id: 'date',
  isValid: (val) => isValidDate(val),
  msg: 'Please enter a date (YYYY-MM-DD), e.g. 2018-11-13',
};

const validators = [requiredValidator, urlValidator, emailValidator, dateValidator];

/**
 * Validates the form value
 *
 * @param {object} formValue Value of the
 * @param {list} validators List of validators, e.g. [FormValidators.REQUIRED, FormValidators.URL]
 * @returns An object with the format { valid: bool, failed: [validatorId, ...] }
 */
export const validateFormValue = (formValue, validators) => {
  // if there is no value specified, and it's not required, then it's fine.
  if (isEmpty(formValue) && !validators?.includes(requiredValidator)) {
    return {
      valid: true,
    };
  }

  const failedValidators = [];

  validators?.forEach((validator) => {
    let failed = false;
    if (isArray(formValue)) {
      failed = formValue.some((val) => {
        return !validator.isValid(val);
      });
    } else {
      failed = !validator.isValid(formValue);
    }

    if (failed) {
      failedValidators.push(validator.id);
    }
  });

  return {
    valid: failedValidators.length === 0,
    failed: failedValidators,
  };
};

/**
 * Gives a human readable validation message. Gives generic message if the validator cannot be found.
 *
 * @param {string} failedValidator The id of the failed validator, e.g. 'required'
 * @returns Human readable message, e.g., 'Please enter a value'.
 */
export const validationMessage = (failedValidator) => {

  const validator = validators.find((val) => {
    return val.id === failedValidator;
  });

  // unknown validation, return generic message
  return validator.msg || 'Invalid value.';
};

/**
 * Returns a boolean if an errors occurred on validation. If validation has not ran yet,
 * assumes true, as an untouched field should always validate.
 */
export const isValid = (validation) => {
  // default to true if validation has not ran.
  if (isNil(validation) || isNil(validation.valid)) {
    return true;
  }

  return validation.valid;
};


// ----------------------------------------------------------------------------------------------------- //
// ======                                    HELPER FUNCTIONS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //

const validURLObject = (val) => {
  try {
    new URL(val);
  } catch (_) {
    return false;
  }

  return true;
};

// regex source: https://regexland.com/regex-dates/
const dateRegex = /^\d{4}-(02-(0[1-9]|[12][0-9])|(0[469]|11)-(0[1-9]|[12][0-9]|30)|(0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))$/;

const isValidDate = (val) => {
  return dateRegex.test(val);
};

