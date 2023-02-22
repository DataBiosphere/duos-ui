import { h, div, label, input, span, button, textarea } from 'react-hyperscript-helpers';
import { cloneDeep, isNil, isEmpty, isString } from 'lodash/fp';
import Creatable from 'react-select/creatable';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import AsyncCreatable from 'react-select/async-creatable';
import { FormField, FormValidators } from './forms';
import { RadioButton } from '../RadioButton';
import PublishIcon from '@mui/icons-material/Publish';

import './formComponents.css';
import { isArray } from 'lodash';

import { isValid, validateFormValue, validationMessage } from './formValidation';
import { useState } from 'react';

const styles = {
  inputStyle: {
    padding: '25px 15px',
    width: '100%'
  }
};

export const getKey = ({ name, id }) => {
  return (!isNil(name) ? name : id);
};

const updateValidation = (config, value) => {
  const {
    setValidation,
    validators
  } = config;
  const validation = validateFormValue(value, validators);
  setValidation(validation);

  return isValid(validation);
};

const onFormInputChange = (config, value) => {
  const { type, onChange, formValue, setFormValue, validators, setValidation } = config;

  const key = getKey(config);

  const validation = validateFormValue(value, validators);
  setValidation(validation);


  if (!isNil(type?.parseFormInput)) {
    value = type.parseFormInput(value);
  }

  if (value !== formValue) {
    onChange({key: key, value: value, isValid: isValid(validation) });
    setFormValue(value);
  }
};

const errorMessages = (validation) => {
  return !isValid(validation) && div({ className: `error-message fadein`}, [
    span({ className: 'glyphicon glyphicon-play' }),
    ...validation.failed.map((err) => div([validationMessage(err)])),
  ]);
};

//---------------------------------------------
// Form Controls
//---------------------------------------------
export const FormInputGeneric = (config) => {
  const {
    id, title, disabled,
    placeholder, type,
    inputStyle, ariaDescribedby,
    readOnly,
    formValue, validation, setValidation
  } = config;

  return div([
    input({
      id,
      type: type?.inputType || 'text',
      className: `form-control ${!isValid(validation) ? 'errored' : ''}`,
      placeholder: placeholder || title,
      value: formValue.toString(),
      readOnly: readOnly,
      style: { ...styles.inputStyle, ...inputStyle },
      disabled: disabled,
      onChange: (event) => {
        onFormInputChange(config, event.target.value);
      },
      onFocus: () => setValidation({ valid: true }),
      onBlur: (event) => updateValidation(config, event.target.value),
      'aria-describedby': ariaDescribedby,
    }),
    errorMessages(validation)
  ]);
};

export const FormInputTextarea = (config) => {
  const {
    id, title, type, disabled,
    placeholder,
    inputStyle, ariaDescribedby,
    rows, maxLength,
    formValue, validation, setValidation
  } = config;

  return div([
    textarea({
      id,
      type: type || 'text',
      className: `form-control ${!isValid(validation) ? 'errored' : ''}`,
      placeholder: placeholder || title,
      value: formValue,
      style: { ...styles.inputStyle, ...inputStyle },
      disabled: disabled,
      onChange: (event) => onFormInputChange(config, event.target.value),
      onFocus: () => setValidation({ valid: true }),
      onBlur: (event) => updateValidation(config, event.target.value),
      'aria-describedby': ariaDescribedby,
      rows,
      maxLength
    }),
    errorMessages(validation)
  ]);
};

