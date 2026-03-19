import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { Config } from 'src/libs/config'

describe('AuthenticateNIH', () => {
  const apiUrl = 'https://api'
  const ecmUrl = 'https://ecm'

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'getECMUrl').resolves(ecmUrl)
    cy.stub(Config, 'authOpts').returns({
      headers: { Authorization: 'Bearer test' },
    })
  })

  it('deleteAccountLinkage sends DELETE request', () => {
    cy.intercept('DELETE', '**/api/nih', {
      statusCode: 200,
      body: {},
    }).as('deleteNih')

    cy.wrap(AuthenticateNIH.deleteAccountLinkage())

    cy.wait('@deleteNih')
      .its('request.headers.authorization')
      .should('exist')
  })

  it('getECMProviderAuthUrl sends correct request and returns value', () => {
    const redirectUri = 'https://app/callback'
    const redirectTo = '/home'
    const response = 'https://auth.url'

    cy.intercept(
      {
        method: 'POST',
        pathname: '/api/oauth/v1/ras/authorization-url',
      },
      {
        statusCode: 200,
        body: response,
      },
    ).as('authUrl')

    cy.wrap(null)
      .then(() =>
        AuthenticateNIH.getECMProviderAuthUrl(redirectUri, redirectTo),
      )
      .should('equal', response)

    cy.wait('@authUrl')
      .its('request')
      .should((req) => {
        expect(req.body).to.deep.equal({ redirectTo })
        expect(req.headers.accept).to.equal('*/*')
        expect(req.url).to.include(`redirectUri=${redirectUri}`)
      })
  })

  it('getECMProviderAuthUrl throws when response is empty', () => {
    cy.intercept('POST', '**/authorization-url*', {
      statusCode: 200,
      body: '',
    }).as('authUrl')

    cy.on('fail', (err) => {
      expect(err.message).to.include('data')
    })

    cy.wrap(null).then(() =>
      AuthenticateNIH.getECMProviderAuthUrl('uri', '/home'),
    )

    cy.wait('@authUrl')
  })

  it('getECMProviderLinkInfo sends correct request and returns data', () => {
    const code = 'abc'
    const state = 'xyz'

    const mockResponse = {
      additionalState: { redirectTo: '/dashboard' },
    }

    cy.intercept('POST', '**/oauthcode*', {
      statusCode: 200,
      body: mockResponse,
    }).as('linkInfo')

    cy.wrap(
      AuthenticateNIH.getECMProviderLinkInfo(code, state),
    ).should('deep.equal', mockResponse)

    cy.wait('@linkInfo')
      .its('request.url')
      .should('include', `state=${state}`)
      .and('include', `oauthcode=${code}`)
  })

  it('getSyncedUser fetches user correctly', () => {
    const mockUser = {
      userId: '123',
      email: 'test@example.com',
    }

    cy.intercept('GET', '**/api/nih/sync', {
      statusCode: 200,
      body: mockUser,
    }).as('syncUser')

    cy.wrap(AuthenticateNIH.getSyncedUser()).should(
      'deep.equal',
      mockUser,
    )

    cy.wait('@syncUser')
  })
})
