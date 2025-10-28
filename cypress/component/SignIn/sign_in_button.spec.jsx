import React from 'react'
import { mount } from 'cypress/react'
import SignInButton from 'src/components/SignInButton'
import { User } from 'src/libs/ajax/User'
import { Auth } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import { Metrics } from 'src/libs/ajax/Metrics'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { ToS } from 'src/libs/ajax/ToS'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'
import { mockOidcUser } from '../Auth/mockOidcUser'
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

const signInText = 'Sign In'

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
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
}

const userStatus = {
  adminEnabled: true,
  enabled: true,
  inAllUsersGroup: true,
  inGoogleProxyGroup: true,
  tosAccepted: true,
}

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

const notAcceptedUserStatus = Object.assign({}, userStatus, { tosAccepted: false })

describe('Sign In: Component Loads', function () {
  beforeEach(() => {
    cy.viewport(600, 300)
    cy.initApplicationConfig()
    cy.stub(ServiceStatus, 'getConsentStatus').resolves(consentStatus)
  })

  it('Sign In Button Loads', function () {
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.contains(signInText).should('exist')
    cy.get('button').should('exist').and('not.be.disabled')
  })

  it('Sign In: On Success', function () {
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: duosUser }).as('getMe')
    cy.stub(StackdriverReporter, 'report').as('report')
    cy.stub(Metrics, 'identify').as('identify')
    cy.stub(Metrics, 'syncProfile').as('syncProfile')
    cy.stub(Metrics, 'captureEvent').as('captureEvent')
    cy.stub(ToS, 'getStatus').returns(userStatus)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@getMe').then(() => {
      expect(Storage.getCurrentUser()).to.deep.equal(duosUser)
      assert.isNotNull(Storage.getAnonymousId(), 'Anonymous ID should not be null')
      cy.get('@report').should('not.be.called')
      cy.get('@identify').should('be.called')
      cy.get('@syncProfile').should('be.called')
      cy.get('@captureEvent').should('be.called')
    })
  })

  it('Sign In: No Roles Error Reporter Is Called', function () {
    const bareUser = { email: 'test@user.com' }
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: bareUser }).as('getMe')
    cy.stub(StackdriverReporter, 'report').as('report')
    cy.stub(ToS, 'getStatus').returns(userStatus)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@getMe').then(() => {
      cy.get('@report').should('be.called')
    })
  })

  it('Sign In: Redirects to ToS if not accepted', function () {
    cy.stub(Auth, 'signIn').resolves(mockOidcUser)
    cy.intercept({ method: 'GET', url: '**/api/user/me' }, { statusCode: 200, body: duosUser }).as('getMe')
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
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
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').click()
    cy.wait('@registerUser').then(() => {
      cy.location('pathname').should('eq', '/tos_acceptance')
    })
  })

  it('Sign In: Button is disabled when SAM is unhealthy', function () {
    cy.stub(ServiceStatus, 'isSamHealthy').resolves(false)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').should('exist').and('be.disabled')
  })

  it('Sign In: Button is disabled when Consent is unhealthy', function () {
    cy.stub(ServiceStatus, 'isConsentHealthy').resolves(false)
    mount(<BrowserRouter><SignInButton /></BrowserRouter>)
    cy.get('button').should('exist').and('be.disabled')
  })
})
