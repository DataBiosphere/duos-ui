import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'

describe('shouldSkip401Redirect', () => {
  const duosApiUrl = 'https://duos.example.org/api'
  const otherApiUrl = 'https://other.example.org/api'

  it('returns true for GET /api/user/me from DUOS API', () => {
    const url = `${duosApiUrl}/user/me`
    cy.wrap(shouldSkip401Redirect(url, 'GET', duosApiUrl)).then((result) => {
      expect(result).to.equal(true)
    })
  })

  it('returns false for GET /api/other from DUOS API', () => {
    const url = `${duosApiUrl}/other`
    cy.wrap(shouldSkip401Redirect(url, 'GET', duosApiUrl)).then((result) => {
      expect(result).to.equal(false)
    })
  })

  it('returns true for GET /api/anything from non-DUOS API', () => {
    const url = `${otherApiUrl}/anything`
    cy.wrap(shouldSkip401Redirect(url, 'GET', duosApiUrl)).then((result) => {
      expect(result).to.equal(true)
    })
  })

  it('returns false for POST /api/user/me from DUOS API', () => {
    const url = `${duosApiUrl}/user/me`
    cy.wrap(shouldSkip401Redirect(url, 'POST', duosApiUrl)).then((result) => {
      expect(result).to.equal(false)
    })
  })

  it('returns false for POST /api/user/me from non-DUOS API', () => {
    const url = `${otherApiUrl}/user/me`
    cy.wrap(shouldSkip401Redirect(url, 'POST', duosApiUrl)).then((result) => {
      expect(result).to.equal(false)
    })
  })
})
