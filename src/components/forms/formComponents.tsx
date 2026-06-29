import PublishIcon from '@mui/icons-material/Publish'
import 'src/components/forms/formComponents.css'
import { cloneDeep, isArray, isEmpty, isNil, isString } from 'src/utils/NodashUtil'
import React, { useState } from 'react'
import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import AsyncCreatable from 'react-select/async-creatable'
import Creatable from 'react-select/creatable'
import { DuosDatePicker } from 'src/components/DuosDatePicker'
import { RadioButton } from 'src/components/RadioButton'
import { FormField } from 'src/components/forms/forms'
import { getKey } from 'src/components/forms/formUtils'
import { isValid, validateFormValue, validationMessage } from 'src/components/forms/formValidation'

export interface Validation {
  valid?: boolean
  failed?: string[]
}

export interface Validator {
  id: string
  isValid: (value: unknown, ...extra: unknown[]) => boolean | Promise<boolean>
  readonly msg: string
}

export interface SelectOption {
  key: string
  displayText: string
  [key: string]: unknown
}

export interface RadioOption {
  id?: string
  name: string
  text: string
  [key: string]: unknown
}

export interface FormType {
  inputType?: string
  parseFormInput?: (value: string, prevValue?: unknown) => unknown
  defaultValue?: unknown
  component?: React.ComponentType<BaseFormComponentConfig>
  requiredProps?: string[]
  optionalProps?: string[]
  customPropValidation?: (props: Record<string, unknown>) => void
}

// Shared props consumed by the internal helpers (onFormInputChange, updateValidation).
// All per-component interfaces extend this.
export interface BaseFormComponentConfig {
  id: string
  name?: string | null
  type?: FormType
  validators?: Validator[]
  onChange?: (arg: { key: string, value: unknown, isValid: boolean }) => void
  formValue: unknown
  setFormValue: (v: unknown) => void
  setValidation: (v: Validation) => void
  validation?: Validation
  disabled?: boolean
}

export interface FormInputGenericConfig extends BaseFormComponentConfig {
  title?: string
  placeholder?: string
  inputStyle?: React.CSSProperties
  ariaDescribedby?: string
  readOnly?: boolean
}

export interface FormInputTextareaConfig extends BaseFormComponentConfig {
  title?: string
  placeholder?: string
  inputStyle?: React.CSSProperties
  ariaDescribedby?: string
  rows?: number
  maxLength?: number
}

export interface FormInputMultiTextConfig extends BaseFormComponentConfig {
  title?: string
  placeholder?: string
  ariaDescribedby?: string
  inputStyle?: React.CSSProperties
}

export interface FormInputSelectConfig extends BaseFormComponentConfig {
  title?: string
  placeholder?: string
  ariaDescribedby?: string
  selectOptions?: Array<SelectOption | string>
  isMulti?: boolean
  isClearable?: boolean
  isCreatable?: boolean
  isAsync?: boolean
  exclusiveValues?: string[]
  loadOptions?: (query: string, callback: (options: SelectOption[]) => void) => void
  selectConfig?: Record<string, unknown>
  optionsAreString?: boolean
}

export interface FormInputRadioGroupConfig extends BaseFormComponentConfig {
  orientation?: 'vertical' | 'horizontal'
  options?: RadioOption[]
}

export interface FormInputYesNoRadioGroupConfig extends BaseFormComponentConfig {
  orientation?: 'vertical' | 'horizontal'
}

export interface FormInputRadioButtonConfig extends BaseFormComponentConfig {
  value?: unknown
  toggleText?: string
}

export interface FormInputCheckboxConfig extends BaseFormComponentConfig {
  toggleText?: string
  ariaDescribedby?: string
}

export interface FormInputSliderConfig extends BaseFormComponentConfig {
  toggleText?: string
}

export interface FormInputFileConfig extends BaseFormComponentConfig {
  placeholder?: string
  uploadText?: string
  hideTextBar?: boolean
  hideInput?: boolean
  multiple?: boolean
  accept?: string
}

export interface FormDatePickerConfig extends BaseFormComponentConfig {
  readOnly?: boolean
}

// validateFormValue is a JS function typed via JSDoc as (formValue: object, ...).
// This wrapper widens the parameter to unknown so callers can pass any value safely.
const runValidation = validateFormValue as (value: unknown, validators: Validator[] | undefined) => Validation

