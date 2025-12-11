import { CookieUtils } from 'src/utils/CookieUtils'

describe('CookieUtils', () => {
  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  describe('getCookiePairs', () => {
    it('should return an object of cookie key-value pairs', () => {
      document.cookie = 'foo=bar; baz=qux'
      const pairs = CookieUtils.getCookiePairs()
      expect(pairs).to.deep.equal({ foo: 'bar', baz: 'qux' })
    })
  })

  describe('getAcknowledged', () => {
    it('should return true if acknowledged', () => {
      const control = { acknowledged: true }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAcknowledged()).should('be.true')
    })

    it('should return false if not acknowledged', () => {
      const control = { acknowledged: false }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAcknowledged()).should('be.false')
    })

    it('should return false if cookie_control is missing', () => {
      document.cookie = 'foo=bar'
      cy.wrap(CookieUtils.getAcknowledged()).should('be.false')
    })
  })

  describe('setAccepted', () => {
    it('should set cookie_control cookie when acknowledged', () => {
      CookieUtils.setAcknowledged()
      cy.wrap(document.cookie).should('contain', 'cookie_control')
      cy.wrap(document.cookie).should('contain', '"acknowledged":true')
    })
  })
})
