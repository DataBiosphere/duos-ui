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

  describe('getAccepted', () => {
    it('should return true if accepted', () => {
      const control = { accepted: true }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAccepted()).should('be.true')
    })

    it('should return false if not accepted', () => {
      const control = { accepted: false }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      cy.wrap(CookieUtils.getAccepted()).should('be.false')
    })

    it('should return false if cookie_control is missing', () => {
      document.cookie = 'foo=bar'
      cy.wrap(CookieUtils.getAccepted()).should('be.false')
    })
  })

  describe('setAccepted', () => {
    it('should set cookie_control cookie when accepted', () => {
      CookieUtils.setAccepted()
      cy.wrap(document.cookie).should('contain', 'cookie_control')
      cy.wrap(document.cookie).should('contain', '"accepted":true')
    })
  })
})
