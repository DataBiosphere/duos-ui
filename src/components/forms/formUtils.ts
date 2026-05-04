// Helper functions to replace lodash
const isNil = (value: unknown): value is null | undefined => value === null || value === undefined
const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => typeof value === 'function'
const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'

// Type definitions
interface FormFieldType {
  requiredProps?: string[]
  optionalProps?: string[]
  customPropValidation?: (props: Record<string, unknown>) => void
}

interface SelectOption {
  displayText: string
  [key: string]: unknown
}

interface RadioOption {
  name: string
  text: string
  [key: string]: unknown
}

// Keeping this local to avoid a circular dependency with forms.jsx
const defaultTextFieldType: FormFieldType = {
  requiredProps: [],
  optionalProps: ['placeholder', 'inputStyle', 'readOnly'],
}

const commonRequiredProps = [
  'id',
]

const commonOptionalProps = [
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
  'titleStyle',
  'validators',
  'onChange',
  'type',
  'key',
  'isRendered',
  'validation',
  'onValidationChange',
]

export const validateFormProps = (props: Record<string, unknown>): void => {
  const type = (isNil(props.type) ? defaultTextFieldType : props.type) as FormFieldType

  const requiredProps = (type.requiredProps || []).concat(commonRequiredProps)
  const optionalProps = new Set((type.optionalProps || []).concat(commonOptionalProps).concat(requiredProps))

  const propKeys = Object.keys(props)

  propKeys.forEach((prop: string) => {
    if (!optionalProps.has(prop)) {
      throw `unknown prop ${prop}`
    }
  })

  requiredProps.forEach((requiredProp: string) => {
    if (!propKeys.includes(requiredProp)) {
      throw `prop ${requiredProp} is required`
    }
  })

  if (isFunction(type.customPropValidation)) {
    type.customPropValidation(props)
  }
}

export const customSelectPropValidation = (props: Record<string, unknown>): void => {
  if (isNil(props.isAsync) || !props.isAsync) {
    if (isNil(props.selectOptions)) {
      throw 'must specify \'selectOptions\' in select form fields'
    }

    if (!isArray(props.selectOptions)) {
      throw 'prop \'selectOptions\' must be an array'
    }

    const isStringArr = props.selectOptions.length > 0 && isString(props.selectOptions[0])

    props.selectOptions.forEach((opt: unknown) => {
      if (isStringArr) {
        if (!isString(opt)) {
          throw 'all values in \'selectOptions\' must be string typed'
        }
        return
      }

      if (isNil((opt as SelectOption)?.displayText)) {
        throw 'every value in \'selectOptions\' needs a \'displayText\' field'
      }
    })
  }
  else if (isNil(props.loadOptions)) {
    throw 'must specify \'loadOptions\' if select is async'
  }
}

export const customRadioPropValidation = (props: Record<string, unknown>): void => {
  if (!isArray(props.options)) {
    throw '\'options\' prop must be an array.'
  }

  props.options.forEach((opt: unknown) => {
    if (isNil((opt as RadioOption)?.name)) {
      throw 'each option in \'options\' prop must have a \'name\' field'
    }

    if (isNil((opt as RadioOption)?.text)) {
      throw 'each option in \'options\' prop must have a \'text\' field'
    }
  })
}

export const getKey = ({ name, id }: { name?: string | null, id: string }): string => {
  return (isNil(name) ? id : name)
}
