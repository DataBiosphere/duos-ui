import { ToS, ToSStatus } from 'src/libs/ajax/ToS'
import { Config } from 'src/libs/config'
import { UserStatusInfo } from 'src/types/model'

describe('ToS ajax module', () => {
  const apiUrl = 'https://api.example.test'
  const authHeaders = {
    'Authorization': 'Bearer test-token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  }

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'authOpts').returns({ headers: authHeaders })
    cy.stub(Config, 'textPlain').returns({ headers: { Accept: 'text/plain' } })
    cy.initApplicationConfig()
  })

  it('getDUOSText fetches the DUOS ToS text', () => {
    const expectedText = 'DUOS Terms of Service text.'
    cy.intercept('GET', `${apiUrl}/tos/text/duos`, {
      statusCode: 200,
      body: expectedText,
      headers: { 'content-type': 'text/plain' },
    }).as('getDUOSText')

    cy.wrap(ToS.getDUOSText()).should('equal', expectedText)
    cy.wait('@getDUOSText').then(({ request }) => {
      expect(request.headers.accept).to.equal('text/plain')
    })
  })

  it('acceptToS posts and returns UserStatusInfo', () => {
    const expected: UserStatusInfo = {
      enabled: false,
      userEmail: 'test@duos.org',
      userSubjectId: '123',
      tosAccepted: true,
    }
    cy.intercept('POST', `${apiUrl}/api/sam/register/self/tos`, {
      statusCode: 200,
      body: expected,
      headers: { 'content-type': 'application/json' },
    }).as('acceptToS')

    cy.wrap(ToS.acceptToS()).should('deep.equal', expected)
    cy.wait('@acceptToS').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
      expect(request.headers['x-app-id']).to.equal(authHeaders['X-App-ID'])
    })
  })

  it('rejectToS deletes and returns ToSStatus', () => {
    const expected: ToSStatus = {
      acceptedOn: '2026-04-30T12:00:00.000Z',
      isCurrentVersion: false,
      latestAcceptedVersion: 'v2',
      permitsSystemUsage: false,
    }
    cy.intercept('DELETE', `${apiUrl}/api/sam/register/self/tos`, {
      statusCode: 200,
      body: expected,
      headers: { 'content-type': 'application/json' },
    }).as('rejectToS')

    cy.wrap(ToS.rejectToS()).should('deep.equal', expected)
    cy.wait('@rejectToS').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
      expect(request.headers['x-app-id']).to.equal(authHeaders['X-App-ID'])
    })
  })
})
