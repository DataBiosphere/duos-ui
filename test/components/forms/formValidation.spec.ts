import { describe, it, expect } from 'vitest'
import {
  greaterThanZeroValidator,
  NotUrlValidator,
  requiredValidator,
  urlValidator,
} from 'src/components/forms/formValidation'

describe('Form Validator tests', () => {
  describe('Validate number greater than zero tests', () => {
    it('Positive number should validate to true', () => {
      expect(greaterThanZeroValidator.isValid(1)).toBe(true)
    })
    it('Zero should validate to false', () => {
      expect(greaterThanZeroValidator.isValid(0)).toBe(false)
    })
    it('Negative number should validate to false', () => {
      expect(greaterThanZeroValidator.isValid(-1)).toBe(false)
    })
  })

  describe('Validate \'required\' field tests', () => {
    it('Non-whitespace string should validate to true', () => {
      expect(requiredValidator.isValid('hello! I am a test')).toBe(true)
    })
    it('Whitespace string should validate to false', () => {
      expect(requiredValidator.isValid('   ')).toBe(false)
    })
    it('undefined should validate to false', () => {
      expect(requiredValidator.isValid(undefined)).toBe(false)
    })
    it('null should validate to false', () => {
      expect(requiredValidator.isValid(null)).toBe(false)
    })
  })

  describe('Validate \'url\' field tests', () => {
    it('Validate a non-url string is false', () => {
      expect(urlValidator.isValid('hello! I am a test')).toBe(false)
    })
    it('Validate an empty string is false', () => {
      expect(urlValidator.isValid('')).toBe(false)
    })
    it('Validate an whitespace string is false', () => {
      expect(urlValidator.isValid('   ')).toBe(false)
    })
    it('Whitespace leading URL should validate to true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org')).toBe(true)
    })
    it('Whitespace trailing URL should validate to true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org    ')).toBe(true)
    })
    it('https URL should validate to true', () => {
      expect(urlValidator.isValid('https://www.broadinstitute.org')).toBe(true)
    })
    it('javascript URL should validate to false', () => {
      expect(urlValidator.isValid('javascript:alert(1)')).toBe(false)
    })
    it('data URL should validate to false', () => {
      expect(urlValidator.isValid('data:text/html,<script>alert(1)</script>')).toBe(false)
    })
    it('ftp URL should validate to false', () => {
      expect(urlValidator.isValid('ftp://example.com/file.txt')).toBe(false)
    })
    it('undefined should validate to false', () => {
      expect(urlValidator.isValid(undefined)).toBe(false)
    })
    it('null should validate to false', () => {
      expect(urlValidator.isValid(null)).toBe(false)
    })
  })

  describe('Validate \'not url\' field tests', () => {
    it('Non-url string should validate to true', () => {
      expect(NotUrlValidator.isValid('hello! I am a test')).toBe(true)
    })
    it('Valid URL should validate to false', () => {
      expect(NotUrlValidator.isValid('https://www.broadinstitute.org')).toBe(false)
    })
    it('Empty string should validate to true', () => {
      expect(NotUrlValidator.isValid('')).toBe(true)
    })
    it('Whitespace string should validate to true', () => {
      expect(NotUrlValidator.isValid('   ')).toBe(true)
    })
    it('undefined should validate to true', () => {
      expect(NotUrlValidator.isValid(undefined)).toBe(true)
    })
    it('null should validate to true', () => {
      expect(NotUrlValidator.isValid(null)).toBe(true)
    })
  })
})
