import { h, div, label, input, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, uniq } from 'lodash/fp';
import { SearchSelectOrText } from '../SearchSelectOrText';
import './ds_common.css';

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
const validateFormInput = (config, value) => {
  const {
    id, errors, setErrors,
    required, isValid
  } = config;

  const requiredValid = !required || (required && value);
  const customValid = !isValid || isValid(value);
  const isValidInput = requiredValid && customValid;
  const errorsClone = cloneDeep(errors);

  if (isValidInput) {
    delete errorsClone[id];
    setErrors(errorsClone);
  } else {
    errorsClone[id] = true;
    setErrors(errorsClone);
  }

  return isValidInput;
};

const normalizeValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  } else if (Array.isArray(value)) {
    return value.map(x => normalizeValue(x));
  }
  console.log('in normalize value, got here', value)
  return value;
};

const onFormInputChange = (config, value) => {
  const { id, onChange } = config;
  const normalizedValue = normalizeValue(value);
  console.log('normalizedValue', normalizedValue)

  const isValidInput = validateFormInput(config, normalizedValue);

  if (isValidInput) {
    onChange({key: id, value: normalizedValue});
  }
};

//---------------------------------------------
// Form Controls
//---------------------------------------------
const formInput = (config) => {
  switch (config.type) {
    case 'select': return formInputSelect(config);
    case 'multitext': return formInputMultiText(config);
    case 'checkbox': return formInputCheckbox(config);
    case 'slider': return formInputSlider(config);
    case 'text':
    default:
      return formInputText(config);
  }
};

const formInputText = (config) => {
  const {
    formInfo, id, title, type, disabled,
    placeholder, defaultValue,
    inputStyle, errors
  } = config;

  return input({
    id: id,
    type: type || 'text',
    className: `form-control ${errors[id] ? 'errored' : ''}`,
    placeholder: placeholder || title,
    defaultValue: formInfo[id] || defaultValue || '',
    style: { ...styles.inputStyle, ...inputStyle },
    disabled: disabled,
    onChange: (event) => onFormInputChange(config, event.target.value),
    onBlur: (event) => validateFormInput(config, event.target.value)
  });
};

const formInputMultiText = (config) => {
  const {
    formInfo, setFormInfo,
    id, title, type, disabled,
    placeholder,
    inputStyle, errors
  } = config;

  const pushValue = (event) => {
    const value = event.target.value.trim();
    const formInfoClone = cloneDeep(formInfo);

    if (!value) {
      return;
    }

    if (!validateFormInput(config, value)) {
      return;
    }

    if (!formInfoClone[id]) {
      formInfoClone[id] = [];
    }

    formInfoClone[id].push(value);
    formInfoClone[id] = uniq(formInfoClone[id]);
    event.target.value = '';
    setFormInfo(formInfoClone);
  };

  const removePill = (index) => {
    const formInfoClone = cloneDeep(formInfo);
    formInfoClone[id].splice(index, 1);
    setFormInfo(formInfoClone);
  };

  return div({}, [
    input({
      id,
      type: type || 'text',
      className: `form-control ${errors[id] ? 'errored' : ''}`,
      placeholder: placeholder || title,
      defaultValue: '',
      style: { ...styles.inputStyle, ...inputStyle },
      disabled,
      onKeyUp: (event) => {
        if (event.code === 'Enter') {
          pushValue(event);
        }
      },
      onBlur: (event) => pushValue(event)
    }),
    div({ style: { ...styles.flexRow, justifyContent: null } },
      formInfo[id]?.map((val, i) => {
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
    id, title, disabled, errors,
    selectOptions, searchPlaceholder
  } = config;

  return h(SearchSelectOrText, {
    id,
    onPresetSelection: async (selection) => onFormInputChange(config, selection),
    onManualSelection: (selection) => onFormInputChange(config, selection),
    options: selectOptions.map((x) => { return { key: x, displayText: x }; }),
    searchPlaceholder: searchPlaceholder || `Search for ${title}...`,
    className: 'form-control',
    disabled, errored: errors[id]
  });
};

const formInputCheckbox = (config) => {
  const {
    id, disabled, errors, toggleText,
    formInfo
  } = config;

  return div({ className: 'checkbox' }, [
    input({
      type: 'checkbox',
      id: `cb_${id}_${toggleText}`,
      checked: formInfo[id],
      className: 'checkbox-inline',
      onChange: (val) => onFormInputChange(config, val),
      disabled
    }),
    label({
      className: `regular-checkbox ${errors[id] ? 'errored' : ''}`,
      for: `cb_${id}_${toggleText}`,
      style: {
        fontWeight: 'normal',
        fontStyle: 'italic'
      }
    }, [toggleText])
  ]);
};

const formInputSlider = (config) => {
  const {
    id, disabled, toggleText,
    formInfo
  } = config;

  return div({ style: { ...styles.flexRow, justifyContent: 'unset', alignItems: 'center' } }, [
    label({ className: 'switch', for: `cb_${id}_${toggleText}` }, [
      input({
        type: 'checkbox',
        id: `cb_${id}_${toggleText}`,
        checked: formInfo[id],
        className: 'checkbox-inline',
        onChange: (val) => onFormInputChange(config, val),
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
// Main Component
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
*/
export const formField = (config) => {
  const {
    id, title, description,
    required, style, errors
  } = config;

  return div({ key: `formControl_${id}`, style: style, className: 'formField-container' }, [
    label({
      id: `lbl_${id}`,
      className: `control-label ${errors[id] ? 'errored' : ''}`,
      htmlFor: id
    }, [
      title,
      required && '*'
    ]),
    description && div({ style: { marginBottom: 15 } }, [description]),
    formInput(config)
  ]);
};


