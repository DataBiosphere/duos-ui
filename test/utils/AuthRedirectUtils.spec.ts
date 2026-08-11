import { describe, expect, it } from 'vitest'
import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'

describe('shouldSkip401Redirect', () => {
  describe('legacy absolute API URL', () => {
    const duosApiUrl = 'https://duos.example.org'
    const otherApiUrl = 'https://other.example.org'

    it('returns true for GET /api/user/me from DUOS API', () => {
      const url = `${duosApiUrl}/api/user/me`
      expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(true)
    })

    it('returns false for GET /api/other from DUOS API', () => {
      const url = `${duosApiUrl}/api/other`
      expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(false)
    })

    it('returns true for GET /api/anything from non-DUOS API', () => {
      const url = `${otherApiUrl}/api/anything`
      expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(true)
    })

    it('returns false for POST /api/user/me from DUOS API', () => {
      const url = `${duosApiUrl}/api/user/me`
      expect(shouldSkip401Redirect(url, 'POST', duosApiUrl)).to.equal(false)
    })

    it('returns false for POST /api/user/me from non-DUOS API', () => {
      const url = `${otherApiUrl}/api/user/me`
      expect(shouldSkip401Redirect(url, 'POST', duosApiUrl)).to.equal(false)
    })
  })

  describe('BFF relative proxy prefix', () => {
    const bffApiUrl = '/duos-api'

    it('returns true for GET of the proxied auth probe', () => {
      expect(shouldSkip401Redirect('/duos-api/api/user/me', 'GET', bffApiUrl)).to.equal(true)
    })

    it('returns false for GET of other proxied endpoints', () => {
      expect(shouldSkip401Redirect('/duos-api/api/dataset/1', 'GET', bffApiUrl)).to.equal(false)
    })

    it('returns false for POST of the proxied auth probe', () => {
      expect(shouldSkip401Redirect('/duos-api/api/user/me', 'POST', bffApiUrl)).to.equal(false)
    })

    it('returns true for GET of an absolute non-BFF URL', () => {
      expect(shouldSkip401Redirect('https://bard.example.org/api/event', 'GET', bffApiUrl)).to.equal(true)
    })
  })
})
