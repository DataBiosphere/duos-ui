import { describe, it, expect, beforeEach } from 'vitest'
import { CookieUtils } from 'src/utils/CookieUtils'

describe('CookieUtils', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
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
  })

  describe('setAcknowledged', () => {
    it('should set cookie_control cookie when acknowledged', () => {
      CookieUtils.setAcknowledged()
      expect(document.cookie).toContain('cookie_control')
      expect(document.cookie).toContain('"acknowledged":true')
    })
  })
})