const styles = {
  inputStyle: {
    padding: '25px 15px',
    width: '100%',
  },
}

const updateValidation = (config: BaseFormComponentConfig, value: unknown): boolean => {
  const { setValidation, validators } = config
  const validation = runValidation(value, validators)
  setValidation(validation)
  return isValid(validation)
}

const onFormInputChange = (config: BaseFormComponentConfig, value: unknown): void => {
  const { type, onChange, formValue, setFormValue, validators, setValidation } = config
  const key = getKey(config)
  const validation = runValidation(value, validators)
  setValidation(validation)

  let processedValue = value
  if (!isNil(type?.parseFormInput)) {
    processedValue = type.parseFormInput(value as string)
  }

  if (processedValue !== formValue) {
    if (!isNil(onChange)) {
      onChange({ key, value: processedValue, isValid: isValid(validation) })
    }
    setFormValue(processedValue)
  }
}

const errorMessages = (validation: Validation | undefined): React.ReactNode => {
  if (isValid(validation)) return null
  return (
    <div className="error-message fadein">
      <span className="glyphicon glyphicon-play" />
      {validation?.failed?.map((err, idx) => (
        <div key={'error_message_' + idx}>{validationMessage(err)}</div>
      ))}
    </div>
  )
}

// ---------------------------------------------
// Form Controls
// ---------------------------------------------
export const FormInputGeneric = (config: FormInputGenericConfig): React.ReactElement => {
  const {
    id, name, title, disabled,
    placeholder, type,
    inputStyle, ariaDescribedby,
    readOnly,
    formValue, validation, setValidation,
  } = config

  return (
    <div>
      <input
        id={id}
        name={name ?? id}
        type={type?.inputType ?? 'text'}
        className={`form-control ${isValid(validation) ? '' : 'errored'}`}
        placeholder={placeholder ?? title}
        value={(formValue as string | number | undefined) ?? ''}
        readOnly={readOnly}
        style={{ ...styles.inputStyle, ...inputStyle }}
        disabled={disabled}
        onChange={event => onFormInputChange(config, event.target.value)}
        onFocus={() => setValidation({ valid: true })}
        onBlur={event => updateValidation(config, event.target.value)}
        aria-describedby={ariaDescribedby}
      />
      {errorMessages(validation)}
    </div>
  )
}

export const FormInputTextarea = (config: FormInputTextareaConfig): React.ReactElement => {
  const {
    id, name, title, disabled,
    placeholder,
    inputStyle, ariaDescribedby,
    rows, maxLength,
    formValue, validation, setValidation,
  } = config

  return (
    <div>
      <textarea
        id={id}
        name={name ?? id}
        className={`form-control ${isValid(validation) ? '' : 'errored'}`}
        placeholder={placeholder ?? title}
        value={formValue as string | undefined}
        style={{ ...styles.inputStyle, ...inputStyle }}
        disabled={disabled}
        onChange={event => onFormInputChange(config, event.target.value)}
        onFocus={() => setValidation({ valid: true })}
        onBlur={event => updateValidation(config, event.target.value)}
        aria-describedby={ariaDescribedby}
        rows={rows}
        maxLength={maxLength}
      />
      {errorMessages(validation)}
    </div>
  )
}

