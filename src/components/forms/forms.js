import { useState, useEffect } from 'react';
import { h, div, label, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, isFunction, isString, isNil, isArray, isEmpty } from 'lodash/fp';
import { isEmailAddress } from '../../libs/utils';
import { validateFormProps } from './formUtils';
import {
  formInputGeneric,
  formInputMultiText,
  formInputSelect,
  formInputCheckbox,
  formInputSlider,
  formInputRadioGroup
} from './formComponents';

import './forms.css';

export const FormFieldTypes = {
  MULTITEXT: {
    defaultValue: [],
    component: formInputMultiText,
    requiredProps: [],
    possibleProps: [
      'title',
      'placeholder',
      'ariaDescribedby',
      'inputStyle'
    ],
  },
  SLIDER: {
    defaultValue: false,
    component: formInputSlider,
    requiredProps: [],
    possibleProps: [
      'toggleText',
    ],
  },
  RADIO: {
    defaultValue: null,
    component: formInputRadioGroup,
    requiredProps: [
      'options',
    ],
    possibleProps: [
      'ariaDescribedBy',
    ],
    customPropValidation: (props) => {
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

        if (!isNil(opt.type) && !['boolean', 'string'].includes(opt.type)) {
          throw `radio group option types can be 'boolean' or 'string', not: '${opt.type}'`;
        }
      })
    }
  },
  TEXT: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    possibleProps: [
      'type',
      'placeholder',
      'inputStyle',
      'ariaDescribedby',
    ],
  },
  NUMBER: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    possibleProps: [
      'type',
      'placeholder',
      'inputStyle',
      'ariaDescribedby',
    ],
  },
  CHECKBOX: {
    defaultValue: (config) => (config?.valueType === 'string' ? '' : false),
    component: formInputCheckbox,
    requiredProps: [],
    possibleProps: [
      'placeholder',
      'inputStyle',
    ],
  },
  SELECT: {
    defaultValue: (config) => (config?.isMulti ? [] : ''),
    updateDefaultValue: ({ selectOptions, defaultValue }) => {
      const isStringArr = isString(selectOptions[0]);
      return isStringArr
        ? { key: defaultValue, displayText: defaultValue }
        : defaultValue;
    },
    component: formInputSelect,
    requiredProps: [
      'selectOptions'
    ],
    possibleProps: [
      'isCreatable',
      'isMulti',
      'placeholder',
      'ariaDescribedby',
      'required',
      'disabled',
    ],
    customPropValidation: (props) => {
      if (!isArray(props.selectOptions)) {
        throw 'prop \'selectOptions\' must be an array';
      }

      if (isEmpty(props.selectOptions)) {
        throw '\'selectOptions\' cannot be empty';
      }

      const isStringArr = isString(props.selectOptions[0])

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
      })
    }
  },
};

export const FormValidators = {
  REQUIRED: {
    isValid: (value) => value !== undefined && value !== null && value !== '',
    msg: 'Please enter a value'
  },
  URL: {
    isValid: (val) => {
      try {
        new URL(val);
      } catch (_) {
        return false;
      }
      return true;
    },
    msg: 'Please enter a valid url (e.g., https://www.google.com)'
  },
  EMAIL: {
    isValid: isEmailAddress,
    msg: 'Please enter a valid email address (e.g., person@example.com)'
  }
};

