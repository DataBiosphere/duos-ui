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
  dateValidator,
} from './formUtils';
import {
  formInputGeneric,
  formInputMultiText,
  formInputSelect,
  formInputCheckbox,
  formInputSlider,
  formInputRadioGroup,
  formInputTextarea,
  formInputRadioButton,
} from './formComponents';

import './forms.css';

export const commonRequiredProps = ['id'];
export const commonOptionalProps = [
  'name',
  'disabled',
  'description',
  'title',
  'ariaLevel',
  'ariaDescribedby',
  'defaultValue',
  'hideTitle',
  'style',
  'validators',
  'onChange',
  'type'
];

// ----------------------------------------------------------------------------------------------------- //
// ======                                  MAIN FORM FIELD TYPES                                  ====== //
// ----------------------------------------------------------------------------------------------------- //
export const FormFieldTypes = {
  MULTITEXT: {
    defaultValue: [],
    component: formInputMultiText,
    requiredProps: [],
    optionalProps: [
      'placeholder',
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
  RADIOGROUP: {
    defaultValue: null,
    component: formInputRadioGroup,
    requiredProps: [
      'options',
      // 'options' example:
      // [
      //  {name: 'opt_1', text: 'Option 1'},
      //  {id: 'custom_id_other', name: 'other', text: 'Other'}
      // ]
    ],
    optionalProps: [
      'orientation', // 'vertical' or 'horizontal'
    ],
    customPropValidation: customRadioPropValidation,
  },
  RADIOBUTTON: {
    defaultValue: null,
    requiredProps: [
      'value',
    ],
    optionalProps: [
      'toggleText',
    ],
    component: formInputRadioButton
  },
  TEXT: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle'],
  },
  NUMBER: {
    defaultValue: '',
    component: formInputGeneric,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle'
    ],
  },
  CHECKBOX: {
    defaultValue: false,
    component: formInputCheckbox,
    requiredProps: [],
    optionalProps: [
      'toggleText'
    ],
  },
  SELECT: {
    defaultValue: (config) => (config?.isMulti ? [] : ''),
    // updateDefaultValue: (config) => {
    //   const {
    //     selectOptions, defaultValue, isMulti
    //   } = config;
    //   const isStringArr = config.isStringArr || (!isNil(selectOptions) && isString(selectOptions[0]));

    //   if (isMulti) {
    //     return isStringArr ? defaultValue.map((v) => {return { key: v, displayValue: v };}) : defaultValue;
    //   }

    //   return isStringArr
    //     ? { key: defaultValue, displayText: defaultValue }
    //     : defaultValue;
    // },
    component: formInputSelect,
    requiredNormalSelectProps: [
      'selectOptions'
      // 'selectOptions' example:
      // [
      //  {displayText: 'Option 1'}
      //   ^^^ can pass other fields in as extra info, e.g.:
      //  {displayText: 'Dac 1', dacId: 213}
      // ]
      // can also be array of stirngs: ['Option 1', 'Option 2']
    ],
    requiredAsyncSelectProps: [
      'loadOptions',
      // 'loadOptions': (query, callback) => callback(selectOptions)
      'optionsAreString', // true if options are ['', ...], false if options are [{displayText: ''}, ...]
    ],
    optionalProps: [
      'isCreatable', // allows user to input their own
      'isMulti',
      'isAsync', // if specified, options are loaded via 'loadOptions'
      'placeholder',
      'selectConfig',
      'exclusiveValues', // e.g., ['Not Determined'], if not determined is selected, everything else will be cleared
      'loadOptions',
      'optionsAreString',
      'selectOptions'
    ],
    customPropValidation: customSelectPropValidation,
  },
  TEXTAREA: {
    defaultValue: '',
    component: formInputTextarea,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
      'rows',
      'maxLength',
    ]
  }
};

// ----------------------------------------------------------------------------------------------------- //
// ======                                     FORM VALIDATORS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //
export const FormValidators = {
  REQUIRED: requiredValidator,
  URL: urlValidator,
  EMAIL: emailValidator,
  DATE: dateValidator,
};

// ----------------------------------------------------------------------------------------------------- //
// ======                                     MAIN COMPONENTS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //
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
