import { h, div, label, input, span, button } from 'react-hyperscript-helpers';

import { cloneDeep, isNil, isEmpty, isString } from 'lodash/fp';
import Creatable from 'react-select/creatable';
import Select from 'react-select';
import { FormValidators } from './forms';
import {RadioButton} from '../RadioButton';

import './formComponents.css';

const styles = {
  inputStyle: {
    padding: '25px 15px',
    width: '100%'
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
export const formInputGeneric = (config) => {
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

export const formInputMultiText = (config) => {
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
      className: 'formControl-group flex-row'
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

// Using react-select/creatable - Passing config directly through!
export const formInputSelect = (config) => {
  const {
    id, title, disabled, required, error, setError,
    selectOptions, placeholder, ariaDescribedby,
    formValue, isCreatable, isMulti, setFormValue,
    selectConfig = {}
  } = config;

  const component = (isCreatable ? Creatable : Select);

  const isStringArr = isString(selectOptions[0]);
  const normalizedOptions = isStringArr
    ? selectOptions.map((option) => { return {key: option, displayValue: option }; })
    : selectOptions;

  return h(component, {
    key: id,
    id,
    isClearable: true, //ensures that selections can be cleared from dropdown, adds an 'x' within input box
    isMulti,
    required,
    isDisabled: disabled,
    placeholder: placeholder || `Search for ${title}...`,
    className: `form-select ${error ? 'errored' : ''}`,
    onChange: (option) => {
      if (isStringArr) {
        if (isMulti) {
          // string result, multiple options
          onFormInputChange(config, option?.map((o) => o.displayValue));
          setFormValue(option);
          return;
        }
        // string result, only one option
        onFormInputChange(config, option?.displayValue);
        setFormValue(option);
        return;
      }
      // object result
      onFormInputChange(config, option);
    },
    onMenuOpen: () => setError(),
    onMenuClose: () => {
      if (required && !formValue) {
        setError(FormValidators.REQUIRED.msg);
      }
    },
    options: normalizedOptions,
    getOptionLabel: (option) => option.displayValue,
    getNewOptionData: (inputValue) => {
      return { key: inputValue, displayValue: inputValue };
    },
    getOptionValue: (option) => { //value formatter for options, attr used to ensure empty strings are treated as undefined
      if(isNil(option) || isEmpty(option.displayValue)) {
        return null;
      }
      return isStringArr ? option.displayValue : option;
    },
    value: formValue,
    ...selectConfig,
    'aria-describedby': ariaDescribedby
  }) ;
};

export const formInputRadioGroup = (config) => {
  /* options example:
    [
      {
        name: 'open_access',
        text: 'Open Access'
      },
      {
        id: 'closed_access', // can specify id, uses name as id otherwise
        name: 'closed_access',
        text: 'Closed Access',
      },
      {
        name: 'other',
        text: 'Other',
        type: 'string',
        placeholder: 'Please specify.',
      }
    ]
    if type is 'string', then a textbox is rendered
    when checked.
  */

  const {
    id, disabled, error,
    formValue, options, ariaDescribedby,
    setError
  } = config;

  return div({},
    [
      div(
        {
          className: 'radio-group',
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
              defaultChecked: !isNil(formValue) && formValue.selected === option.name,
              onClick: () => {
                if (option.type === 'string') {
                  onFormInputChange(config, {
                    selected: option.name,
                    value: '',
                  });
                  return;
                }

                onFormInputChange(config, { selected: option.name });
              },
              style: {
                fontFamily: 'Montserrat',
                fontSize: '14px',
              },
              description: option.text,
              disabled,
            }),
            input({
              isRendered: option.type === 'string' && formValue.selected === option.name,
              id: `${id}_${optionId}_text_input`,
              type: 'text',
              className: `form-control ${error ? 'errored' : ''}`,
              placeholder: option.placeholder,
              value: formValue.value,
              style: {
                ...styles.inputStyle,
                ...{
                  marginTop: '0.5rem',
                }
              },
              disabled: disabled,
              onChange: (event) => onFormInputChange(config, {
                selected: option.name,
                value: event.target.value,
              }),
              onFocus: () => setError(),
              onBlur: (event) => validateFormInput(config, event.target.value),
              'aria-describedby': ariaDescribedby,
            }),
          ]);
        }))
      )
    ]
  );
};

export const formInputCheckbox = (config) => {
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

export const formInputSlider = (config) => {
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

