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

  if (isNil(props.isAsync) || !props.isAsync) {
    if (isNil(props.selectOptions)) {
      throw 'must specify \'selectOptions\' in select form fields';
    }

    if (!isArray(props.selectOptions)) {
      throw 'prop \'selectOptions\' must be an array';
    }

    const isStringArr = props.selectOptions.length > 0 && isString(props.selectOptions[0]);

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
  } else {
    if (isNil(props.loadOptions)) {
      throw 'must specify \'loadOptions\' if select is async';
    }

    if (isNil(props.optionsAreString)) {
      throw 'must specify \'optionsAreString\' if select is async';
    }
  }

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
  isValid: (value) => {
    return value !== undefined && value !== null &&
      (isString(value) ? value.trim() !== '' : true);
  },
  msg: 'Please enter a value',
};

export const urlValidator = {
  isValid: (val) => {
    return validURLObject(val) || validURLObject('https://' + val);
  },
  msg: 'Please enter a valid url (e.g., duos.org)',
};

const validURLObject = (val) => {
  try {
    new URL(val);
  } catch (_) {
    return false;
  }

  return true;
};

export const emailValidator = {
  isValid: isEmailAddress,
  msg: 'Please enter a valid email address (e.g., person@example.com)',
};

// regex source: https://regexland.com/regex-dates/
const dateRegex = /^\d{4}-(02-(0[1-9]|[12][0-9])|(0[469]|11)-(0[1-9]|[12][0-9]|30)|(0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))$/;
export const dateValidator = {
  isValid: (val) => {
    return dateRegex.test(val);
  },
  msg: 'Please enter a date (YYYY-MM-DD), e.g. 2018-11-13',
};