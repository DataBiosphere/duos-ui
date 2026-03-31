import React from 'react'
import RequestForm from 'src/pages/user_profile/RequestForm'
import { BrowserRouter } from 'react-router-dom'
import { Storage } from 'src/libs/storage'

describe('SupportRequestsPage Tests', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
    cy.stub(Storage, 'getCurrentUser').returns({
      displayName: 'name',
      email: 'user@test.com',
      emailPreference: true,
      id: 1,
    })
    cy.initApplicationConfig()
    cy.mount(
      <BrowserRouter><RequestForm /></BrowserRouter>,
    )
  })

  it('Renders all form elements', () => {
    cy.get('[data-cy="supportRequestForm"]').should('exist')
    // Note that for the following selectors, each one is a `FormField` components that does not allow a data-cy property
    cy.get('[id="checkRegisterDataset"]').should('exist')
    cy.get('[id="checkSOPermissions"]').should('exist')
    cy.get('[id="checkJoinDac"]').should('exist')
    cy.get('[id="extraRequest"]').should('exist')
    cy.get('[data-cy="backButton"]').should('be.enabled')
    cy.get('[data-cy="submitButton"]').should('be.disabled')
  })

  it('Allows for submission when form is filled out', () => {
    cy.get('[id="checkRegisterDataset"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled')
    cy.get('[id="checkRegisterDataset"]').uncheck()
    cy.get('[data-cy="submitButton"]').should('be.disabled')

    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled')
    cy.get('[id="checkSOPermissions"]').uncheck()
    cy.get('[data-cy="submitButton"]').should('be.disabled')

    cy.get('[id="checkJoinDac"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled')
    cy.get('[id="checkJoinDac"]').uncheck()
    cy.get('[data-cy="submitButton"]').should('be.disabled')

    cy.get('[id="extraRequest"]').type('Extra Request')
    // Note that the UI currently does not allow submission without a checkbox selected
    cy.get('[data-cy="submitButton"]').should('be.disabled')

    // Test actual submission
    cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 201 }).as('request')
    cy.get('[id="checkRegisterDataset"]').check()
    cy.get('[data-cy="submitButton"]').click()
    cy.wait(['@request']).then((interception) => {
      cy.wrap(interception).should('not.be.null')
    })
  })

  it('shows external profile URL fields when SO Permissions is checked', () => {
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[id="linkedInProfileUrl"]').should('exist')
    cy.get('[id="orcIdProfileUrl"]').should('exist')
    cy.get('[id="throughBioProfileUrl"]').should('exist')
    cy.get('[id="institutionalProfileUrl"]').should('exist')
  })

  it('prevents submission if no external profile URL is filled', () => {
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled').click()
    cy.get('[role="alert"]').should('contain', 'Please provide at least one external profile URL')
  })

  it('allows submission if at least one external profile URL is filled', () => {
    cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 201 }).as('request')
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[id="linkedInProfileUrl"]').type('https://linkedin.com/in/testuser')
    cy.get('[data-cy="submitButton"]').should('be.enabled').click()
    cy.wait(['@request']).then((interception) => {
      cy.wrap(interception).should('not.be.null')
    })
  })
})
