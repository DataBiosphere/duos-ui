import { mount } from 'cypress/react'
import React from 'react'
import { ResearcherReview } from 'src/components/ResearcherReview'
import { DuosUser } from 'src/types/model'

const baseUser: DuosUser = {
  displayName: 'John Doe',
  institution: { name: 'Test University' },
  eraCommonsId: 'JOHNDOE123',
  properties: [
    { propertyKey: 'eraExpiration', propertyValue: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    { propertyKey: 'eraAuthorized', propertyValue: 'true' },
  ],
} as unknown as DuosUser

describe('ResearcherReview', () => {
  const createMockUser = (overrides = {}): DuosUser => ({
    ...baseUser,
    ...overrides,
  } as DuosUser)

  it('Renders user information correctly', () => {
    const user = createMockUser()
    mount(<ResearcherReview user={user} />)

    cy.get('[data-cy="display-name"]').should('contain', baseUser.displayName)
    cy.get('[data-cy="institution-name"]').should('contain', baseUser.institution?.name)
    cy.get('[data-cy="era-commons-id"]').should('contain', baseUser.eraCommonsId)
    cy.get('[data-cy="nih-valid"]').should('contain', 'Authorized')
    cy.get('[data-cy="nih-expiration"]').should('contain', '30 days remaining')
  })

  it('Displays "Not Authorized" when NIH is invalid', () => {
    const user = createMockUser({
      properties: [
        { propertyKey: 'eraAuthorized', propertyValue: 'false' },
      ],
    })
    mount(<ResearcherReview user={user} />)

    cy.get('[data-cy="nih-valid"]').should('contain', 'Not Authorized')
  })

  it('Displays "Expired" when NIH authentication has expired', () => {
    const user = createMockUser({
      properties: [
        { propertyKey: 'eraExpiration', propertyValue: Date.now() - 1000 },
      ],
    })
    mount(<ResearcherReview user={user} />)

    cy.get('[data-cy="nih-expiration"]').should('contain', 'Expired')
  })

  it('Handles missing user data gracefully', () => {
    const user = createMockUser({
      displayName: null,
      institution: null,
      eraCommonsId: null,
      properties: [],
    })
    mount(<ResearcherReview user={user} />)

    cy.get('[data-cy="display-name"]').should('be.empty')
    cy.get('[data-cy="institution-name"]').should('be.empty')
    cy.get('[data-cy="era-commons-id"]').should('be.empty')
    cy.get('[data-cy="nih-valid"]').should('contain', 'Not Authorized')
    cy.get('[data-cy="nih-expiration"]').should('contain', 'Expired')
  })
})
