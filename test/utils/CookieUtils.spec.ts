import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CookieUtils } from 'src/utils/CookieUtils'

// The stub below replaces `document.cookie` with a plain writable property, so
// an assignment overwrites the whole string instead of appending one pair. That
// is what makes the attribute assertions possible: the attributes a real
// document.cookie setter consumes stay readable here.
describe('CookieUtils', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      configurable: true,
      value: '',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getCookiePairs', () => {
    it('should return an object of cookie key-value pairs', () => {
      document.cookie = 'foo=bar; baz=qux'
      const pairs = CookieUtils.getCookiePairs()
      expect(pairs).toEqual({ foo: 'bar', baz: 'qux' })
    })
  })

  describe('getAcknowledged', () => {
    it('should return true if acknowledged', () => {
      const control = { acknowledged: true }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      expect(CookieUtils.getAcknowledged()).toBe(true)
    })

    it('should return false if not acknowledged', () => {
      const control = { acknowledged: false }
      document.cookie = `cookie_control=${encodeURIComponent(JSON.stringify(control))}`
      expect(CookieUtils.getAcknowledged()).toBe(false)
    })

    it('should return false if cookie_control is missing', () => {
      document.cookie = 'foo=bar'
      expect(CookieUtils.getAcknowledged()).toBe(false)
    })

    it('should return false, not throw, if the value is not valid JSON', () => {
      document.cookie = 'cookie_control=not-json'
      expect(() => CookieUtils.getAcknowledged()).not.toThrow()
      expect(CookieUtils.getAcknowledged()).toBe(false)
    })

    it('should read back a value written by setAcknowledged', () => {
      CookieUtils.setAcknowledged()
      // Drop the attributes the browser would strip before a read.
      document.cookie = document.cookie.split(';')[0]
      expect(CookieUtils.getAcknowledged()).toBe(true)
    })
  })

  describe('setAcknowledged', () => {
    it('should set cookie_control cookie when acknowledged', () => {
      CookieUtils.setAcknowledged()
      expect(document.cookie).toContain('cookie_control')
      expect(CookieUtils.getCookiePairs()['cookie_control']).toContain('"acknowledged":true')
    })

    it('should URL-encode the JSON value', () => {
      CookieUtils.setAcknowledged()
      const raw = document.cookie.split(';')[0].split('=').slice(1).join('=')
      expect(raw).not.toContain('{')
      expect(raw).toContain('%7B')
      expect(JSON.parse(decodeURIComponent(raw)).acknowledged).toBe(true)
    })

    it('should set path, max-age and SameSite=Strict', () => {
      CookieUtils.setAcknowledged()
      expect(document.cookie).toContain('path=/')
      expect(document.cookie).toContain(`max-age=${400 * 24 * 60 * 60}`)
      // Strict, not Lax: nothing needs this cookie on a cross-site navigation.
      expect(document.cookie).toContain('SameSite=Strict')
    })

    it('should omit Secure over plain HTTP so dev setups keep working', () => {
      vi.stubGlobal('location', { ...window.location, protocol: 'http:' })
      CookieUtils.setAcknowledged()
      expect(document.cookie).not.toContain('Secure')
    })

    it('should add Secure over HTTPS', () => {
      vi.stubGlobal('location', { ...window.location, protocol: 'https:' })
      CookieUtils.setAcknowledged()
      expect(document.cookie).toContain('; Secure')
    })
  })
})
