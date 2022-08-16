import { useState } from 'react';
import { h, div, label, input, span, button } from 'react-hyperscript-helpers';
import { cloneDeep } from 'lodash/fp';
import { SearchSelectOrText } from '../SearchSelectOrText';
import { Theme } from '../../libs/theme';
import './forms.css';

export const FormFieldTypes = {
  SELECT: 'select',
  MULTITEXT: 'multitext',
  CHECKBOX: 'checkbox',
  SLIDER: 'slider',
  TEXT: 'text',
  NUMBER: 'number'
};

export const styles = {
  inputStyle: {
    padding: '25px 15px',
    width: '100%'
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  }
};

//---------------------------------------------
// Form Behavior
//---------------------------------------------
const validateRequired = (value) => {
  return value === undefined || value === null || value === ''
    ? 'Please enter a value'
    : null;
};

const extractValidators = (config) => {
  const { required, validator } = config;
  const ret = [];

  if (required) {
    ret.push(validateRequired);
  }
  if (validator) {
    if (Array.isArray(validator)) {
      validator.forEach(v => ret.push(v));
    } else {
      ret.push(validator);
    }
  }

  return ret;
};

const validateFormInput = (config, value) => {
  const { setError } = config;
  const validators = extractValidators(config);
  const validationResults = validators
    .map((validator) => validator(value))
    .filter(x => !!x);

  if (validationResults.length === 0) {
    setError();
    return true;
  } else {
    setError(validationResults);
    return false;
  }
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

  if (isValidInput) {
    onChange({key: id, value: normalizedValue});
  }

  setFormValue(value);
};

//---------------------------------------------
// Form Controls
//---------------------------------------------
const formInput = (config) => {
  switch (config.type) {
    case FormFieldTypes.SELECT: return formInputSelect(config);
    case FormFieldTypes.MULTITEXT: return formInputMultiText(config);
    case FormFieldTypes.CHECKBOX: return formInputCheckbox(config);
    case FormFieldTypes.SLIDER: return formInputSlider(config);
    case FormFieldTypes.TEXT:
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
    error && div({ className: `error-message fadein`}, [
      span({ className: 'glyphicon glyphicon-play' }),
      ...error.map((err) => div([err])),
    ])
  ]);
};

const formInputMultiText = (config) => {
  const {
    id, title, disabled,
    placeholder, ariaDescribedby,
    inputStyle, onChange,
    formValue, setFormValue, error, setError
  } = config;

  const pushValue = (event) => {
    const value = event.target.value.trim();

    if (!value || !validateFormInput(config, value)) {
      return;
    }
    if (formValue.indexOf(value) !== -1) {
      event.target.value = '';
      return;
    }

    const formValueClone = cloneDeep(formValue);
    formValueClone.push(value);
    setFormValue(formValueClone);
    onChange({key: id, value: formValueClone});
    event.target.value = '';
  };

  const removePill = (index) => {
    const formValueClone = cloneDeep(formValue);
    formValueClone.splice(index, 1);
    setFormValue(formValueClone);
    onChange({key: id, value: formValueClone});
  };

  return div({}, [
    input({
      id,
      type: 'text',
      className: `form-control ${error ? 'errored' : ''}`,
      placeholder: placeholder || title,
      style: { ...styles.inputStyle, ...inputStyle },
      disabled,
      'aria-describedby': ariaDescribedby,
      onKeyUp: (event) => {
        if (event.code === 'Enter') {
          pushValue(event);
        } else {
          setError();
        }
      },
      onFocus: () => setError()
    }),
    error && div({ className: `error-message fadein`}, [
      span({ className: 'glyphicon glyphicon-play' }),
      ...error.map((err) => div([err])),
    ]),
    div({ style: { ...styles.flexRow, justifyContent: null } },
      formValue.map((val, i) => {
        return h(button, {
          key: val,
          className: 'pill btn-xs',
          type: 'button',
          onClick: () => removePill(i)
        }, [
          val,
          span({ className: 'glyphicon glyphicon-remove', style: { marginLeft: '8px' } })
        ]);
      })
    )
  ]);
};

