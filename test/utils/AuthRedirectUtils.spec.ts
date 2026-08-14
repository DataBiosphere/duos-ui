import { describe, expect, it } from 'vitest'
import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'

describe('shouldSkip401Redirect', () => {
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

  describe('BFF mode (apiUrl is the relative proxy prefix)', () => {
    const proxyPrefix = '/duos-api'

    it('returns true for GET on the proxied auth probe', () => {
      expect(shouldSkip401Redirect('/duos-api/api/user/me', 'GET', proxyPrefix)).to.equal(true)
    })

    it('returns false for GET on another proxied endpoint', () => {
      expect(shouldSkip401Redirect('/duos-api/api/other', 'GET', proxyPrefix)).to.equal(false)
    })

    it('returns false for POST on the proxied auth probe', () => {
      expect(shouldSkip401Redirect('/duos-api/api/user/me', 'POST', proxyPrefix)).to.equal(false)
    })

    it('returns true for GET on an absolute non-DUOS URL', () => {
      expect(shouldSkip401Redirect('https://bard.example.org/api/event', 'GET', proxyPrefix)).to.equal(true)
    })

    it.each(['/ecm-api/api/oauth/v1/ras/authorization-url', '/tdr-api/api/repository/v1/snapshots', '/bard-api/api/event'])(
      'returns true for GET on the sibling upstream proxy %s — its 401 is not authoritative about the DUOS session',
      (url) => {
        expect(shouldSkip401Redirect(url, 'GET', proxyPrefix)).to.equal(true)
      },
    )
  })
})
