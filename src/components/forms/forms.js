import { useState, useEffect } from 'react';
import { h, div, label, input, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil, isEmpty } from 'lodash/fp';
import { SearchSelectOrText } from '../SearchSelectOrText';
import Creatable from 'react-select/creatable';
import { isEmailAddress } from '../../libs/utils';

import './forms.css';

export const FormFieldTypes = {
  SELECT: { id: 'select', defaultValue: '' },
  SELECT_CREATABLE: { id: 'selectCreatable', defaultValue: '' },
  MULTITEXT: { id: 'multitext', defaultValue: [] },
  CHECKBOX: { id: 'checkbox', defaultValue: false },
  SLIDER: { id: 'slider', defaultValue: false },
  TEXT: { id: 'text', defaultValue: '' },
  NUMBER: { id: 'number', defaultValue: '' }
};

export const styles = {
  inputStyle: {
    padding: '25px 15px',
    width: '100%'
  }
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
// Form Behavior
//---------------------------------------------
const validateFormInput = (config, value) => {
  const { setError, validators } = config;
  if (validators) {
    const validationResults = validators
      .filter(validator => !validator.isValid(value))
      .map(x => x.msg);

    const isValid = validationResults.length === 0;
    setError(isValid ? undefined : validationResults);
    return isValid;
  }
  setError();
  return true;
};

const normalizeValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  } else if (Array.isArray(value)) {
    return value
      .map(x => normalizeValue(x))
      .filter(x => x); // filter out null strings
  }
  return value;
};

const onFormInputChange = (config, value) => {
  const { id, onChange, setFormValue } = config;
  const normalizedValue = normalizeValue(value);
  const isValidInput = validateFormInput(config, normalizedValue);

  onChange({key: id, value: normalizedValue, isValid: isValidInput });
  setFormValue(value);
};

const errorMessage = (error) => {
  return error && div({ className: `error-message fadein`}, [
    span({ className: 'glyphicon glyphicon-play' }),
    ...error.map((err) => div([err])),
  ]);
};

//---------------------------------------------
// Form Controls
//---------------------------------------------
const formInput = (config) => {
  switch (config.type) {
    case FormFieldTypes.SELECT: return formInputSelect(config);
    case FormFieldTypes.SELECT_CREATABLE: return formInputSelectOrCreate(config);
    case FormFieldTypes.MULTITEXT: return formInputMultiText(config);
    case FormFieldTypes.CHECKBOX: return formInputCheckbox(config);
    case FormFieldTypes.SLIDER: return formInputSlider(config);
    case FormFieldTypes.TEXT:
    case FormFieldTypes.NUMBER:
    default:
      return formInputGeneric(config);
  }
};

const formInputGeneric = (config) => {
  const {
    id, title, type, disabled,
    placeholder,
    inputStyle, ariaDescribedby,
    formValue, error, setError
  } = config;

  return div([
    input({
      id: id,
      type: type || 'text',
      className: `form-control ${error ? 'errored' : ''}`,
      placeholder: placeholder || title,
      value: formValue,
      style: { ...styles.inputStyle, ...inputStyle },
      disabled: disabled,
      onChange: (event) => onFormInputChange(config, event.target.value),
      onFocus: () => setError(),
      onBlur: (event) => validateFormInput(config, event.target.value),
      'aria-describedby': ariaDescribedby,
    }),
    errorMessage(error)
  ]);
};

const formInputMultiText = (config) => {
  const {
    id, title, disabled,
    placeholder, ariaDescribedby,
    inputStyle, onChange,
    formValue, setFormValue, error, setError
  } = config;

  const pushValue = (element) => {
    const value = element.value.trim();

    if (!value || !validateFormInput(config, value)) {
      return;
    }
    if (formValue.indexOf(value) !== -1) {
      element.value = '';
      return;
    }

    const formValueClone = cloneDeep(formValue);
    formValueClone.push(value);
    setFormValue(formValueClone);
    onChange({key: id, value: formValueClone, isValid: true});
    element.value = '';
  };

  const removePill = (index) => {
    const formValueClone = cloneDeep(formValue);
    formValueClone.splice(index, 1);
    setFormValue(formValueClone);
    onChange({key: id, value: formValueClone, isValid: true});
  };

  return div({}, [
    div({
      className: 'formControl-group flex-row',
    }, [
      input({
        id,
        type: 'text',
        className: `form-control ${error ? 'errored' : ''}`,
        placeholder: placeholder || title,
        style: { ...styles.inputStyle, ...inputStyle },
        disabled,
        'aria-describedby': ariaDescribedby,
        onKeyUp: (event) => event.code === 'Enter' ? pushValue(event.target) : setError(),
        onFocus: () => setError()
      }),
      h(button, {
        className: 'form-btn btn-xs',
        type: 'button',
        disabled,
        style: {
          marginTop: 0,
          minWidth: 'fit-content'
        },
        onClick: () => pushValue(document.getElementById(id))
      }, [
        span({
          className: 'glyphicon glyphicon-plus',
          'aria-label': 'Add',
          style: { margin: '0 8px' },
          isRendered: !disabled
        })
      ])
    ]),
    errorMessage(error),
    div({ className: 'flex-row', style: { justifyContent: null } },
      formValue.map((val, i) => {
        return h(button, {
          key: val,
          className: 'pill btn-xs',
          type: 'button',
          disabled,
          onClick: () => removePill(i)
        }, [
          val,
          span({
            className: 'glyphicon glyphicon-remove',
            style: { marginLeft: '8px' },
            isRendered: !disabled
          })
        ]);
      })
    )
  ]);
};

