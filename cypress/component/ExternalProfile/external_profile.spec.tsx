import React from 'react'
import ExternalProfile from 'src/pages/user_profile/ExternalProfile'

describe('ExternalProfile', () => {
  const userData = {
    externalProfiles: {
      ORCID: '12345',
      linkedIn: 'abcdef',
      otherUrls: [
        'https://www.aol.com',
      ],
      throughBio: 'abc',
      institutionalWebsite: 'https://www.broadinstitute.org',
    },
  }

  const mockData = {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    userData: userData }

  const mockExternalProfilePropsForEdit = {
    userId: 0,
    readonly: false,
  }

  const mockExternalProfilePropsForReadOnly = {
    userId: 1,
    readonly: true,
  }

  beforeEach(() => {
    cy.initApplicationConfig()
    cy.intercept('GET', '**api/user/**', (req) => {
      req.reply({
        delay: 0,
        body: mockData,
      })
    }).as('getUser')
  })

  it('Renders update table with three columns', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('table thead tr th').should('have.length', 3)
  })

  it('Renders read-only table with two columns', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForReadOnly} />)
    cy.wait('@getUser')
    cy.get('btn-secondary').should('not.exist')
    cy.get('btn-primary').should('not.exist')
    cy.get('input').should('not.exist')
    cy.get('a').should('have.length', 5)
  })

  it('Allows updates', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('input[name="linkedIn"]').should('not.be.disabled')
  })

  it('Performs URL validation for LinkedIn', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('input[name="linkedIn"]').clear()
    cy.get('input[name="linkedIn"]').type('testing')
    cy.get('[href="https://www.linkedin.com/in/testing"]').should('have.attr', 'href')
  })

  it('Performs URL validation for ORCID iD', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('input[name="ORCID"]').clear()
    cy.get('input[name="ORCID"]').type('testing')
    cy.get('[href="https://orcid.org/testing"]').should('have.attr', 'href')
  })

  it('Performs URL validation for Through.bio', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('input[name="throughBio"]').clear()
    cy.get('input[name="throughBio"]').type('testing')
    cy.get('[href="https://through.bio/testing"]').should('have.attr', 'href')
  })

  it('Performs URL validation for Institutional Website', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('input[name="Institutional Website"]').clear()
    cy.get('input[name="Institutional Website"]').type('https://www.institution.edu/~username')
    cy.get('[href="https://www.institution.edu/~username"]').should('have.attr', 'href')
  })

  it('Performs URL validation for Other URLs', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('.btn-secondary').click()
    cy.get('input[name="Other URL 1"]').clear()
    cy.get('input[name="Other URL 1"]').type('https://www.test.com')
    cy.get('[href="https://www.test.com"]').should('have.attr', 'href')
  })

  it('Save button is disabled when there are invalid URLs', () => {
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('.btn-secondary').click()
    cy.get('input[name="Other URL 1"]').clear()
    cy.get('input[name="Other URL 1"]').type('not a url')
    cy.get('.btn-primary').should('be.disabled')
  })

  it('Error displays when update fails', () => {
    cy.intercept({ method: 'POST', url: 'api/user' }, { statusCode: 500 }).as('requestFail')
    cy.mount(<ExternalProfile {...mockExternalProfilePropsForEdit} />)
    cy.wait('@getUser')
    cy.get('.btn-primary').should('be.enabled').click()
  })
})
