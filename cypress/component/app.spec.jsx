import React from 'react'
import { mount } from 'cypress/react'
import App from 'src/App'
import ReactGA from 'react-ga4'
import StackdriverReporter from 'src/libs/stackdriverReporter'
import { Config } from 'src/libs/config'
import { MemoryRouter, Route } from 'react-router-dom'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH.js'
import { Storage } from 'src/libs/storage'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router'

const user = {
  userId: 2,
  displayName: 'Admin',
  institution: {
    id: 150,
    name: 'The Broad Institute of MIT and Harvard',
  },
  roles: [
    {
      userId: 2,
      roleId: 4,
      name: 'Admin',
    },
  ],
}

const linkInfo = {
  externalUserId: 'externalUserId',
  expirationTimestamp: '2023-10-01T00:00:00Z',
  authenticated: true,
  additionalState: {
    redirectTo: 'http://localhost:3000/profile',
  },
}

const code = 'code'
const state = 'state'
const initialLocation = {
  pathname: '/',
  search: `?code=${code}&state=${state}`,
}

describe('Main App Functions', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
    cy.initApplicationConfig()
    cy.stub(ReactGA, 'send')
    cy.stub(ReactGA, 'initialize')
    cy.stub(StackdriverReporter, 'start')
    cy.stub(Config, 'getGAId').returns('UA-12345678-1')
    cy.stub(Storage, 'setCurrentUser')
  })

  it('should render main layout components on the home page', () => {
    mount(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    cy.get('.body').should('exist')
    cy.get('.wrap').should('exist')
    cy.get('.main').should('exist')
    cy.get('.body').contains('Data Use Oversight System').should('exist')
  })

  it ('should initialize ReactGA and StackdriverReporter', () => {
    mount(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    cy.wrap(ReactGA.initialize).should('have.been.calledOnceWith', 'UA-12345678-1')
    cy.wrap(StackdriverReporter.start).should('have.been.calledOnce')
  })

  it('should displays an error when ECM fails', () => {
    cy.stub(AuthenticateNIH, 'getECMProviderLinkInfo').throws(new Error('Authentication failed'))
    mount(
      <MemoryRouter initialEntries={[initialLocation]}>
        <App />
      </MemoryRouter>,
    )
    cy.wrap(AuthenticateNIH.getECMProviderLinkInfo).should('have.been.calledWith', code, state)
    cy.get('[data-cy="notification-alert"]').should('be.visible')
  })

  it('should displays an error when account syncing fails', () => {
    cy.stub(AuthenticateNIH, 'getECMProviderLinkInfo').returns(linkInfo)
    cy.stub(AuthenticateNIH, 'getSyncedUser').throws(new Error('Authentication failed'))
    mount(
      <MemoryRouter initialEntries={[initialLocation]}>
        <App />
      </MemoryRouter>,
    )
    cy.get('[data-cy="notification-alert"]').should('be.visible')
  })

  it('should process RAS query params (code, state) and navigate to the profile page when the parameter specifies it', () => {
    cy.stub(AuthenticateNIH, 'getECMProviderLinkInfo').returns(linkInfo)
    cy.stub(AuthenticateNIH, 'getSyncedUser').returns(user)
    const pageVisitStub = cy.stub()
    const history = createMemoryHistory()
    mount(
      <Router history={history}>
        <Route
          path="*"
          render={({ history }) => {
            pageVisitStub(history.location.pathname)
            return <div>Page</div>
          }}
        />
        <App />
      </Router>,
    )
    history.push(initialLocation)
    cy.wrap(AuthenticateNIH.getECMProviderLinkInfo).should('have.been.calledWith', code, state)
    cy.wrap(AuthenticateNIH.getSyncedUser).should('have.been.calledOnce')
    // Endure that we've navigated to both the home page and the profile page
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/')
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/profile')
  })
})
