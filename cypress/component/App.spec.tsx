import React from 'react'
import App from 'src/App'
import StackdriverReporter from 'src/libs/stackdriverReporter'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { Storage } from 'src/libs/storage'
import { createMemoryHistory } from 'history'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'

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
    cy.stub(StackdriverReporter, 'start')
    cy.stub(Storage, 'setCurrentUser')
    cy.stub(ServiceStatus, 'getConsentStatus').returns(Promise.resolve(
      {
        ok: true,
        degraded: false,
        systems: {
          deadlocks: {
            healthy: true,
            time: 1756131889372,
            duration: 1,
          },
          sam: {
            healthy: true,
            details: {
              ok: true,
              systems: {
                Database: {
                  ok: true,
                },
              },
            },
            time: 1756131889372,
            duration: 0,
          },
          sendgrid: {
            healthy: true,
            details: {
              page: {
                id: '3tgl2vf85cht',
                name: 'SendGrid',
                url: 'https://status.sendgrid.com',
                time_zone: 'America/Los_Angeles',
                updated_at: '2025-08-25T07:16:01.435-07:00',
              },
              status: {
                indicator: 'none',
                description: 'All Systems Operational',
              },
            },
            time: 1756131889372,
            duration: 0,
          },
        },
      }))

    cy.stub(ServiceStatus, 'getOntologyStatus').returns(Promise.resolve({
      ok: true,
      degraded: false,
      systems: {
        'elastic-search': {
          healthy: true,
          message: 'ClusterHealth is GREEN',
          error: null,
          details: null,
          time: 1756131890182,
          duration: 4,
          timestamp: '2025-08-25T14:24:50.182Z',
        },
      },
    },
    ))
  })

  it('should render main layout components on the home page', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    cy.get('.body').should('exist')
    cy.get('.wrap').should('exist')
    cy.get('.main').should('exist')
    cy.get('.body').contains('Data Use Oversight System').should('exist')
  })

  it('should initialize StackdriverReporter', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    cy.wrap(StackdriverReporter.start).should('have.been.calledOnce')
  })

  it('should display an error when ECM fails', () => {
    cy.stub(AuthenticateNIH, 'getECMProviderLinkInfo').throws(new Error('Authentication failed'))
    cy.mount(
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
    cy.mount(
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
    const LocationSpy = ({ onLocationChange }: { onLocationChange: (pathname: string) => void }) => {
      const location = useLocation()
      React.useEffect(() => {
        onLocationChange(location.pathname)
      }, [location, onLocationChange])
      return null
    }
    const history = createMemoryHistory()
    cy.mount(
      <MemoryRouter initialEntries={[initialLocation]}>
        <LocationSpy onLocationChange={pageVisitStub} />
        <App />
      </MemoryRouter>,
    )
    history.push(initialLocation)
    cy.wrap(AuthenticateNIH.getECMProviderLinkInfo).should('have.been.calledWith', code, state)
    cy.wrap(AuthenticateNIH.getSyncedUser).should('have.been.calledOnce')
    // Endure that we've navigated to both the home page and the profile page
    cy.wrap(pageVisitStub).should('have.been.calledWith', '/')
    cy.wrap(pageVisitStub).should('have.been.calledWith', history.location.pathname)
  })
})
