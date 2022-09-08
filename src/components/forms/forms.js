import { useState, useEffect } from 'react';
import { h, div, label, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, isFunction } from 'lodash/fp';
import {
  validateFormProps,
  customRadioPropValidation,
  customSelectPropValidation,
  requiredValidator,
  urlValidator,
  emailValidator,
  updateSelectDefaultValue,
} from './formUtils';
import {
  formInputGeneric,
  formInputMultiText,
  formInputSelect,
  formInputCheckbox,
  formInputSlider,
  formInputRadioGroup
} from './formComponents';

import './forms.css';

export const commonRequiredProps = ['id'];
export const commonOptionalProps = [
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

// ----------------------------------------------- //
// ======       MAIN FORM FIELD TYPES       ====== //
// ----------------------------------------------- //
export const FormFieldTypes = {
  MULTITEXT: {
    defaultValue: [],
    component: formInputMultiText,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'ariaDescribedby',
      'inputStyle'
    ],
  },
  SLIDER: {
    defaultValue: false,
    component: formInputSlider,
    requiredProps: [],
    optionalProps: [
      'toggleText',
    ],
  },
  RADIO: {
    defaultValue: null,
    component: formInputRadioGroup,
    requiredProps: [
      'options',
      // 'options' example:
      // [
      //  {name: 'opt_1', text: 'Option 1'},
      //  {name: 'other', text: 'Other', type: 'string'} <-- will have textbox
      // ]
    ],
    optionalProps: [
      'ariaDescribedBy',
    ],
    customPropValidation: customRadioPropValidation,
  },
  TEXT: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
      'ariaDescribedby',
    ],
  },
  NUMBER: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
      'ariaDescribedby',
    ],
  },
  CHECKBOX: {
    defaultValue: (config) => (config?.valueType === 'string' ? '' : false),
    component: formInputCheckbox,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
    ],
  },
  SELECT: {
    defaultValue: (config) => (config?.isMulti ? [] : ''),
    updateDefaultValue: updateSelectDefaultValue,
    component: formInputSelect,
    requiredProps: [
      'selectOptions'
      // 'selectOptions' example:
      // [
      //  {displayText: 'Option 1'}
      //   ^^^ can pass other fields in as extra info, e.g.:
      //  {displayText: 'Dac 1', dacId: 213}
      // ]
    ],
    optionalProps: [
      'isCreatable', // allows user to input their own
      'isMulti',
      'placeholder',
      'ariaDescribedby',
      'required',
      'selectConfig',
    ],
    customPropValidation: customSelectPropValidation,
  },
};

export const FormValidators = {
  REQUIRED: requiredValidator,
  URL: urlValidator,
  EMAIL: emailValidator,
};

// ----------------------------------------------- //
// ======          MAIN COMPONENTS          ====== //
// ----------------------------------------------- //
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
  }, [config]);

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
