import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { cloneDeep, isFunction, isNil, isArray } from 'lodash/fp';
import {
  validateFormProps,
  customRadioPropValidation,
  customSelectPropValidation,
} from './formUtils';
import {
  FormInputGeneric,
  FormInputMultiText,
  FormInputSelect,
  FormInputCheckbox,
  FormInputSlider,
  FormInputRadioGroup,
  FormInputYesNoRadioGroup,
  FormInputTextarea,
  FormInputRadioButton,
  FormInputFile,
  getKey
} from './formComponents';

import './forms.css';
import { dateValidator, emailValidator, isValid, requiredValidator, urlValidator } from './formValidation';

export const commonRequiredProps = [
  'id',
];
export const commonOptionalProps = [
  'name',
  'disabled',
  'description',
  'helpText',
  'title',
  'ariaLevel',
  'ariaDescribedby',
  'defaultValue',
  'hideTitle',
  'style',
  'validators',
  'onChange',
  'type',
  'key',
  'isRendered',
  'validation',
  'onValidationChange'
];

// ----------------------------------------------------------------------------------------------------- //
// ======                                  MAIN FORM FIELD TYPES                                  ====== //
// ----------------------------------------------------------------------------------------------------- //
export const FormFieldTypes = {
  MULTITEXT: {
    defaultValue: [],
    component: FormInputMultiText,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle'
    ],
  },
  SLIDER: {
    defaultValue: false,
    component: FormInputSlider,
    requiredProps: [],
    optionalProps: [
      'toggleText',
    ],
  },
  RADIOGROUP: {
    defaultValue: null,
    component: FormInputRadioGroup,
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
  YESNORADIOGROUP: {
    defaultValue: null,
    component: FormInputYesNoRadioGroup,
    optionalProps: [
      'orientation', // 'vertical' or 'horizontal'
    ],
  },
  RADIOBUTTON: {
    defaultValue: null,
    requiredProps: [
      'value',
    ],
    optionalProps: [
      'toggleText',
    ],
    component: FormInputRadioButton,
  },
  TEXT: {
    defaultValue: '',
    component: FormInputGeneric,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
      'readOnly',
    ],
  },
  NUMBER: {
    defaultValue: '',
    inputType: 'number',
    component: FormInputGeneric,
    parseFormInput: (formInput, prevValue) => {
      if (formInput === '') {
        return 0;
      } else {
        // if there is a value, try to parse it; if parsing fails, then the value should stay the same.
        const parsed = +formInput;
        return isNaN(parsed) ? prevValue : parsed;
      }
    },
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
      'readOnly',
    ],
  },
  FILE: {
    defaultValue: null,
    component: FormInputFile,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'uploadText',
      'hideTextBar',
      'hideInput',
    ],
  },
  CHECKBOX: {
    defaultValue: false,
    component: FormInputCheckbox,
    requiredProps: [],
    optionalProps: [
      'toggleText'
    ],
  },
  SELECT: {
    defaultValue: (config) => (config?.isMulti ? [] : ''),
    component: FormInputSelect,
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
    component: FormInputTextarea,
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
export const FormFieldTitle = (props) => {
  const {
    title,
    hideTitle,
    description,
    helpText,
    formId,
    ariaLevel,
    required,
    validation,
  } = props;

  return <div>
    {title && !hideTitle &&
      <label
        id={`lbl_${formId}`}
        className={`control-label ${isValid(validation) ? '' : 'errored'}`}
        htmlFor={`${formId}`}
        aria-level={ariaLevel}>
        {title}
        {required && '*'}
      </label>
    }
    {helpText && <span style={{ fontStyle: 'italic', padding: 7 }}>{helpText}</span>}
    {description && <div style={{ marginBottom: 15 }}>{description}</div>}
  </div>;
};

export const FormField = (config) => {
  const {
    id, name, type = FormFieldTypes.TEXT, ariaLevel,
    title, hideTitle, description, helpText,
    defaultValue, style, validators,
    validation, onValidationChange
  } = config;

  // if the user specifies the 'errors' prop, we should use that as the source of truth.
  // otherwise, we should use internal state to keep track of errors.
  const [internalValidationState, setInternalValidationState] = useState();

  const typeDefaultValue = isFunction(type.defaultValue) ? type.defaultValue(config) : type.defaultValue;
  const [formValue, setFormValue] = useState(typeDefaultValue || '');

  const required = (validators || []).includes(FormValidators.REQUIRED);

  useEffect(() => {
    if (defaultValue !== undefined) {
      setFormValue(defaultValue);
    }
  }, [defaultValue, type]);

  useEffect(() => {
    validateFormProps(config);
  }, [config]);

  const getValidation = useCallback(() => {
    if (!isNil(validation)) {
      return validation;
    }
    return internalValidationState;
  }, [internalValidationState, validation]);

  const updateValidation = useCallback((newValidation) => {
    if (!isNil(onValidationChange)) {
      onValidationChange({ key: getKey({ name, id }), validation: newValidation });
      return;
    }
    setInternalValidationState(newValidation);
  }, [name, id, setInternalValidationState, onValidationChange]);

  return <div key={`formControl_${id}`} style={style} className={`formField-container formField-${id}`}>
    <FormFieldTitle
      title={title}
      hideTitle={hideTitle}
      description={description}
      helpText={helpText}
      required={required}
      formId={id}
      ariaLevel={ariaLevel}
      validation={getValidation()}
    />
    <type.component
      {...config}
      validation={getValidation()}
      setValidation={(newValidation) => updateValidation(newValidation)}
      formValue={formValue}
      setFormValue={setFormValue}
      required={required}
    />
  </div>;
};

/*
* Config options:
* id
* formFields: array[FormField Configs]
* onChange, error, setError, formInfo, setFormInfo
*/
export const FormTable = (config) => {
  const {
    id, formFields,
    enableAddingRow, addRowLabel,
    disabled, onChange, minLength,
    validation, onValidationChange, defaultValue
  } = config;

  const [formValue, setFormValue] = useState(defaultValue || [{}]);

  const key = getKey(config);

  return <div id={id} className={`formField-table formField-${id}`}>
    {/* generate columns */}
    <div className="formTable-row formTable-cols">
      {formFields.map(({ validators, title }) => {
        const required = (validators || []).includes(FormValidators.REQUIRED);
        return (
          <label className="control-label" key={`${id}-${title}`} id={`${id}-${title}`}>
            {title}
            {required && '*'}
          </label>
        );
      })}
    </div>
    {/* generate form rows */}
    {formValue?.map((formRow, i) => (
      <div className="formTable-row formTable-data-row" key={`formtable-${id}-${i}`}>
        {formFields.map(formCol => (
          <FormField
            {...formCol}
            key={`${id}-${i}-${formCol.id}`}
            id={`${id}-${i}-${formCol.id}`}
            hideTitle={true}
            ariaDescribedby={`${id}-${formCol.title}`}
            defaultValue={formValue[i][getKey(formCol)]}
            validation={!isNil(validation) && isArray(validation) ? validation.at(i)?.[getKey(formCol)] : undefined}
            onChange={({ value }) => {
              const formValueClone = cloneDeep(formValue);
              formValueClone[i][getKey(formCol)] = value;
              setFormValue(formValueClone);
              onChange({key: key, value: formValueClone, isValid: true });
            }}
            onValidationChange={({ validation }) => {
              if (isNil(onValidationChange)) {
                return;
              }
              onValidationChange({ key: [getKey(config), i, getKey(formCol)], validation: validation });
            }}
          />
        ))}
        <button
          id={`delete-table-row-${id}-${i}`}
          key={`delete-table-row-${id}-${i}`}
          className="btn-formTable-delete btn-xs"
          type="button"
          disabled={disabled || formValue.length <= minLength}
          onClick={() => {
            const formValueClone = cloneDeep(formValue);
            formValueClone.splice(i, 1);
            setFormValue(formValueClone);
            onChange({ key: key, value: formValueClone, isValid: true });
            if (!isNil(validation) && !isNil(onValidationChange)) {
              const validationClone = cloneDeep(validation);
              validationClone.splice(i, 1);
              onValidationChange({ key: getKey(config), validation: validationClone });
            }
          }}>
          <span className="glyphicon glyphicon-remove" />
        </button>
      </div>
    ))}
    {/* add new row to table button */}
    {enableAddingRow && (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          id={`add-new-table-row-${id}`}
          key={`add-new-table-row-${id}`}
          className="pill form-btn btn-xs"
          type="button"
          onClick={() => {
            const formValueClone = cloneDeep(formValue);
            formValueClone.push({});
            setFormValue(formValueClone);
            onChange({key: key, value: formValueClone, isValid: true });
          }}
          style={{ marginTop: 10 }}
        >
          {addRowLabel || 'Add New'}
          <span className="glyphicon glyphicon-plus" style={{ marginLeft: '8px' }} />
        </button>
      </div>
    )}
  </div>;
};