export const FormInputMultiText = (config: FormInputMultiTextConfig): React.ReactElement => {
  const {
    id, name, title, disabled,
    placeholder, ariaDescribedby, validators,
    inputStyle, formValue, validation,
    setValidation,
  } = config

  const [inputValidation, setInputValidation] = useState<Validation>({})

  const pushValue = (element: HTMLInputElement): void => {
    const value = element.value.trim()
    if (!value) return

    const inputVal = runValidation(value, validators)
    setInputValidation(inputVal)
    if (!isValid(inputVal)) return

    const formValueArray = cloneDeep(formValue) as string[]
    if (formValueArray.includes(value)) {
      element.value = ''
      return
    }

    formValueArray.push(value)
    onFormInputChange(config, formValueArray)
    element.value = ''
  }

  const removePill = (index: number): void => {
    const formValueClone = cloneDeep(formValue) as string[]
    formValueClone.splice(index, 1)
    onFormInputChange(config, formValueClone)
  }

  return (
    <div>
      <div className="formControl-group flex-row">
        <input
          id={id}
          name={name ?? id}
          type="text"
          className={`form-control ${isValid(validation) && isValid(inputValidation) ? '' : 'errored'}`}
          placeholder={placeholder ?? title}
          style={{ ...styles.inputStyle, ...inputStyle }}
          disabled={disabled}
          aria-describedby={ariaDescribedby}
          onKeyUp={(event) => {
            if (event.code === 'Enter') {
              pushValue(event.target as HTMLInputElement)
            }
            else {
              setValidation({ valid: true })
            }
          }}
          onFocus={() => setValidation({ valid: true })}
        />
        <button
          className="form-btn btn-xs"
          type="button"
          disabled={disabled}
          style={{ marginTop: 0, minWidth: 'fit-content' }}
          onClick={() => pushValue(document.getElementById(id) as HTMLInputElement)}
        >
          {!disabled && (
            <span
              className="glyphicon glyphicon-plus"
              aria-label="Add"
              style={{ margin: '0 8px' }}
            />
          )}
        </button>
      </div>
      {errorMessages(inputValidation)}
      {errorMessages(validation)}
      <div className="flex-row" style={{ justifyContent: 'flex-start' }}>
        {(formValue as string[]).map(val => (
          <button
            key={val}
            className="pill btn-xs"
            type="button"
            disabled={disabled}
            onClick={() => removePill((formValue as string[]).indexOf(val))}
          >
            {val}
            {!disabled && (
              <span
                className="glyphicon glyphicon-remove"
                style={{ marginLeft: '8px' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

const toSelectOptions = (options: string[]): SelectOption[] =>
  options.map(option => ({ key: option, displayText: option }))

const normalizeSelectOptions = (
  options: Array<SelectOption | string> | undefined,
  optionsAreString: boolean,
): SelectOption[] | undefined => {
  if (!options) return undefined
  return optionsAreString
    ? toSelectOptions(options as string[])
    : options as SelectOption[]
}

const normalizeSelectFormValue = (
  value: unknown,
): SelectOption | SelectOption[] | null | undefined => {
  if (isString(value)) {
    return { key: value, displayText: value }
  }
  if (isArray(value) && value.length > 0 && isString(value[0])) {
    return (value as string[]).map(val => ({ key: val, displayText: val }))
  }
  return value as SelectOption | SelectOption[] | null | undefined
}

const getSelectOptionValue = (option: SelectOption, optionsAreString: boolean): string => {
  if (isNil(option) || isEmpty(option.displayText)) return ''
  return optionsAreString ? option.displayText : option as unknown as string
}

export const FormInputSelect = (config: FormInputSelectConfig): React.ReactElement => {
  const {
    id, title, disabled, validation, setValidation,
    selectOptions, placeholder, ariaDescribedby,
    formValue, isCreatable = false, isMulti = false, isClearable = true,
    isAsync = false, setFormValue,
    exclusiveValues, loadOptions,
    selectConfig = {},
  } = config

  const optionsAreString = config.optionsAreString ?? (!isNil(selectOptions) && isString(selectOptions[0]))
  const normalizedOptions = isNil(selectOptions) ? undefined : normalizeSelectOptions(selectOptions, optionsAreString)
  const selectValue = normalizeSelectFormValue(formValue)

  const handleChange = (selected: unknown): void => {
    const selectedArr = selected as SelectOption[]
    if (isMulti && selectedArr.length > 0 && !isNil(exclusiveValues)) {
      const newSelection = selectedArr.at(-1)
      if (newSelection && exclusiveValues.includes(newSelection.displayText)) {
        selectedArr.splice(0, selectedArr.length - 1)
      }
      else if (exclusiveValues.includes(selectedArr[0].displayText)) {
        selectedArr.splice(0, 1)
      }
    }

    if (optionsAreString) {
      if (isMulti) {
        onFormInputChange(config, selectedArr?.map(o => o.displayText))
        setFormValue(selected)
        return
      }
      onFormInputChange(config, (selected as SelectOption)?.displayText)
      setFormValue(selected)
    }
    else {
      onFormInputChange(config, selected)
    }
  }

  const handleMenuClose = (): void => {
    if (!formValue) {
      setValidation({ valid: false, failed: ['required'] })
    }
  }

  const getNewOptionData = (inputValue: string): SelectOption => ({ key: inputValue, displayText: inputValue })

  const asyncLoadOptions = (query: string, callback: (options: SelectOption[]) => void): void => {
    loadOptions?.(query, (opts) => {
      callback(normalizeSelectOptions(opts, optionsAreString) ?? [])
    })
  }

  const commonProps = {
    ...selectConfig,
    id,
    isClearable,
    isMulti,
    isDisabled: disabled,
    placeholder: placeholder ?? `Search for ${title}...`,
    className: `form-select ${isValid(validation) ? '' : 'errored'}`,
    onChange: handleChange,
    onMenuOpen: () => setValidation({ valid: true }),
    getOptionLabel: (option: SelectOption) => option.displayText,
    getOptionValue: (option: SelectOption) => getSelectOptionValue(option, optionsAreString),
    options: normalizedOptions,
    value: selectValue,
  }

  if (isCreatable && isAsync) {
    return (
      <AsyncCreatable<SelectOption, boolean>
        {...commonProps}
        aria-describedby={ariaDescribedby}
        getNewOptionData={getNewOptionData}
        loadOptions={asyncLoadOptions}
        onMenuClose={handleMenuClose}
      />
    )
  }
  if (isCreatable) {
    return (
      <Creatable<SelectOption, boolean>
        {...commonProps}
        aria-describedby={ariaDescribedby}
        getNewOptionData={getNewOptionData}
        onMenuClose={handleMenuClose}
      />
    )
  }
  if (isAsync) {
    return (
      <AsyncSelect<SelectOption, boolean>
        {...commonProps}
        aria-describedby={ariaDescribedby}
        loadOptions={asyncLoadOptions}
        onMenuClose={handleMenuClose}
      />
    )
  }
  return (
    <Select<SelectOption, boolean>
      {...commonProps}
      aria-describedby={ariaDescribedby}
      onMenuClose={handleMenuClose}
    />
  )
}

export const FormInputRadioGroup = (config: FormInputRadioGroupConfig): React.ReactElement => {
  const {
    id, disabled,
    orientation = 'vertical',
    formValue, options, validation,
  } = config

  return (
    <div className={`radio-group ${orientation} ${isValid(validation) ? '' : 'errored'}`} id={id}>
      {(options ?? []).map((option) => {
        const optionId = option.id ?? option.name
        return (
          <div key={optionId} className="radio-button-container">
            <RadioButton
              id={`${id}_${optionId}`}
              name={`${id}_${optionId}`}
              defaultChecked={!isNil(formValue) && formValue === option.name}
              onClick={() => onFormInputChange(config, option.name)}
              style={{ fontFamily: 'Montserrat', fontSize: '14px' }}
              description={option.text}
              disabled={disabled}
            />
          </div>
        )
      })}
    </div>
  )
}

export const FormInputYesNoRadioGroup = (config: FormInputYesNoRadioGroupConfig): React.ReactElement => {
  const {
    id, disabled,
    orientation = 'vertical',
    formValue, validation,
  } = config

  return (
    <div>
      <div className={`radio-group ${orientation} ${isValid(validation) ? '' : 'errored'}`} id={id}>
        <div className="radio-button-container">
          <RadioButton
            id={`${id}_yes`}
            name={`${id}_yes`}
            defaultChecked={!isNil(formValue) && formValue === true}
            onClick={() => onFormInputChange(config, true)}
            style={{ fontFamily: 'Montserrat', fontSize: '14px' }}
            description="Yes"
            disabled={disabled}
          />
        </div>
        <div className="radio-button-container">
          <RadioButton
            id={`${id}_no`}
            name={`${id}_no`}
            defaultChecked={!isNil(formValue) && formValue === false}
            onClick={() => onFormInputChange(config, false)}
            style={{ fontFamily: 'Montserrat', fontSize: '14px' }}
            description="No"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

export const FormInputRadioButton = (config: FormInputRadioButtonConfig): React.ReactElement => {
  const {
    id, name, disabled, value, toggleText,
    formValue, validation,
  } = config

  return (
    <div className={`radio-button-container ${isValid(validation) ? '' : 'errored'}`}>
      <RadioButton
        id={id}
        name={name ?? id}
        defaultChecked={!isNil(formValue) && formValue === value}
        onClick={() => onFormInputChange(config, value)}
        style={{ fontFamily: 'Montserrat', fontSize: '14px' }}
        description={toggleText}
        disabled={disabled}
      />
    </div>
  )
}

export const FormInputCheckbox = (config: FormInputCheckboxConfig): React.ReactElement => {
  const {
    id, name, disabled, validation, toggleText,
    formValue, ariaDescribedby,
  } = config

  return (
    <div className="checkbox">
      <input
        type="checkbox"
        id={id}
        name={name ?? id}
        checked={formValue as boolean}
        className="checkbox-inline"
        aria-describedby={ariaDescribedby}
        onChange={event => onFormInputChange(config, event.target.checked)}
        disabled={disabled}
      />
      <label
        className={`regular-checkbox ${isValid(validation) ? '' : 'errored'}`}
        htmlFor={`${id}`}
        style={disabled ? { cursor: 'not-allowed' } : undefined}
      >
        {toggleText}
      </label>
    </div>
  )
}

export const FormInputSlider = (config: FormInputSliderConfig): React.ReactElement => {
  const {
    id, name, disabled, toggleText, formValue,
  } = config

  return (
    <div className="flex-row" style={{ justifyContent: 'unset' }}>
      <label className="switch" htmlFor={id}>
        <span className="sr-only">{toggleText ?? 'Toggle'}</span>
        <input
          type="checkbox"
          id={id}
          name={name ?? id}
          checked={formValue as boolean}
          className="checkbox-inline"
          onChange={event => onFormInputChange(config, event.target.checked)}
          disabled={disabled}
        />
        <div className="slider round" />
      </label>
      <div style={{ marginLeft: 15, fontStyle: 'italic' }}>
        {toggleText}
      </div>
    </div>
  )
}

export const FormInputFile = (config: FormInputFileConfig): React.ReactElement => {
  const {
    id,
    name,
    formValue,
    uploadText = 'Upload a file',
    hideTextBar = false,
    hideInput = false,
    multiple = false,
    placeholder = 'Filename.txt',
    accept = '',
    validation,
    disabled = false,
  } = config

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: '1rem', columnGap: '1rem' }}>
      {!hideInput && (
        <div className={`form-file-upload ${disabled ? 'disabled' : ''}`}>
          <input
            id={id}
            name={name ?? id}
            type="file"
            multiple={multiple}
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => {
              e.preventDefault()
              if (multiple) {
                onFormInputChange(config, e.target.files)
              }
              else {
                onFormInputChange(config, e.target.files?.[0])
              }
            }}
            disabled={disabled}
          />
          <label
            htmlFor={`${id}`}
            className={`form-file-label ${isValid(validation) ? '' : 'errored'}`}
            style={disabled ? { cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
          >
            <PublishIcon />
            {uploadText}
          </label>
        </div>
      )}
      {!hideTextBar && (
        <div style={{ flex: '1 1 28rem', width: '100%', maxWidth: '450px', minWidth: 0 }}>
          <FormField
            id={`${id}_fileName`}
            placeholder={placeholder}
            validation={validation}
            defaultValue={(formValue as File | undefined)?.name}
            readOnly={true}
          />
        </div>
      )}
    </div>
  )
}

export const FormDatePicker = (config: FormDatePickerConfig): React.ReactElement => {
  const { id, formValue, validation, readOnly, disabled } = config
  const stateClassNames = [
    disabled ? 'disabled' : '',
    readOnly ? 'readonly' : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={`form-calendar ${stateClassNames} ${isValid(validation) ? '' : 'errored'}`}>
      <DuosDatePicker
        id={id}
        onChange={(value) => { onFormInputChange(config, value) }}
        onError={(_error, value) => { updateValidation(config, value) }}
        defaultValue={formValue as Parameters<typeof DuosDatePicker>[0]['defaultValue']}
        inputFormat="YYYY-MM-DD"
        readOnly={readOnly ?? false}
        disabled={disabled}
      />
      {errorMessages(validation)}
    </div>
  )
}
