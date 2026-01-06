import { greaterThanZeroValidator, requiredValidator, urlValidator } from 'src/components/forms/formValidation'

describe('Form Validator tests', () => {
  describe('Validate number greater than zero tests', () => {
    it('Positive number should validate to true', () => {
      expect(greaterThanZeroValidator.isValid(1)).to.be.equal(true)
    })
    it('Zero should validate to false', () => {
      expect(greaterThanZeroValidator.isValid(0)).to.be.equal(false)
    })
    it('Negative number should validate to false', () => {
      expect(greaterThanZeroValidator.isValid(-1)).to.be.equal(false)
    })
  })
  describe('Validate \'required\' field tests', () => {
    it('Non-whitespace string should validate to true', () => {
      expect(requiredValidator.isValid('hello! I am a test')).to.be.equal(true)
    })
    it('Whitespace string should validate to false', () => {
      expect(requiredValidator.isValid('   ')).to.be.equal(false)
    })
    it('undefined should validate to false', () => {
      expect(requiredValidator.isValid(undefined)).to.be.equal(false)
    })
    it('null should validate to false', () => {
      expect(requiredValidator.isValid(null)).to.be.equal(false)
    })
  })
  describe('Validate \'url\' field tests', () => {
    it('Validate a non-url string is false', () => {
      expect(urlValidator.isValid('hello! I am a test')).to.be.equal(false)
    })
    it('Validate an empty string is false', () => {
      expect(urlValidator.isValid('')).to.be.equal(false)
    })
    it('Validate an whitespace string is false', () => {
      expect(urlValidator.isValid('   ')).to.be.equal(false)
    })
    it('Whitespace leading URL should validate to true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org')).to.be.equal(true)
    })
    it('Whitespace trailing URL should validate to true', () => {
      expect(urlValidator.isValid('   https://www.broadinstitute.org    ')).to.be.equal(true)
    })
    it('undefined should validate to false', () => {
      expect(urlValidator.isValid(undefined)).to.be.equal(false)
    })
    it('null should validate to false', () => {
      expect(urlValidator.isValid(null)).to.be.equal(false)
    })
  })
})
