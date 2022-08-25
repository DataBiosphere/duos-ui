import { h, div, label, input, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, isNil, isEmpty, isString } from 'lodash/fp';
import Creatable from 'react-select/creatable';
import { FormValidators } from './forms';
import { SearchSelect } from '../SearchSelect';

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

export const formInputSelect = (config) => {
  const {
    id, title, disabled, error, setError,
    selectOptions, searchPlaceholder, ariaDescribedby,
    creatableConfig
  } = config;

  return creatableConfig
    ? formInputCreatable(config)
    : div({}, [
      h(SearchSelect, {
        id,
        'aria-describedby': ariaDescribedby,
        onSelection: async (selection) => onFormInputChange(config, selection),
        onOpen: () => setError(),
        options: selectOptions.map((x) => {
          if (isString(x)) {
            return { key: x, displayText: x };
          }
          return x;
        }),
        searchPlaceholder: searchPlaceholder || `Search for ${title}...`,
        className: 'form-control',
        disabled, errored: error
      }),
    ]);
};

// Using react-select/creatable - Passing config directly through!
export const formInputCreatable = (config) => {
  const {
    id, title, disabled, required, error, setError,
    selectOptions = [], searchPlaceholder, ariaDescribedby,
    formValue, setFormValue,
    creatableConfig = {}
  } = config;

  const isStringArr = isString(selectOptions[0]);
  const normalizedOptions = isStringArr
    ? selectOptions.map((option) => { return {key: option, displayValue: option }; })
    : selectOptions;

  return h(Creatable, {
    key: id,
    isClearable: true, //ensures that selections can be cleared from dropdown, adds an 'x' within input box
    required,
    isDisabled: disabled,
    placeholder: searchPlaceholder || `Search for ${title}...`,
    className: `form-select ${error ? 'errored' : ''}`,
    onChange: (option) => {
      const inputChange = isStringArr ? option.displayValue : option;
      onFormInputChange(config, inputChange);
      setFormValue(option);
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
    ...creatableConfig,
    'aria-describedby': ariaDescribedby
  });
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

