import { h, div, label, input, span, button } from 'react-hyperscript-helpers';
import { cloneDeep, get, set } from 'lodash/fp';
import { SearchSelectOrText } from '../SearchSelectOrText';
import { Theme } from '../../libs/theme';
import './ds_common.css';

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
const validateFormInput = (config, value) => {
  const {
    id, errors, setErrors,
    required, isValid
  } = config;

  const valueExists = value !== undefined && value !== null && value !== '';
  const requiredValid = !required || (required && valueExists);
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
    return value
      .map(x => normalizeValue(x))
      .filter(x => x); // filter out null strings
  }
  return value;
};

const onFormInputChange = (config, value) => {
  const { id, onChange, formInfo, setFormInfo, path } = config;
  const normalizedValue = normalizeValue(value);
  const isValidInput = validateFormInput(config, normalizedValue);

  if (isValidInput) {
    onChange({key: path || id, value: normalizedValue});
    const formInfoClone = cloneDeep(formInfo);
    const updatedFormInfo = set((path || id), normalizedValue, formInfoClone);
    setFormInfo(updatedFormInfo);
  }
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
    formInfo, id, title, type, disabled,
    placeholder, defaultValue,
    inputStyle, errors, ariaDescribedby
  } = config;

  return input({
    id: id,
    type: type || 'text',
    className: `form-control ${errors[id] ? 'errored' : ''}`,
    placeholder: placeholder || title,
    defaultValue: get(id, formInfo) || defaultValue || '',
    style: { ...styles.inputStyle, ...inputStyle },
    disabled: disabled,
    onChange: (event) => onFormInputChange(config, event.target.value),
    onBlur: (event) => validateFormInput(config, event.target.value),
    'aria-describedby': ariaDescribedby,
  });
};

const formInputMultiText = (config) => {
  const {
    formInfo, setFormInfo,
    id, title, defaultValue, disabled,
    placeholder, ariaDescribedby,
    inputStyle, errors, onChange
  } = config;

  const pushValue = (event) => {
    const value = event.target.value.trim();
    const formInfoClone = cloneDeep(formInfo);

    if (!value || !validateFormInput(config, value)) {
      return;
    }
    if (formInfoClone[id].indexOf(value) !== -1) {
      event.target.value = '';
      return;
    }

    formInfoClone[id].push(value);
    event.target.value = '';
    setFormInfo(formInfoClone);
    onChange({key: id, value: formInfoClone[id]});
  };

  const removePill = (index) => {
    const formInfoClone = cloneDeep(formInfo);
    formInfoClone[id].splice(index, 1);
    setFormInfo(formInfoClone);
    onChange({key: id, value: formInfoClone[id]});
  };

  return div({}, [
    input({
      id,
      type: 'text',
      className: `form-control ${errors[id] ? 'errored' : ''}`,
      placeholder: placeholder || title,
      defaultValue: defaultValue || '',
      style: { ...styles.inputStyle, ...inputStyle },
      disabled,
      'aria-describedby': ariaDescribedby,
      onKeyUp: (event) => {
        if (event.code === 'Enter') {
          pushValue(event);
        }
      },
      onBlur: (event) => pushValue(event)
    }),
    div({ style: { ...styles.flexRow, justifyContent: null } },
      get(id, formInfo)?.map((val, i) => {
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
    disabled, errored: errors[id]
  });
};

const formInputCheckbox = (config) => {
  const {
    id, disabled, errors, toggleText,
    formInfo, defaultValue, ariaDescribedby
  } = config;

  return div({ className: 'checkbox' }, [
    input({
      type: 'checkbox',
      id: `cb_${id}_${toggleText}`,
      checked: get(id, formInfo) === undefined ? defaultValue : get(id, formInfo),
      className: 'checkbox-inline',
      'aria-describedby': ariaDescribedby,
      onChange: (event) => onFormInputChange(config, event.target.checked),
      disabled
    }),
    label({
      className: `regular-checkbox ${errors[id] ? 'errored' : ''}`,
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
    id, disabled, toggleText, defaultValue,
    formInfo
  } = config;

  return div({ style: { ...styles.flexRow, justifyContent: 'unset', alignItems: 'center' } }, [
    label({ className: 'switch', htmlFor: `cb_${id}_${toggleText}` }, [
      input({
        type: 'checkbox',
        id: `cb_${id}_${toggleText}`,
        checked: get(id, formInfo) === undefined ? defaultValue : get(id, formInfo),
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
* errors, setErrors,
* formInfo, setFormInfo
*/
export const FormField = (config) => {
  const {
    id, title, hideTitle, description,
    required, style, errors
  } = config;

  return div({
    key: `formControl_${id}`,
    style,
    className: `formField-container formField-${id}`
  }, [
    title && !hideTitle && label({
      id: `lbl_${id}`,
      className: `control-label ${errors[id] ? 'errored' : ''}`,
      htmlFor: `${id}`
    }, [
      title,
      required && '*'
    ]),
    description && div({ style: { marginBottom: 15 } }, [description]),
    formInput(config)
  ]);
};

/*
* Config options:
* id
* formFields: array[FormField Configs]
* onChange, errors, setErrors, formInfo, setFormInfo
*/
export const FormTable = (config) => {
  const {
    id, formFields,
    onChange, errors, setErrors, formInfo, setFormInfo
  } = config;

  return div({ id, className: `formTable` }, [
    // generate columns
    div({ className: 'formTable-row' }, formFields.map(x => {
      return label({ className: 'control-label', id: `${id}-${x.title}` }, [x.title]);
    })),
    // generate form rows
    get(id, formInfo).map((formRow, i) => {
      return div({ className: 'formTable-row', key: `formtable-${id}-${i}` }, formFields.map(formCol => {
        return FormField({
          ...formCol,
          id: `${id}-${i}-${formCol.id}`,
          path: `${id}.${i}.${formCol.id}`,
          hideTitle: true, ariaDescribedby: `${id}-${formCol.title}`,
          onChange, errors, setErrors, formInfo, setFormInfo
        });
      }));
    }),
    // add new row to table button
    div({ style: { display: 'flex', width: '100%', justifyContent: 'flex-end' } }, [
      h(button, {
        key: 'add-new-filetype',
        className: 'pill btn-xs',
        style: {
          backgroundColor: Theme.palette.secondary,
          borderRadius: 0,
          marginRight: 0
        },
        type: 'button',
        onClick: () => {
          const formInfoClone = cloneDeep(formInfo);
          formInfoClone.fileTypes.push({});
          setFormInfo(formInfoClone);
        }
      }, [
        'Add New Filetype',
        span({ className: 'glyphicon glyphicon-plus', style: { marginLeft: '8px' } })
      ])
    ])
  ]);
};

