import { isEmailAddress } from 'src/libs/utils'
import { isString, isEmpty, isNil, isArray, isNumber } from 'src/utils/NodashUtil'
import { Storage } from 'src/libs/storage'
import dayjs from 'dayjs'
import { Institution } from 'src/libs/ajax/Institution'
import { isValidHttpUrl } from 'src/utils/UrlUtils'
import { InstitutionInterface } from 'src/types/model'

export interface Validation {
  valid?: boolean
  failed?: string[]
}

export interface Validator {
  id: string
  isValid: (value: unknown, ...extra: unknown[]) => boolean | Promise<boolean>
  readonly msg: string
}

let cachedInstitution: InstitutionInterface | null = null

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

export const emailDomainValidator: Validator = {
  id: 'emailDomain',
  isValid: async (newUserEmail: unknown): Promise<boolean> => {
    const institutionId = Storage.getCurrentUser().institutionId
    if (!cachedInstitution && institutionId != null) {
      cachedInstitution = await Institution.getById(institutionId)
    }
    const institutionDomains = cachedInstitution?.domains ?? []
    const newUserDomain = (newUserEmail as string).split('@')[1]
    return institutionDomains.includes(newUserDomain)
  },
  get msg(): string {
    const domains = cachedInstitution?.domains?.join(', ') ?? ''
    const baseMessage = 'Please enter an email that matches your organization domains'
    return domains ? `${baseMessage}: ${domains}` : baseMessage
  },
}

export const dateValidator: Validator = {
  id: 'date',
  isValid: (val: unknown): boolean => isValidDate(val as string),
  msg: 'Please enter a date (YYYY-MM-DD), e.g. 2018-11-13',
}

export const dayJSValidator: Validator = {
  id: 'dayjs',
  isValid: (val: unknown): boolean => isValidDayjsDate(val as string),
  msg: 'Please select a valid date.',
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

export const fileTypeValidator: Validator = {
  id: 'fileType',
  isValid: (val: unknown): boolean => !(val instanceof File) || ACCEPTED_DOCUMENT_EXTENSIONS.includes(fileExtension(val)),
  msg: `Invalid file type. Please upload an accepted document format (${ACCEPTED_DOCUMENT_EXTENSIONS.join(', ')}).`,
}

const allValidators: Validator[] = [
  requiredValidator,
  urlValidator,
  NotUrlValidator,
  emailValidator,
  emailDomainValidator,
  dateValidator,
  dayJSValidator,
  uniqueValidator,
  greaterThanZeroValidator,
  fileTypeValidator,
]

export const validateFormValue = (formValue: unknown, validators: Validator[] | undefined): Validation => {
  // File objects have no own enumerable keys, so isEmpty() would wrongly treat a selected file as "empty"
  // and skip validation below (e.g. fileTypeValidator would never run).
  const isEmptyValue = !(formValue instanceof File) && isEmpty(formValue)
  if (isEmptyValue && !validators?.includes(requiredValidator)) {
    return { valid: true }
  }

  const failedValidators: string[] = []

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
    }
  })

  return {
    valid: failedValidators.length === 0,
    failed: failedValidators,
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

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

const isValidDate = (val: string): boolean => dateRegex.test(val)

const isValidDayjsDate = (val: string): boolean => dayjs(val, 'YYYY-MM-DD', true).isValid()
