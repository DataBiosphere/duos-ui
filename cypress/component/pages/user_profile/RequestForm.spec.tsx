import React from 'react'
import RequestForm from 'src/pages/user_profile/RequestForm'
import { BrowserRouter } from 'react-router-dom'
import { Storage } from 'src/libs/storage'

describe('SupportRequestsPage Tests', () => {
  beforeEach(() => {
    // Clean up lingering toast notifications from previous tests
    cy.get('body').then(($body) => {
      $body.find('[role="alert"]').each((_, el) => {
        el.remove()
      })
    })

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

  it('Shows error notification on failed submission', () => {
    cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 500 }).as('requestFail')
    cy.get('[id="checkRegisterDataset"]').check()
    cy.get('[data-cy="submitButton"]').click()
    cy.wait(['@requestFail'])
    cy.contains('ERROR 500 : Unable To Send Requests').should('exist')
  })

  it('Allows multiple checkbox selection and submits correct data', () => {
    cy.get('[id="checkRegisterDataset"]').check()
    cy.get('[id="checkJoinDac"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled')
    cy.intercept({ method: 'POST', url: '**/support/request' }, (req) => {
      expect(req.body.description).to.include('Register a dataset')
      expect(req.body.description).to.include('join a DAC')
      req.reply({ statusCode: 201 })
    }).as('multiRequest')
    cy.get('[data-cy="submitButton"]').click()
    cy.wait(['@multiRequest'])
  })

  it('Does not allow submission with only extra request text', () => {
    cy.get('[id="extraRequest"]').type('Extra only')
    cy.get('[data-cy="submitButton"]').should('be.disabled')
  })

  it('Includes extra request text in submission', () => {
    cy.get('[id="checkJoinDac"]').check()
    cy.get('[id="extraRequest"]').type('Extra details here')
    cy.intercept({ method: 'POST', url: '**/support/request' }, (req) => {
      expect(req.body.description).to.include('Extra details here')
      req.reply({ statusCode: 201 })
    }).as('extraRequest')
    cy.get('[data-cy="submitButton"]').click()
    cy.wait(['@extraRequest'])
  })

  it('Disables submit button during submission', () => {
    cy.get('[id="checkJoinDac"]').check()
    // Simulate slow response
    cy.intercept(
      { method: 'POST', url: '**/support/request' },
      { statusCode: 201, delay: 1000 },
    ).as('slowRequest')
    cy.get('[data-cy="submitButton"]').click()
    cy.get('[data-cy="submitButton"]').should('be.disabled')
    cy.wait(['@slowRequest'])
  })

  it('Navigates away when Back button is clicked', () => {
    cy.get('[data-cy="backButton"]').click()
    cy.url().should('include', '/profile')
  })

  it('shows external profile URL fields when SO Permissions is checked', () => {
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[id="linkedIn"]').should('exist')
    cy.get('[id="ORCID"]').should('exist')
    cy.get('[id="throughDotBio"]').should('exist')
    cy.get('[id="institutionalWebsite"]').should('exist')
  })

  it('prevents submission if no external profile URL is filled', () => {
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[data-cy="submitButton"]').should('be.enabled').click()
    cy.get('[role="alert"]').should('contain', 'Please provide at least one external profile URL')
  })

  it('prevents submission if none URL is filled', () => {
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[id="linkedIn"]').type('non-url text')
    cy.get('[data-cy="submitButton"]').should('be.enabled').click()
    cy.get('[role="alert"]').should('contain', 'Please provide at least one external profile URL')
  })

  it('allows submission if at least one external profile URL is filled', () => {
    cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 201 }).as('request')
    cy.get('[id="checkSOPermissions"]').check()
    cy.get('[id="linkedIn"]').type('https://linkedin.com/in/testuser')
    cy.get('[data-cy="submitButton"]').should('be.enabled').click()
    cy.wait(['@request']).then((interception) => {
      cy.wrap(interception).should('not.be.null')
    })
  })
})
