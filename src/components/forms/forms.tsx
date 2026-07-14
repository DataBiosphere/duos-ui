import React, { useState, useCallback } from 'react'
import { cloneDeep, isFunction, isNil, isArray } from 'src/utils/NodashUtil'
import {
  getKey,
  validateFormProps,
  customRadioPropValidation,
  customSelectPropValidation,
} from 'src/components/forms/formUtils'
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
  FormDatePicker,
} from 'src/components/forms/formComponents'

import 'src/components/forms/forms.css'
import {
  dateValidator,
  dayJSValidator,
  emailDomainValidator,
  emailValidator,
  fileTypeValidator,
  isValid,
  NotUrlValidator,
  requiredValidator,
  urlValidator,
} from 'src/components/forms/formValidation'

// Dynamic component dispatch — resolved at runtime from FormFieldTypeConfig,
// so prop types can't be known statically. React.ComponentType<any> is the standard escape hatch here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>

export interface Validation {
  valid?: boolean
  failed?: string[]
}

export interface Validator {
  id: string
  isValid: (value: unknown, ...extra: unknown[]) => boolean | Promise<boolean>
  readonly msg: string
}

export interface FormFieldChangeEvent {
  key: string
  value: unknown
  isValid: boolean
}

export interface FormValidationChangeEvent {
  key: string
  validation: Validation
}

interface FormFieldTypeConfig {
  defaultValue: unknown
  component: AnyComponent
  requiredProps?: string[]
  optionalProps?: string[]
  customPropValidation?: (props: Record<string, unknown>) => void
  inputType?: string
  parseFormInput?: (formInput: string, prevValue: unknown) => unknown
  requiredNormalSelectProps?: string[]
  requiredAsyncSelectProps?: string[]
}

interface FormFieldTitleProps {
  id?: string
  title?: React.ReactNode
  hideTitle?: boolean
  description?: React.ReactNode
  helpText?: React.ReactNode
  formId?: string
  ariaLevel?: number
  required?: boolean
  validation?: Validation
  titleStyle?: React.CSSProperties
  disabled?: boolean
}

export interface FormFieldConfig {
  id: string
  name?: string | null
  type?: FormFieldTypeConfig
  ariaLevel?: number
  title?: React.ReactNode
  hideTitle?: boolean
  description?: React.ReactNode
  helpText?: React.ReactNode
  defaultValue?: unknown
  style?: React.CSSProperties
  titleStyle?: React.CSSProperties
  validators?: Validator[]
  validation?: Validation
  // Callers pass field-specific value types (e.g. string, boolean, string[]).
  // Tightening to FormFieldChangeEvent / FormValidationChangeEvent would require updating
  // all callers; tracked separately. The exported types document the runtime shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValidationChange?(event: any): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?(event: any): void
  disabled?: boolean
  ariaDescribedby?: string
  [key: string]: unknown
}

interface StyleProps {
  enableAddingRowStyle?: React.CSSProperties
  addingRowButtonClassName?: string
  addRowButtonIconClassName?: string
  removeRowButtonIconClassName?: string
}

