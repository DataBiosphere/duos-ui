import { describe, expect, it } from 'vitest'
import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'

describe('shouldSkip401Redirect', () => {
  const duosApiUrl = 'https://duos.example.org/api'
  const otherApiUrl = 'https://other.example.org/api'

  it('returns true for GET /api/user/me from DUOS API', () => {
    const url = `${duosApiUrl}/user/me`
    expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(true)
  })

  it('returns false for GET /api/other from DUOS API', () => {
    const url = `${duosApiUrl}/other`
    expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(false)
  })

  it('returns true for GET /api/anything from non-DUOS API', () => {
    const url = `${otherApiUrl}/anything`
    expect(shouldSkip401Redirect(url, 'GET', duosApiUrl)).to.equal(true)
  })

  it('returns false for POST /api/user/me from DUOS API', () => {
    const url = `${duosApiUrl}/user/me`
    expect(shouldSkip401Redirect(url, 'POST', duosApiUrl)).to.equal(false)
  })

  it('returns false for POST /api/user/me from non-DUOS API', () => {
    const url = `${otherApiUrl}/user/me`
    expect(shouldSkip401Redirect(url, 'POST', duosApiUrl)).to.equal(false)
  })
})