// Using react-select/creatable - Passing config directly through!
const formInputSelectOrCreate = (config) => {
  const {
    id, title, disabled, required, error, setError,
    selectOptions, searchPlaceholder, ariaDescribedby,
    formValue,
    creatableConfig = {}
  } = config;

  return h(Creatable, {
    key: id,
    isClearable: true, //ensures that selections can be cleared from dropdown, adds an 'x' within input box
    required,
    isDisabled: disabled,
    placeholder: searchPlaceholder || `Search for ${title}...`,
    className: `form-select ${error ? 'errored' : ''}`,
    onChange: (option) => onFormInputChange(config, option),
    onMenuOpen: () => setError(),
    onMenuClose: () => {
      if (required && !formValue) {
        setError(FormValidators.REQUIRED.msg);
      }
    },
    options: selectOptions,
    getOptionLabel: (option) => option.displayValue,
    getNewOptionData: (inputValue) => {
      return { displayValue: inputValue };
    },
    getOptionValue: (option) => { //value formatter for options, attr used to ensure empty strings are treated as undefined
      if(isNil(option) || isEmpty(option.displayName)) {
        return null;
      }
      return option;
    },
    value: formValue,
    ...creatableConfig,
    'aria-describedby': ariaDescribedby
  });
};

const formInputSelect = (config) => {
  const {
    id, title, disabled, error, setError,
    selectOptions, searchPlaceholder, ariaDescribedby
  } = config;

  return div({}, [
    h(SearchSelectOrText, {
      id,
      'aria-describedby': ariaDescribedby,
      onPresetSelection: async (selection) => onFormInputChange(config, selection),
      onManualSelection: (selection) => onFormInputChange(config, selection),
      onOpen: () => setError(),
      options: selectOptions.map((x) => {
        return typeof x == 'string' || typeof x === 'number'
          ? { key: x, displayText: x }
          : x;
      }),
      searchPlaceholder: searchPlaceholder || `Search for ${title}...`,
      className: 'form-control',
      disabled, errored: error
    }),
    errorMessage(error)
  ]);
};

const formInputCheckbox = (config) => {
  const {
    id, disabled, error, toggleText,
    formValue, ariaDescribedby
  } = config;

  return div({ className: 'checkbox' }, [
    input({
      type: 'checkbox',
      id: `cb_${id}_${toggleText}`,
      checked: formValue,
      className: 'checkbox-inline',
      'aria-describedby': ariaDescribedby,
      onChange: (event) => onFormInputChange(config, event.target.checked),
      disabled
    }),
    label({
      className: `regular-checkbox ${error ? 'errored' : ''}`,
      htmlFor: `cb_${id}_${toggleText}`,
    }, [toggleText])
  ]);
};

const formInputSlider = (config) => {
  const {
    id, disabled, toggleText, formValue
  } = config;

  return div({ className: 'flex-row', style: { justifyContent: 'unset' } }, [
    label({ className: 'switch', htmlFor: `cb_${id}_${toggleText}` }, [
      input({
        type: 'checkbox',
        id: `cb_${id}_${toggleText}`,
        checked: formValue,
        className: 'checkbox-inline',
        onChange: (event) => onFormInputChange(config, event.target.checked),
        disabled
      }),
      div({className: 'slider round'}),
    ]),
    div({
      style: {
        marginLeft: 15,
        fontStyle: 'italic'
      }
    }, [toggleText])
  ]);
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
    id, type, ariaLevel,
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
    formInput({
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