interface FormTableConfig {
  id: string
  name?: string | null
  formFields: FormFieldConfig[]
  enableAddingRow?: boolean
  addRowLabel?: string
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange(event: any): void
  minLength?: number
  validation?: Record<string, Validation>[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValidationChange?(event: any): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any[]
  styleProps?: StyleProps
}

// ----------------------------------------------------------------------------------------------------- //
// ======                                  MAIN FORM FIELD TYPES                                  ====== //
// ----------------------------------------------------------------------------------------------------- //
// eslint-disable-next-line react-refresh/only-export-components
export const FormFieldTypes: Record<string, FormFieldTypeConfig> = {
  MULTITEXT: {
    defaultValue: [],
    component: FormInputMultiText,
    requiredProps: [],
    optionalProps: [
      'placeholder',
      'inputStyle',
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
    parseFormInput: (formInput: string, prevValue: unknown): unknown => {
      if (formInput === '') {
        return 0
      }
      // if there is a value, try to parse it; if parsing fails, then the value should stay the same.
      const parsed = +formInput
      return Number.isNaN(parsed) ? prevValue : parsed
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
      'readOnly',
      'accept',
    ],
  },
  CHECKBOX: {
    defaultValue: false,
    component: FormInputCheckbox,
    requiredProps: [],
    optionalProps: [
      'toggleText',
    ],
  },
  SELECT: {
    defaultValue: (config: Record<string, unknown>) => (config?.isMulti ? [] : ''),
    component: FormInputSelect,
    requiredNormalSelectProps: [
      'selectOptions',
      // 'selectOptions' example:
      // [
      //  {displayText: 'Option 1'}
      //   ^^^ can pass other fields in as extra info, e.g.:
      //  {displayText: 'Dac 1', dacId: 213}
      // ]
      // can also be array of strings: ['Option 1', 'Option 2']
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
      'selectOptions',
      'isClearable',
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
    ],
  },
  CALENDAR: {
    defaultValue: null,
    component: FormDatePicker,
    requiredProps: [],
    optionalProps: ['readOnly'],
  },
}

// ----------------------------------------------------------------------------------------------------- //
// ======                                     FORM VALIDATORS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //
// eslint-disable-next-line react-refresh/only-export-components
export const FormValidators: Record<string, Validator> = {
  REQUIRED: requiredValidator,
  URL: urlValidator,
  NOTURL: NotUrlValidator,
  // isEmailAddress is typed (email: string) but validators receive unknown at runtime; cast at JS→TS boundary
  EMAIL: emailValidator as Validator,
  EMAILDOMAIN: emailDomainValidator as Validator,
  DATE: dateValidator,
  DATEJS: dayJSValidator,
  FILE_TYPE: fileTypeValidator,
}

// ----------------------------------------------------------------------------------------------------- //
// ======                                     MAIN COMPONENTS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //
export const FormFieldTitle = (props: FormFieldTitleProps): React.JSX.Element => {
  const {
    id,
    title,
    hideTitle,
    description,
    helpText,
    formId,
    ariaLevel,
    required,
    validation,
    titleStyle,
    disabled,
  } = props

  const labelId = id ?? (formId ? `lbl_${formId}` : undefined)

  return (
    <div>
      {title && !hideTitle
        && (
          <label
            id={labelId}
            className={`control-label ${isValid(validation) ? '' : 'errored'}`}
            style={titleStyle}
            htmlFor={formId}
            aria-level={ariaLevel}
            aria-disabled={disabled}
          >
            {title}
            {required && '*'}
          </label>
        )}
      {helpText && <span key={`help-text-span-${formId}`} style={{ fontStyle: 'italic', padding: 7 }}>{helpText}</span>}
      {description && <div key={`help-text-description-span-${formId}`} style={{ marginBottom: 15 }}>{description}</div>}
    </div>
  )
}

export const FormField = (config: FormFieldConfig): React.JSX.Element => {
  const {
    id, name, type = FormFieldTypes.TEXT, ariaLevel,
    title, hideTitle, description, helpText,
    defaultValue, style, titleStyle, validators,
    validation, onValidationChange,
  } = config

  // if the user specifies the 'errors' prop, we should use that as the source of truth.
  // otherwise, we should use internal state to keep track of errors.
  const [internalValidationState, setInternalValidationState] = useState<Validation | undefined>(undefined)

  const typeDefaultValue = isFunction(type.defaultValue) ? type.defaultValue(config) : type.defaultValue
  const [formValue, setFormValue] = useState(typeDefaultValue || '')

  const required = (validators ?? []).includes(FormValidators.REQUIRED)

  React.useEffect(() => {
    if (defaultValue !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormValue(defaultValue)
    }
  }, [defaultValue, type])

  React.useEffect(() => {
    validateFormProps(config)
  }, [config])

  const getValidation = useCallback((): Validation | undefined => {
    if (!isNil(validation)) {
      return validation
    }
    return internalValidationState
  }, [internalValidationState, validation])

  const updateValidation = useCallback((newValidation: Validation): void => {
    if (!isNil(onValidationChange)) {
      const event: FormValidationChangeEvent = { key: getKey({ name: name ?? null, id }), validation: newValidation }
      onValidationChange(event)
      return
    }
    setInternalValidationState(newValidation)
  }, [name, id, setInternalValidationState, onValidationChange])

  const TypeComponent = type.component
  return (
    <div key={`formControl_${id}`} style={style} className={`formField-container formField-${id}`}>
      <FormFieldTitle
        key={`form-field-title-${id}`}
        title={title}
        hideTitle={hideTitle}
        description={description}
        helpText={helpText}
        required={required}
        formId={id}
        ariaLevel={ariaLevel}
        validation={getValidation()}
        titleStyle={titleStyle}
      />
      <TypeComponent
        {...config}
        validation={getValidation()}
        setValidation={(newValidation: Validation) => updateValidation(newValidation)}
        formValue={formValue}
        setFormValue={setFormValue}
        required={required}
      />
    </div>
  )
}

/*
* Config options:
* id
* formFields: array[FormField Configs]
* onChange, error, setError, formInfo, setFormInfo
*/
export const FormTable = (config: FormTableConfig): React.JSX.Element => {
  const {
    id, formFields,
    enableAddingRow, addRowLabel,
    disabled, onChange, minLength,
    validation, onValidationChange, defaultValue, styleProps = {},
  } = config
  const {
    enableAddingRowStyle = { display: 'flex', width: '100%', justifyContent: 'flex-end', marginTop: 10 },
    addingRowButtonClassName = 'pill form-btn btn-xs',
    addRowButtonIconClassName = 'glyphicon glyphicon-plus',
    removeRowButtonIconClassName = 'glyphicon glyphicon-remove',
  } = styleProps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formValue, setFormValue] = useState<any[]>(defaultValue ?? [{}])

  const key = getKey(config)

  return (
    <div id={id} className={`formField-table formField-${id}`}>
      {/* generate columns */}
      <div className="formTable-row formTable-cols">
        {formFields.map(({ id: colId, validators, title }) => {
          const required = (validators ?? []).includes(FormValidators.REQUIRED)
          return (
            <label className="control-label" key={`${id}-${colId}`} id={`${id}-${colId}`}>
              {title}
              {required && '*'}
            </label>
          )
        })}
      </div>
      {/* generate form rows */}
      {formValue?.map((_, i) => (
        <div className="formTable-row formTable-data-row" key={`formtable-${id}-${i}`}>
          {formFields.map(formCol => (
            <FormField
              {...formCol}
              key={`${id}-${i}-${formCol.id}`}
              id={`${id}-${i}-${formCol.id}`}
              hideTitle={true}
              ariaDescribedby={`${id}-${formCol.id}`}
              defaultValue={formValue[i][getKey(formCol)]}
              validation={!isNil(validation) && isArray(validation) ? validation.at(i)?.[getKey(formCol)] : undefined}
              onChange={({ value }) => {
                const formValueClone = cloneDeep(formValue)
                formValueClone[i][getKey(formCol)] = value
                setFormValue(formValueClone)
                const event: FormFieldChangeEvent = { key, value: formValueClone, isValid: true }
                onChange(event)
              }}
              onValidationChange={({ validation: fieldValidation }) => {
                if (isNil(onValidationChange)) {
                  return
                }
                onValidationChange({ key: [getKey(config), i, getKey(formCol)], validation: fieldValidation })
              }}
            />
          ))}
          <button
            id={`delete-table-row-${id}-${i}`}
            key={`delete-table-row-${id}-${i}`}
            className="btn-formTable-delete btn-xs"
            type="button"
            disabled={disabled || formValue.length <= (minLength ?? 0)}
            onClick={() => {
              const formValueClone = cloneDeep(formValue)
              formValueClone.splice(i, 1)
              setFormValue(formValueClone)
              onChange({ key, value: formValueClone, isValid: true })
              if (!isNil(validation) && !isNil(onValidationChange)) {
                const validationClone = cloneDeep(validation)
                validationClone.splice(i, 1)
                onValidationChange({ key: getKey(config), validation: validationClone })
              }
            }}
          >
            <span className={removeRowButtonIconClassName} />
          </button>
        </div>
      ))}
      {/* add new row to table button */}
      {enableAddingRow && (
        <div style={enableAddingRowStyle}>
          <button
            id={`add-new-table-row-${id}`}
            key={`add-new-table-row-${id}`}
            className={addingRowButtonClassName}
            type="button"
            onClick={() => {
              const formValueClone = cloneDeep(formValue)
              formValueClone.push({})
              setFormValue(formValueClone)
              onChange({ key, value: formValueClone, isValid: true })
            }}
            style={{ marginTop: 10 }}
          >
            {addRowLabel ?? 'Add New'}
            <span
              className={addRowButtonIconClassName}
              style={{ marginLeft: '8px' }}
            />
          </button>
        </div>
      )}
    </div>
  )
}
