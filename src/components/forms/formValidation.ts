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

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/
const DOI_PREFIX = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:)/i

/** A DOI as stored: the bare `10.xxxx/...` form, with any resolver URL or `doi:` prefix removed. */
export const normalizeDoi = (value: string): string => value.trim().replace(DOI_PREFIX, '')

export const doiValidator: Validator = {
  id: 'doi',
  isValid: (val: unknown): boolean => isString(val) && DOI_PATTERN.test(normalizeDoi(val)),
  msg: 'Please enter a valid DOI (e.g., 10.1000/xyz123 or https://doi.org/10.1000/xyz123)',
}

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
const ORCID_PREFIX = /^https?:\/\/(?:www\.)?orcid\.org\//i

/** An ORCID iD as stored: the bare `0000-0000-0000-000X` form, upper-cased, with any orcid.org URL removed. */
export const normalizeOrcid = (value: string): string => value.trim().replace(ORCID_PREFIX, '').toUpperCase()

/** ISO 7064 MOD 11-2, the check digit ORCID uses, so a typo in any digit is caught before submission. */
const orcidChecksumMatches = (orcid: string): boolean => {
  const digits = orcid.replace(/-/g, '')
  let total = 0
  for (const char of digits.slice(0, -1)) {
    total = (total + Number(char)) * 2
  }
  const result = (12 - (total % 11)) % 11
  const expected = result === 10 ? 'X' : String(result)
  return digits.at(-1) === expected
}

export const orcidValidator: Validator = {
  id: 'orcid',
  isValid: (val: unknown): boolean => {
    if (!isString(val)) return false
    const orcid = normalizeOrcid(val)
    return ORCID_PATTERN.test(orcid) && orcidChecksumMatches(orcid)
  },
  msg: 'Please enter a valid ORCID iD (e.g., 0000-0002-1825-0097)',
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
  doiValidator,
  orcidValidator,
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