export const FormInputMultiText = (config) => {
  const {
    id, title, disabled,
    placeholder, ariaDescribedby, validators,
    inputStyle, formValue, validation,
    setValidation
  } = config;

  // validation of the user's input as they are typing it,
  // separate from validation of the actual saved values
  // (which is the top level validation).
  const [inputValidation, setInputValidation] = useState({});

  const pushValue = (element) => {
    const value = element.value.trim();

    if (!value) {
      return;
    }

    const inputValidation = validateFormValue(value, validators);
    setInputValidation(inputValidation);
    if (!isValid(inputValidation)) {
      return;
    }

    if (formValue.indexOf(value) !== -1) {
      element.value = '';
      return;
    }

    const formValueClone = cloneDeep(formValue);
    formValueClone.push(value);
    onFormInputChange(config, formValueClone);
    element.value = '';
  };

  const removePill = (index) => {
    const formValueClone = cloneDeep(formValue);
    formValueClone.splice(index, 1);
    onFormInputChange(config, formValueClone);
  };

  return div({}, [
    div({
      className: 'formControl-group flex-row'
    }, [
      input({
        id,
        type: 'text',
        className: `form-control ${!isValid(validation) || !isValid(inputValidation) ? 'errored' : ''}`,
        placeholder: placeholder || title,
        style: { ...styles.inputStyle, ...inputStyle },
        disabled,
        'aria-describedby': ariaDescribedby,
        onKeyUp: (event) => event.code === 'Enter' ? pushValue(event.target) : setValidation({ valid: true }),
        onFocus: () => setValidation({ valid: true })
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
    errorMessages(inputValidation),
    errorMessages(validation),
    div({ className: 'flex-row', style: { justifyContent: 'flex-start' } },
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


const normalizeSelectOptions = (options, optionsAreString) => {
  // normalized options empty if async
  const normalizedOptions = options &&
    optionsAreString
    ? options.map((option) => { return {key: option, displayText: option }; })
    : options;

  return normalizedOptions;
};

// ensure form value is a valid select object
const normalizeSelectFormValue = (value) => {
  if (isString(value)) {
    return {
      key: value,
      displayText: value,
    };
  }

  if (isArray(value) && value.length > 0 && isString(value[0])) {
    return value.map((val) => {return {key: val, displayText: val};});
  }

  return value;
};

// Using react-select/creatable - Passing config directly through!
export const FormInputSelect = (config) => {
  const {
    id, title, disabled, required, validation, setValidation,
    selectOptions, placeholder, ariaDescribedby,
    formValue, isCreatable = false, isMulti = false,
    isAsync = false, setFormValue,
    exclusiveValues, loadOptions,
    selectConfig = {}
  } = config;

  const component =
    (isCreatable
      ? (isAsync ? AsyncCreatable : Creatable)
      : (isAsync ? AsyncSelect : Select));

  // must be specified if async, since we can't guess the
  // array type until after querying.
  const optionsAreString = config.optionsAreString || (!isNil(selectOptions) && isString(selectOptions[0]));
  const normalizedOptions = (!isNil(selectOptions) ? normalizeSelectOptions(selectOptions, optionsAreString) : undefined);

  return h(component, {
    key: id,
    id,
    isClearable: true, //ensures that selections can be cleared from dropdown, adds an 'x' within input box
    isMulti,
    required,
    isDisabled: disabled,
    placeholder: placeholder || `Search for ${title}...`,
    className: `form-select ${!isValid(validation) ? 'errored' : ''}`,
    onChange: (selected) => {
      if (isMulti && selected.length > 0 && !isNil(exclusiveValues)) {
        const newSelection = selected[selected.length - 1];

        if (exclusiveValues.includes(newSelection.displayText)) {
          selected.splice(0, selected.length - 1);
        } else if (exclusiveValues.includes(selected[0].displayText)) {
          selected.splice(0, 1);
        }
      }

      if (optionsAreString) {
        if (isMulti) {
          // string result, multiple options
          onFormInputChange(config, selected?.map((o) => o.displayText));
          setFormValue(selected);
          return;
        }
        // string result, only one option
        onFormInputChange(config, selected?.displayText);
        setFormValue(selected);
        return;
      }
      else {
        // object result
        onFormInputChange(config, selected);
      }
    },
    onMenuOpen: () => setValidation({ valid: true }),
    onMenuClose: () => {
      if (required && !formValue) {
        setValidation(FormValidators.REQUIRED.msg);
      }
    },
    getOptionLabel: (option) => option.displayText,
    getNewOptionData: (inputValue) => {
      return { key: inputValue, displayText: inputValue };
    },
    getOptionValue: (option) => { //value formatter for options, attr used to ensure empty strings are treated as undefined
      if(isNil(option) || isEmpty(option.displayText)) {
        return null;
      }
      return optionsAreString ? option.displayText : option;
    },
    options: normalizedOptions,
    loadOptions: (query, callback) => {
      loadOptions(query, (options) => {
        callback(normalizeSelectOptions(options, optionsAreString));
      });
    },
    value: normalizeSelectFormValue(formValue),
    ...selectConfig,
    'aria-describedby': ariaDescribedby
  }) ;
};

export const FormInputRadioGroup = (config) => {
  const {
    id, disabled,
    orientation = 'vertical', // [vertical, horizontal],
    formValue, options
  } = config;

  return div({},
    [
      div(
        {
          className: `radio-group ${orientation}`,
          id: id,
        },
        options.map(((option, idx) => {
          const optionId = (!isNil(option.id) ? option.id : option.name);

          return div({
            key: idx,
            className: 'radio-button-container',
          }, [
            h(RadioButton, {
              id: `${id}_${optionId}`,
              name: `${id}_${optionId}`,
              key: idx,
              defaultChecked: !isNil(formValue) && formValue === option.name,
              onClick: () => {
                onFormInputChange(config, option.name);
              },
              style: {
                fontFamily: 'Montserrat',
                fontSize: '14px',
              },
              description: option.text,
              disabled,
            }),
          ]);
        }))
      )
    ]
  );
};

export const FormInputYesNoRadioGroup = (config) => {
  const {
    id, disabled,
    orientation = 'vertical', // [vertical, horizontal],
    formValue
  } = config;

  return div({},
    [
      div(
        {
          className: `radio-group ${orientation}`,
          id: id,
        },
        [
          div({
            className: 'radio-button-container',
          }, [
            h(RadioButton, {
              id: `${id}_yes`,
              name: `${id}_yes`,
              defaultChecked: !isNil(formValue) && formValue === true,
              onClick: () => {
                onFormInputChange(config, true);
              },
              style: {
                fontFamily: 'Montserrat',
                fontSize: '14px',
              },
              description: 'Yes',
              disabled,
            }),
          ]),
          div({
            className: 'radio-button-container',
          }, [
            h(RadioButton, {
              id: `${id}_no`,
              name: `${id}_no`,
              defaultChecked: !isNil(formValue) && formValue === false,
              onClick: () => {
                onFormInputChange(config, false);
              },
              style: {
                fontFamily: 'Montserrat',
                fontSize: '14px',
              },
              description: 'No',
              disabled,
            }),
          ])
        ])
    ]);
};

export const FormInputRadioButton = (config) => {
  const {
    id, disabled, value, toggleText,
    formValue,
  } = config;

  return div({
    className: 'radio-button-container',
  }, [
    h(RadioButton, {
      id: id,
      name: id,
      defaultChecked: !isNil(formValue) && formValue === value,
      onClick: () => {
        onFormInputChange(config, value);
      },
      style: {
        fontFamily: 'Montserrat',
        fontSize: '14px',
      },
      description: toggleText,
      disabled,
    }),
  ]);
};

export const FormInputCheckbox = (config) => {
  const {
    id, disabled, validation, toggleText,
    formValue, ariaDescribedby
  } = config;

  return div({ className: 'checkbox' }, [
    input({
      type: 'checkbox',
      id: `${id}`,
      checked: formValue,
      className: 'checkbox-inline',
      'aria-describedby': ariaDescribedby,
      onChange: (event) => onFormInputChange(config, event.target.checked),
      disabled
    }),
    label({
      className: `regular-checkbox ${!isValid(validation) ? 'errored' : ''}`,
      htmlFor: `${id}`,
    }, [toggleText])
  ]);
};

export const FormInputSlider = (config) => {
  const {
    id, disabled, toggleText, formValue
  } = config;

  return div({ className: 'flex-row', style: { justifyContent: 'unset' } }, [
    label({ className: 'switch', htmlFor: `${id}` }, [
      input({
        type: 'checkbox',
        id: `${id}`,
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

export const FormInputFile = (config) => {
  const {
    id,
    formValue,
    uploadText = 'Upload a file',
    multiple = false,
    accept = '',
  } = config;

  return div({
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }
  }, [
    div({
      className: 'form-file-upload',
    }, [
      input({
        id,
        type: 'file',
        multiple,
        accept,
        // make hidden:
        style: {
          display: 'none',
        },
        onChange: (e) => {
          e.preventDefault();
          if (multiple) {
            onFormInputChange(config, e.target.files);
          } else {
            onFormInputChange(config, e.target.files[0]);
          }
        },
      }, [

      ]),
      label({
        htmlFor: `${id}`,
        className: 'form-file-label',
      }, [
        h(PublishIcon, {}),
        uploadText,
      ])
    ]),
    div({
      style: {
        marginLeft: '20px',
        width: '450px',
      }
    }, [
      h(FormField, {
        id: `${id}_fileName`,
        placeholder: 'Filename.txt',
        defaultValue: formValue?.name,
        readOnly: true,
      })
    ])
  ]);
};

