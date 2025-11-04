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

  describe('getAnalyticsControl', () => {
    it('should return true if analytics is allowed', () => {
      const control = { analytics: true }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAnalyticsControl()).should('be.true')
    })

    it('should return false if analytics is not allowed', () => {
      const control = { analytics: false }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAnalyticsControl()).should('be.false')
    })

    it('should return false if cookie_control is missing', () => {
      document.cookie = 'foo=bar'
      cy.wrap(CookieUtils.getAnalyticsControl()).should('be.false')
    })
  })

  describe('setAnalyticsControl', () => {
    it('should set cookie_control cookie when allowed is true', () => {
      CookieUtils.setAnalyticsControl(true)
      cy.wrap(document.cookie).should('contain', 'cookie_control')
      cy.wrap(document.cookie).should('contain', '"analytics":true')
    })

    it('should clear analytics cookies when allowed is false', () => {
      // Set some analytics cookies
      document.cookie = '_ga=123; _gid=456;'
      CookieUtils.setAnalyticsControl(false)
      // All analytics cookies should be cleared (set to empty string)
      const pairs = CookieUtils.getCookiePairs()
      cy.wrap(pairs._ga).should('be.undefined')
      cy.wrap(pairs._gid).should('be.undefined')
    })
  })
})