const formInputSelect = (config) => {
  const {
    id, title, disabled, error,
    selectOptions, searchPlaceholder, ariaDescribedby
  } = config;

  return h(SearchSelectOrText, {
    id,
    'aria-describedby': ariaDescribedby,
    onPresetSelection: async (selection) => onFormInputChange(config, selection),
    onManualSelection: (selection) => onFormInputChange(config, selection),
    options: selectOptions.map((x) => { return { key: x, displayText: x }; }),
    searchPlaceholder: searchPlaceholder || `Search for ${title}...`,
    className: 'form-control',
    disabled, errored: error
  });
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
      style: {
        fontWeight: 'normal',
        fontStyle: 'italic'
      }
    }, [toggleText])
  ]);
};

const formInputSlider = (config) => {
  const {
    id, disabled, toggleText, formValue
  } = config;

  return div({ style: { ...styles.flexRow, justifyContent: 'unset', alignItems: 'center' } }, [
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
* type (ENUM: 'text', 'multitext', 'select', 'sliding-checkbox')
*  * type == select
*    * selectOptions: [{key: string, displayText: string}]
*    * searchPlaceholder
*  * type == 'checkbox'
*    * toggleText
*    * checkboxType
* required, disabled
* placeholder, defaultValue,
* style (for the formControl component)
* inputStyle (for the input element)
* onChange,
* validator: function that returns string with error message if errored
*/
export const FormField = (config) => {
  const {
    id, title, hideTitle, description,
    defaultValue, required, style
  } = config;

  const [error, setError] = useState();
  const [formValue, setFormValue] = useState(defaultValue || '');

  return div({
    key: `formControl_${id}`,
    style,
    className: `formField-container formField-${id}`
  }, [
    title && !hideTitle && label({
      id: `lbl_${id}`,
      className: `control-label ${error ? 'errored' : ''}`,
      htmlFor: `${id}`
    }, [
      title,
      required && '*'
    ]),
    description && div({ style: { marginBottom: 15 } }, [description]),
    formInput({
      ...config,
      error, setError,
      formValue, setFormValue
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
    onChange
  } = config;

  const [formValue, setFormValue] = useState(defaultValue || [{}]);

  return div({ id, className: `formField-table formField-${id}` }, [
    // generate columns
    div({ className: 'formTable-row formTable-cols' }, formFields.map(x => {
      return label({ className: 'control-label', id: `${id}-${x.title}` }, [x.title]);
    })),
    // generate form rows
    formValue?.map((formRow, i) => {
      return div({ className: 'formTable-row formTable-data-row', key: `formtable-${id}-${i}` }, [
        ...formFields.map(formCol => {
          return h(FormField, {
            ...formCol,
            id: `${id}-${i}-${formCol.id}`,
            hideTitle: true, ariaDescribedby: `${id}-${formCol.title}`,
            onChange: (({ value }) => onChange({key: `${id}.${i}.${formCol.id}`, value }))
          });
        }),
        h(button, {
          id: `delete-table-row-${id}-${i}`,
          key: `delete-table-row-${id}-${i}`,
          className: 'btn-formTable-delete btn-xs',
          type: 'button',
          onClick: () => {
            const formValueClone = cloneDeep(formValue);
            formValueClone.splice(i, 1);
            setFormValue(formValueClone);
            onChange({ key: id, value: formValueClone });
          }
        }, [
          span({ className: 'glyphicon glyphicon-remove' })
        ])
      ]);
    }),
    // add new row to table button
    div({ style: { display: 'flex', width: '100%', justifyContent: 'flex-end' } }, [
      h(button, {
        id: `add-new-table-row-${id}`,
        key: `add-new-table-row-${id}`,
        className: 'pill btn-xs',
        style: {
          backgroundColor: Theme.palette.secondary,
          borderRadius: 0,
          marginRight: 0
        },
        type: 'button',
        onClick: () => {
          const formValueClone = cloneDeep(formValue);
          formValueClone.push({});
          setFormValue(formValueClone);
          onChange({ key: id, value: formValueClone });
        }
      }, [
        'Add New Filetype',
        span({ className: 'glyphicon glyphicon-plus', style: { marginLeft: '8px' } })
      ])
    ])
  ]);
};

