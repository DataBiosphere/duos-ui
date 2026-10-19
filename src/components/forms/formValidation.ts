import { isEmailAddress } from 'src/libs/utils'
import { isString, isEmpty, isNil, isArray, isNumber } from 'src/utils/NodashUtil'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { isValidHttpUrl } from 'src/utils/UrlUtils'

export interface Validation {
  valid?: boolean
  failed?: string[]
  messages?: string[]
}

export interface Validator {
  id: string
  isValid: (value: unknown, ...extra: unknown[]) => boolean
  readonly msg: string
}

dayjs.extend(customParseFormat)

export const requiredValidator: Validator = {
  id: 'required',
  isValid: (value: unknown): boolean =>
    value !== undefined && value !== null
    && (isString(value) ? value.trim() !== '' : true),
  msg: 'Please enter a value',
}

export const urlValidator: Validator = {
  id: 'uri',
  isValid: (val: unknown): boolean => isValidHttpUrl(val),
  msg: 'Please enter a valid url (e.g., https://duos.org)',
}

export const NotUrlValidator: Validator = {
  id: 'notUri',
  isValid: (val: unknown): boolean => !validURLObject(val),
  msg: 'Please enter a value that is not a url',
}

export const emailValidator: Validator = {
  id: 'email',
  isValid: (val: unknown): boolean => isEmailAddress(val as string),
  msg: 'Please enter a valid email address (e.g., person@example.com)',
}

export const dateValidator: Validator = {
  id: 'date',
  isValid: (val: unknown): boolean => isValidDate(val as string),
  msg: 'Please enter a date (YYYY-MM-DD), e.g. 2018-11-13',
}

export const uniqueValidator: Validator = {
  id: 'unique',
  isValid: (val: unknown, ...extra: unknown[]): boolean => {
    const list = extra[0] as unknown[]
    return !list.includes(val)
  },
  msg: 'Please enter a unique value that doesn\'t exist in the system',
}

export const greaterThanZeroValidator: Validator = {
  id: 'greaterThanZero',
  isValid: (val: unknown): boolean => isNumber(val) && val > 0,
  msg: 'Please enter a number greater than zero',
}

export const ACCEPTED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx']

const fileExtension = (file: File): string => {
  const dotIndex = file.name.lastIndexOf('.')
  return dotIndex === -1 ? '' : file.name.slice(dotIndex).toLowerCase()
}

export const fileTypeValidator = (acceptedExtensions: string[] = ACCEPTED_DOCUMENT_EXTENSIONS): Validator => ({
  id: 'fileType',
  isValid: (val: unknown): boolean => !(val instanceof File) || acceptedExtensions.includes(fileExtension(val)),
  msg: `Invalid file type. Please upload an accepted document format (${acceptedExtensions.join(', ')}).`,
})

const allValidators: Validator[] = [
  requiredValidator,
  urlValidator,
  NotUrlValidator,
  emailValidator,
  dateValidator,
  uniqueValidator,
  greaterThanZeroValidator,
  fileTypeValidator(),
]

export const validateFormValue = (formValue: unknown, validators: Validator[] | undefined): Validation => {
  // File objects have no own enumerable keys, so isEmpty() would wrongly treat a selected file as "empty"
  // and skip validation below (e.g. fileTypeValidator would never run).
  const isEmptyValue = !(formValue instanceof File) && isEmpty(formValue)
  if (isEmptyValue && !validators?.includes(requiredValidator)) {
    return { valid: true }
  }

  const failedValidators: string[] = []
  const failedMessages: string[] = []

  validators?.forEach((validator) => {
    let failed: boolean
    if (isArray(formValue)) {
      failed = formValue.some(val => !validator.isValid(val))
    }
    else {
      failed = !validator.isValid(formValue)
    }

    if (failed) {
      failedValidators.push(validator.id)
      failedMessages.push(validator.msg)
    }
  })

  return {
    valid: failedValidators.length === 0,
    failed: failedValidators,
    messages: failedMessages,
  }
}

export const validationMessage = (failedValidator: string): string => {
  const validator = allValidators.find(v => v.id === failedValidator)
  return validator?.msg ?? 'Invalid value.'
}

export const isValid = (validation: Validation | undefined): boolean => {
  if (isNil(validation) || isNil(validation.valid)) {
    return true
  }
  return validation.valid
}

// ----------------------------------------------------------------------------------------------------- //
// ======                                    HELPER FUNCTIONS                                     ====== //
// ----------------------------------------------------------------------------------------------------- //

const validURLObject = (val: unknown): boolean => {
  try {
    new URL(val as string)
  }
  catch {
    return false
  }
  return true
}

export const isValidDate = (val: string): boolean => dayjs(val, 'YYYY-MM-DD', true).isValid()
