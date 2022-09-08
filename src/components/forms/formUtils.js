import {FormFieldTypes} from './forms';
import { isNil } from 'lodash/fp';

const alwaysRequiredProps = ['id'];
const alwaysPossibleProps = [
  'name',
  'disabled',
  'description',
  'title',
  'ariaLevel',
  'defaultValue',
  'hideTitle',
  'style',
  'validators',
  'onChange',
  'type'
];

export const validateFormProps = (props) => {
  const type = (!isNil(props.type) ? props.type : FormFieldTypes.TEXT);

  const requiredProps = type.requiredProps || [];
  const possibleProps = type.possibleProps || [];

  requiredProps.push(...alwaysRequiredProps);
  possibleProps.push(...alwaysPossibleProps);
  possibleProps.push(...requiredProps);

  const propKeys = Object.keys(props);

  propKeys.forEach((prop) => {
    if (!possibleProps.includes(prop)) {
      throw `unknown prop ${prop}`;
    }
  });

  requiredProps.forEach((requiredProp) => {
    if (!propKeys.includes(requiredProp)) {
      throw `prop ${requiredProp} is required`;
    }
  });

  if (!isNil(type.customPropValidation)) {
    type.customPropValidation(props);
  }

};