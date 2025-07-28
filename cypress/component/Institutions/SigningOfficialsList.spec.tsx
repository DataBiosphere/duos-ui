import React from 'react'
import { mount } from 'cypress/react'
import { SigningOfficialsList } from 'src/components/institution_table/components/SigningOfficialsList'
import { SimplifiedDuosUser } from 'src/types/model'
import { BrowserRouter } from 'react-router-dom'

describe('Signing Officials List Tests', () => {
  const testSigningOfficials: SimplifiedDuosUser[] = [
    {
      userId: 1,
      displayName: 'John Doe',
      email: 'john.doe@example.com',
    },
    {
      userId: 2,
      displayName: 'Jane Smith',
      email: 'jane.smith@example.org',
    },
  ]

  beforeEach(() => {
    cy.viewport(1000, 600)
  })

  it('should render the signing officials list', () => {
    mount(<BrowserRouter><SigningOfficialsList signingOfficials={testSigningOfficials} /></BrowserRouter>)

    cy.contains('Signing Officials').should('be.visible')
    cy.contains('Administrators can manage Signing Officials from the Manage Users page by assigning or removing the "Signing Official" role for users associated with this institution.').should('be.visible')

    cy.get('input').each(($input) => {
      cy.wrap($input).should('have.attr', 'readonly')
      cy.wrap($input).should('be.disabled')
    })
  })

  it('should show message when no signing officials', () => {
    mount(<BrowserRouter><SigningOfficialsList signingOfficials={[]} /></BrowserRouter>)

    cy.contains('This institution does not have any Signing Officials').should('be.visible')
  })

  it('should display correct signing official information', () => {
    mount(<BrowserRouter><SigningOfficialsList signingOfficials={testSigningOfficials} /></BrowserRouter>)

    cy.get('input[value="John Doe"]').should('exist')
    cy.get('input[value="john.doe@example.com"]').should('exist')

    cy.get('input[value="Jane Smith"]').should('exist')
    cy.get('input[value="jane.smith@example.org"]').should('exist')
  })
})
