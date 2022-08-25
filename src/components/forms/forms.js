import { useState, useEffect } from 'react';
import { h, div, label, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil, isEmpty } from 'lodash/fp';
import { SearchSelectOrText } from '../SearchSelectOrText';
import Creatable from 'react-select/creatable';
import { isEmailAddress } from '../../libs/utils';
import {
  formInputGeneric, formInputMultiText,
  formInputSelectOrCreate, formInputSelect,
  formInputCheckbox,
  formInputSlider
} from './formComponents';

import './forms.css';

export const FormFieldTypes = {
  SELECT: { defaultValue: '', component: formInputSelect },
  SELECT_CREATABLE: { defaultValue: '', component: formInputSelectOrCreate },
  MULTITEXT: { defaultValue: [], component: formInputMultiText },
  CHECKBOX: { defaultValue: false, component: formInputCheckbox },
  SLIDER: { defaultValue: false, component: formInputSlider },
  TEXT: { defaultValue: '', component: formInputGeneric },
  NUMBER: { defaultValue: '', component: formInputGeneric },
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
* type (ENUM: 'text', 'multitext', 'select', 'sliding-checkbox', 'checkbox')
*  * type == 'text'
*  * type == 'multitext'
*  * type == select
*    * selectOptions: [{key: '', displayText: ''}]
*    * searchPlaceholder
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
  const [formValue, setFormValue] = useState(type?.defaultValue || '');
  const required = (validators || []).includes(FormValidators.REQUIRED);

  useEffect(() => {
    if (defaultValue !== undefined) {
      setFormValue(defaultValue);
    }
  }, [defaultValue]);

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
      style: { display: 'flex', width: '100%', justifyContent: 'flex-end' },
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
        style: { marginTop: 10, padding: '17px 10px' }
      }, [
        (addRowLabel || 'Add New'),
        span({ className: 'glyphicon glyphicon-plus', style: { marginLeft: '8px' } })
      ])
    ])
  ]);
};
