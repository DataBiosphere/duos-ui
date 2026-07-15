import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  greaterThanZeroValidator,
  NotUrlValidator,
  requiredValidator,
  urlValidator,
  emailValidator,
  dateValidator,
  dayJSValidator,
  uniqueValidator,
  emailDomainValidator,
  fileTypeValidator,
  validateFormValue,
  validationMessage,
  isValid,
} from 'src/components/forms/formValidation'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(() => ({ institutionId: 1 })),
  },
}))

vi.mock('src/libs/ajax/Institution', () => ({
  Institution: {
    getById: vi.fn(),
  },
}))

describe('Form Validator tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requiredValidator', () => {
    it('validates a non-whitespace string as true', () => {
      expect(requiredValidator.isValid('hello! I am a test')).toBe(true)
    })
    it('validates a whitespace string as false', () => {
      expect(requiredValidator.isValid('   ')).toBe(false)
    })
    it('validates undefined as false', () => {
      expect(requiredValidator.isValid(undefined)).toBe(false)
    })
    it('validates null as false', () => {
      expect(requiredValidator.isValid(null)).toBe(false)
    })
    it('validates a non-empty object as true', () => {
      expect(requiredValidator.isValid({ key: 'value' })).toBe(true)
    })
  })

  describe('urlValidator', () => {
    it('validates a non-url string as false', () => {
      expect(urlValidator.isValid('hello! I am a test')).toBe(false)
    })
    it('validates an empty string as false', () => {
      expect(urlValidator.isValid('')).toBe(false)
    })
    it('validates a whitespace string as false', () => {
      expect(urlValidator.isValid('   ')).toBe(false)
    })
    it('validates a whitespace-leading URL as true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org')).toBe(true)
    })
    it('validates a whitespace-trailing URL as true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org    ')).toBe(true)
    })
    it('validates an https URL as true', () => {
      expect(urlValidator.isValid('https://www.broadinstitute.org')).toBe(true)
    })
    it('validates a javascript URL as false', () => {
      expect(urlValidator.isValid('javascript:alert(1)')).toBe(false)
    })
    it('validates a data URL as false', () => {
      expect(urlValidator.isValid('data:text/html,<script>alert(1)</script>')).toBe(false)
    })
    it('validates an ftp URL as false', () => {
      expect(urlValidator.isValid('ftp://example.com/file.txt')).toBe(false)
    })
    it('validates undefined as false', () => {
      expect(urlValidator.isValid(undefined)).toBe(false)
    })
    it('validates null as false', () => {
      expect(urlValidator.isValid(null)).toBe(false)
    })
  })

  describe('NotUrlValidator', () => {
    it('validates a non-url string as true', () => {
      expect(NotUrlValidator.isValid('hello! I am a test')).toBe(true)
    })
    it('validates a valid URL as false', () => {
      expect(NotUrlValidator.isValid('https://www.broadinstitute.org')).toBe(false)
    })
    it('validates an empty string as true', () => {
      expect(NotUrlValidator.isValid('')).toBe(true)
    })
    it('validates a whitespace string as true', () => {
      expect(NotUrlValidator.isValid('   ')).toBe(true)
    })
    it('validates undefined as true', () => {
      expect(NotUrlValidator.isValid(undefined)).toBe(true)
    })
    it('validates null as true', () => {
      expect(NotUrlValidator.isValid(null)).toBe(true)
    })
  })

  describe('emailValidator', () => {
    it('validates a correctly formatted email as true', () => {
      expect(emailValidator.isValid('user@example.com')).toBe(true)
    })
    it('validates a string without @ as false', () => {
      expect(emailValidator.isValid('notanemail')).toBe(false)
    })
    it('validates an empty string as false', () => {
      expect(emailValidator.isValid('')).toBe(false)
    })
  })

  describe('dateValidator', () => {
    it('validates a correctly formatted date as true', () => {
      expect(dateValidator.isValid('2023-06-15')).toBe(true)
    })
    it('validates an invalid date string as false', () => {
      expect(dateValidator.isValid('not-a-date')).toBe(false)
    })
    it('validates a date with wrong format as false', () => {
      expect(dateValidator.isValid('15/06/2023')).toBe(false)
    })
    it('validates a date with an out-of-range day as false', () => {
      expect(dateValidator.isValid('2023-01-32')).toBe(false)
    })
  })

  describe('dayJSValidator', () => {
    it('validates a valid YYYY-MM-DD date as true', () => {
      expect(dayJSValidator.isValid('2023-06-15')).toBe(true)
    })
    it('validates an invalid date string as false', () => {
      expect(dayJSValidator.isValid('not-a-date')).toBe(false)
    })
    it('validates an empty string as false', () => {
      expect(dayJSValidator.isValid('')).toBe(false)
    })
  })

  describe('uniqueValidator', () => {
    it('validates a value not in the list as true', () => {
      expect(uniqueValidator.isValid('new-item', ['item1', 'item2'])).toBe(true)
    })
    it('validates a value in the list as false', () => {
      expect(uniqueValidator.isValid('item1', ['item1', 'item2'])).toBe(false)
    })
    it('validates against an empty list as true', () => {
      expect(uniqueValidator.isValid('anything', [])).toBe(true)
    })
  })

  describe('greaterThanZeroValidator', () => {
    it('validates a positive number as true', () => {
      expect(greaterThanZeroValidator.isValid(1)).toBe(true)
    })
    it('validates zero as false', () => {
      expect(greaterThanZeroValidator.isValid(0)).toBe(false)
    })
    it('validates a negative number as false', () => {
      expect(greaterThanZeroValidator.isValid(-1)).toBe(false)
    })
    it('validates a non-number as false', () => {
      expect(greaterThanZeroValidator.isValid('5')).toBe(false)
    })
  })

  describe('fileTypeValidator', () => {
    it('rejects a file with a disallowed extension', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' })
      expect(fileTypeValidator().isValid(file)).toBe(false)
    })

    it('accepts a .pdf file', () => {
      const file = new File(['content'], 'letter.pdf', { type: 'application/pdf' })
      expect(fileTypeValidator().isValid(file)).toBe(true)
    })

    it('accepts a .doc or .docx file', () => {
      expect(fileTypeValidator().isValid(new File(['content'], 'letter.doc'))).toBe(true)
      expect(fileTypeValidator().isValid(new File(['content'], 'letter.docx'))).toBe(true)
    })

    it('is case-insensitive about the extension', () => {
      const file = new File(['content'], 'letter.PDF')
      expect(fileTypeValidator().isValid(file)).toBe(true)
    })

    it('ignores non-File values', () => {
      expect(fileTypeValidator().isValid('not-a-file')).toBe(true)
      expect(fileTypeValidator().isValid(undefined)).toBe(true)
    })

    it('defaults to the document msg listing pdf/doc/docx', () => {
      expect(fileTypeValidator().msg).toBe(
        'Invalid file type. Please upload an accepted document format (.pdf, .doc, .docx).',
      )
    })

    it('accepts a custom extension list per form', () => {
      const validator = fileTypeValidator(['.png', '.jpg'])
      expect(validator.isValid(new File(['content'], 'photo.png'))).toBe(true)
      expect(validator.isValid(new File(['content'], 'letter.pdf'))).toBe(false)
    })

    it('reflects the custom extension list in its msg', () => {
      const validator = fileTypeValidator(['.png', '.jpg'])
      expect(validator.msg).toBe(
        'Invalid file type. Please upload an accepted document format (.png, .jpg).',
      )
    })
  })

  describe('emailDomainValidator', () => {
    it('has a default msg when no institution is cached', () => {
      expect(emailDomainValidator.msg).toBe(
        'Please enter an email that matches your organization domains',
      )
    })
  })

  describe('validateFormValue', () => {
    it('returns valid:true when value is empty and not required', () => {
      const result = validateFormValue('', [urlValidator])
      expect(result.valid).toBe(true)
    })

    it('returns valid:false when value is empty and required', () => {
      const result = validateFormValue('', [requiredValidator])
      expect(result.valid).toBe(false)
      expect(result.failed).toContain('required')
    })

    it('returns valid:true when value passes all validators', () => {
      const result = validateFormValue('hello', [requiredValidator])
      expect(result.valid).toBe(true)
      expect(result.failed).toHaveLength(0)
    })

    it('accumulates multiple failed validator ids', () => {
      const result = validateFormValue('', [requiredValidator, urlValidator])
      expect(result.valid).toBe(false)
      expect(result.failed).toContain('required')
    })

    it('validates each element when formValue is an array', () => {
      const result = validateFormValue(['', 'valid'], [requiredValidator])
      expect(result.valid).toBe(false)
    })

    it('returns valid:true for array when all elements pass', () => {
      const result = validateFormValue(['hello', 'world'], [requiredValidator])
      expect(result.valid).toBe(true)
    })

    it('handles undefined validators gracefully', () => {
      const result = validateFormValue('anything', undefined)
      expect(result.valid).toBe(true)
    })

    it('runs a non-required validator against a File value instead of treating it as empty', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' })
      const result = validateFormValue(file, [fileTypeValidator()])
      expect(result.valid).toBe(false)
      expect(result.failed).toContain('fileType')
    })

    it('returns valid:true for a File that passes the fileType validator', () => {
      const file = new File(['content'], 'letter.pdf', { type: 'application/pdf' })
      const result = validateFormValue(file, [fileTypeValidator()])
      expect(result.valid).toBe(true)
    })

    it('returns valid:true when no file is selected and the field is not required', () => {
      const result = validateFormValue(undefined, [fileTypeValidator()])
      expect(result.valid).toBe(true)
    })

    it('reports the failing message for each failed validator, in order', () => {
      const result = validateFormValue('', [requiredValidator, urlValidator])
      expect(result.failed).toEqual(['required', 'uri'])
      expect(result.messages).toEqual([requiredValidator.msg, urlValidator.msg])
    })

    it('surfaces a per-form custom fileType message rather than the default one', () => {
      const file = new File(['content'], 'letter.pdf', { type: 'application/pdf' })
      const customValidator = fileTypeValidator(['.png', '.jpg'])
      const result = validateFormValue(file, [customValidator])
      expect(result.valid).toBe(false)
      expect(result.messages).toEqual([customValidator.msg])
      expect(result.messages).not.toEqual([fileTypeValidator().msg])
    })
  })

  describe('validationMessage', () => {
    it('returns a human-readable message for a known validator id', () => {
      expect(validationMessage('required')).toBe('Please enter a value')
    })

    it('returns a human-readable message for the url validator', () => {
      expect(validationMessage('uri')).toBe('Please enter a valid url (e.g., https://duos.org)')
    })

    it('returns a generic message for an unknown validator id', () => {
      expect(validationMessage('nonexistent')).toBe('Invalid value.')
    })
  })

  describe('isValid', () => {
    it('returns true when validation is undefined (untouched)', () => {
      expect(isValid(undefined)).toBe(true)
    })

    it('returns true when validation.valid is undefined (untouched)', () => {
      expect(isValid({})).toBe(true)
    })

    it('returns true when validation.valid is true', () => {
      expect(isValid({ valid: true })).toBe(true)
    })

    it('returns false when validation.valid is false', () => {
      expect(isValid({ valid: false })).toBe(false)
    })
  })
})