//---------------------------------------------
// Main Components
//---------------------------------------------
/*
* Config options:
* id, title, description
* type (ENUM: 'text', 'multitext', 'select', 'sliding-checkbox', 'checkbox', 'radio')
*  * type == 'text'
*  * type == 'multitext'
*  * type == 'select'
*    * selectOptions: [{key: '', displayText: ''}] or ['', '']
*    * isMulti: boolean - allow multiple simultaneous options
*    * creatable: boolean - allow creating new values (not part of options)
*  * type == 'radio'
*    * options: [{name: '', displayText: '', type: ('boolean' || 'string')}]
*       * if an option is of type string, a textbox will be added when selected.
*  * type == 'checkbox'
*    * toggleText
*    * checkboxType
*  * type === 'sliding-checkbox'
* disabled: bool
* placeholder, defaultValue,
* style (for the formControl component)
* inputStyle (for the input element)
* onChange: func({key: '', value: '', isValid: boolean}),
* validators: [{isValid: func, msg: ''}]
* Accessibility: (defaults blank)
*    * ariaDescribedby
*    * ariaLevel
*/
export const FormField = (config) => {
  const {
    id, type = FormFieldTypes.TEXT, ariaLevel,
    title, hideTitle, description,
    defaultValue, style, validators
  } = config;

  const [error, setError] = useState();

  const typeDefaultValue = isFunction(type.defaultValue) ? type.defaultValue(config) : type.defaultValue;
  const [formValue, setFormValue] = useState(typeDefaultValue || '');

  const required = (validators || []).includes(FormValidators.REQUIRED);

  useEffect(() => {
    if (defaultValue !== undefined) {
      const normalizedValue = isFunction(type.updateDefaultValue)
        ? type.updateDefaultValue(config)
        : defaultValue;
      setFormValue(normalizedValue);
    }
  }, [defaultValue, config, type]);

  useEffect(() => {
    validateFormProps(config);
  }, [config])

  return div({
    key: `formControl_${id}`,
    style,
    className: `formField-container formField-${id}`
  }, [
    title && !hideTitle && label({
      id: `lbl_${id}`,
      className: `control-label ${error ? 'errored' : ''}`,
      htmlFor: `${id}`,
      'aria-level': ariaLevel
    }, [
      title,
      required && '*'
    ]),
    description && div({ style: { marginBottom: 15 } }, description),
    h(type.component, {
      ...config,
      error, setError,
      formValue, setFormValue,
      required
    })
  ]);
};

/*
* Config options:
* id
* formFields: array[FormField Configs]
* onChange, error, setError, formInfo, setFormInfo
*/
export const FormTable = (config) => {
  const {
    id, formFields, defaultValue,
    enableAddingRow, addRowLabel,
    disabled, onChange, minLength
  } = config;

  const [formValue, setFormValue] = useState(defaultValue || [{}]);

  return div({ id, className: `formField-table formField-${id}` }, [
    // generate columns
    div({ className: 'formTable-row formTable-cols' }, formFields.map(({ validators, title }) => {
      const required = (validators || []).includes(FormValidators.REQUIRED);
      return label({ className: 'control-label', id: `${id}-${title}` }, [
        title,
        required && '*'
      ]);
    })),
    // generate form rows
    formValue?.map((formRow, i) => {
      return div({ className: 'formTable-row formTable-data-row', key: `formtable-${id}-${i}` }, [
        ...formFields.map(formCol => {
          return h(FormField, {
            ...formCol,
            id: `${id}-${i}-${formCol.id}`,
            hideTitle: true, ariaDescribedby: `${id}-${formCol.title}`,
            defaultValue: formValue[i][formCol.id],
            onChange: ({ value }) => {
              const formValueClone = cloneDeep(formValue);
              formValueClone[i][formCol.id] = value;
              setFormValue(formValueClone);
              onChange({key: `${id}.${i}.${formCol.id}`, value: value, isValid: true });
            }
          });
        }),
        h(button, {
          id: `delete-table-row-${id}-${i}`,
          key: `delete-table-row-${id}-${i}`,
          className: 'btn-formTable-delete btn-xs',
          type: 'button',
          disabled: disabled || formValue.length <= minLength,
          onClick: () => {
            const formValueClone = cloneDeep(formValue);
            formValueClone.splice(i, 1);
            setFormValue(formValueClone);
            onChange({ key: id, value: formValueClone, isValid: true });
          }
        }, [
          span({ className: 'glyphicon glyphicon-remove' })
        ])
      ]);
    }),
    // add new row to table button
    div({
      style: { display: 'flex', width: '100%', justifyContent: 'flex-end', marginTop: 10 },
      isRendered: enableAddingRow
    }, [
      h(button, {
        id: `add-new-table-row-${id}`,
        key: `add-new-table-row-${id}`,
        className: 'pill form-btn btn-xs',
        type: 'button',
        onClick: () => {
          const formValueClone = cloneDeep(formValue);
          formValueClone.push({});
          setFormValue(formValueClone);
          onChange({ key: `${id}.${formValueClone.length - 1}`, value: {} });
        },
        style: { marginTop: 10 }
      }, [
        (addRowLabel || 'Add New'),
        span({ className: 'glyphicon glyphicon-plus', style: { marginLeft: '8px' } })
      ])
    ])
  ]);
};
