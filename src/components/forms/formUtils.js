import { FormFieldTypes, commonRequiredProps, commonOptionalProps } from './forms';
import { isNil, isFunction, isArray, isEmpty, isString } from 'lodash/fp';
import { isEmailAddress } from '../../libs/utils';

export const validateFormProps = (props) => {
  const type = (!isNil(props.type) ? props.type : FormFieldTypes.TEXT);

  const requiredProps = type.requiredProps || [];
  const optionalProps = type.optionalProps || [];

  requiredProps.push(...commonRequiredProps);
  optionalProps.push(...commonOptionalProps);
  optionalProps.push(...requiredProps);

  const propKeys = Object.keys(props);

  propKeys.forEach((prop) => {
    if (!optionalProps.includes(prop)) {
      throw `unknown prop ${prop}`;
    }
  });

  requiredProps.forEach((requiredProp) => {
    if (!propKeys.includes(requiredProp)) {
      throw `prop ${requiredProp} is required`;
    }
  });

  if (isFunction(type.customPropValidation)) {
    type.customPropValidation(props);
  }
};


export const customSelectPropValidation = (props) => {
  if (!isArray(props.selectOptions)) {
    throw 'prop \'selectOptions\' must be an array';
  }

  if (isEmpty(props.selectOptions)) {
    throw '\'selectOptions\' cannot be empty';
  }

  const isStringArr = isString(props.selectOptions[0]);

  props.selectOptions.forEach((opt) => {
    if (isStringArr) {
      if (!isString(opt)) {
        throw 'all values in \'selectOptions\' must be string typed';
      }

      return;
    }

    if (isNil(opt.displayText)) {
      throw 'every value in \'selectOptions\' needs a \'displayText\' field';
    }
  });
};

export const customRadioPropValidation = (props) => {
  if (!isArray(props.options)) {
    throw '\'options\' prop must be an array.';
  }

  props.options.forEach((opt) => {
    if (isNil(opt.name)) {
      throw 'each option in \'options\' prop must have a \'name\' field';
    }

    if (isNil(opt.text)) {
      throw 'each option in \'options\' prop must have a \'text\' field';
    }

  });
};

export const requiredValidator = {
  isValid: (value) => value !== undefined && value !== null && value !== '',
  msg: 'Please enter a value',
};

export const urlValidator = {
  isValid: (val) => {
    try {
      new URL(val);
    } catch (_) {
      return false;
    }
    return true;
  },
  msg: 'Please enter a valid url (e.g., https://www.google.com)',
};

export const emailValidator = {
  isValid: isEmailAddress,
  msg: 'Please enter a valid email address (e.g., person@example.com)',
};
