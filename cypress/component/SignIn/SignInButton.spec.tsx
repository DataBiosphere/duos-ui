import React from 'react'
import SignInButton from 'src/components/SignInButton'
import { User } from 'src/libs/ajax/User'
import { Auth } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import { Metrics } from 'src/libs/ajax/Metrics'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'
import { mockOidcUser } from '../Auth/mockOidcUser'
import { BrowserRouter } from 'react-router-dom'
import { DuosUser, UserStatusInfo } from 'src/types/model'

const signInText = 'Sign In'

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  emailPreference: true,
  eraCommonsId: 'eraCommonsId',
  institutionId: 1,
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  isServiceAccount: false,
  roles: [{
    name: 'Admin',
  }],
} as unknown as DuosUser

const userStatus = {
  adminEnabled: true,
  enabled: true,
  userSubjectId: '1234',
  tosAccepted: true,
} as UserStatusInfo

const consentStatus = {
  ok: true,
  degraded: false,
  systems: {
    sam: {
      details: {
        ok: true,
      },
    },
  },
}

describe('Sign In: Component Loads', function () {
  beforeEach(() => {
    cy.viewport(600, 300)
    cy.initApplicationConfig()
    cy.stub(ServiceStatus, 'getConsentStatus').resolves(consentStatus)
  })

  it('Sign In Button Loads', function () {
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.contains(signInText).should('exist')
    cy.get('button').should('exist').and('not.be.disabled')
  })

  it('Sign In: On Success', function () {
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    const tosAcceptedUser = { ...{ userStatusInfo: userStatus }, ...duosUser }
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: tosAcceptedUser }).as('getMe')
    cy.stub(StackdriverReporter, 'report').as('report')
    cy.stub(Metrics, 'identify').as('identify')
    cy.stub(Metrics, 'syncProfile').as('syncProfile')
    cy.stub(Metrics, 'captureEvent').as('captureEvent')
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@getMe').then(() => {
      expect(Storage.getCurrentUser()).to.deep.equal(tosAcceptedUser)
      assert.isNotNull(Storage.getAnonymousId(), 'Anonymous ID should not be null')
      cy.get('@report').should('not.be.called')
      cy.get('@identify').should('be.called')
      cy.get('@syncProfile').should('be.called')
      cy.get('@captureEvent').should('be.called')
    })
  })

  it('Sign In: No Roles Error Reporter Is Called', function () {
    const bareUser = { email: 'test@user.com' }
    const tosAcceptedUser = { ...{ userStatusInfo: userStatus }, ...bareUser }
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: tosAcceptedUser }).as('getMe')
    cy.stub(StackdriverReporter, 'report').as('report')
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@getMe').then(() => {
      cy.get('@report').should('be.called')
    })
  })

  it('Sign In: Redirects to ToS if not accepted', function () {
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: duosUser }).as('getMe')
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@getMe').then(() => {
      cy.location('pathname').should('eq', '/tos_acceptance')
    })
  })

  it('Sign In: Registers user if not found and redirects to ToS', function () {
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    // Simulate user not found
    cy.stub(User, 'getMe').throws()
    cy.intercept({ method: 'POST', url: '**/api/user' }, { statusCode: 200, body: duosUser }).as('registerUser')
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@registerUser').then(() => {
      cy.location('pathname').should('eq', '/tos_acceptance')
    })
  })

  it('Sign In: Button is disabled when SAM is unhealthy', function () {
    cy.stub(ServiceStatus, 'isSamHealthy').resolves(false)
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').should('exist').and('be.disabled')
  })

  it('Sign In: Button is disabled when Consent is unhealthy', function () {
    cy.stub(ServiceStatus, 'isConsentHealthy').resolves(false)
    cy.mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').should('exist').and('be.disabled')
  })
})
