import { FormFieldTypes, commonRequiredProps, commonOptionalProps } from './forms';
import { isNil, isFunction, isArray, isString } from 'lodash/fp';

export const validateFormProps = (props) => {
  const type = (!isNil(props.type) ? props.type : FormFieldTypes.TEXT);

  const requiredProps = (type.requiredProps || []).concat(commonRequiredProps);
  const optionalProps = (type.optionalProps || []).concat(commonOptionalProps).concat(requiredProps);

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