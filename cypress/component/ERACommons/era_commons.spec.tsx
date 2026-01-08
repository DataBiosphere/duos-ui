import ERACommons from 'src/components/era_commons/ERACommons'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { mount } from 'cypress/react'
import React from 'react'

interface Researcher {
  id: number
  firstName: string
  lastName: string
  email: string
  eraCommonsId?: string
  properties?: Array<{ propertyKey: string, propertyValue: string | number }>
}

const researcher: Researcher = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@email.com',
}

describe('ERA Commons Component', function () {
  it('renders an empty ERA Commons component with header and required', function () {
    cy.stub(User, 'getMe').returns(researcher)
    mount(
      <ERACommons
        destination=""
        header={true}
        onNihStatusUpdate={() => {}}
        required={true} // Triggers the required flag on the NIH eRA Commons ID
        validationError={false}
      />,
    )
    cy.get('#era-commons-id').should('exist')
    cy.get('[data-cy=era-commons-header]').should('exist')
    cy.get('[data-cy=era-commons-required]').should('exist')
    cy.get('[data-cy=era-commons-authenticate-link]').should('exist')
    cy.get('.required-field-error-span').should('not.exist')
  })

  it('renders a populated ERA Commons component after having authenticated with NIH', function () {
    const clonedResearcher: Researcher = { ...researcher }
    clonedResearcher.eraCommonsId = 'testing'
    const iat = new Date().getTime()
    const exp = iat + (30 * 24 * 60 * 60 * 1000) // iat + 30 days
    clonedResearcher.properties = [
      { propertyKey: 'eraAuthorized', propertyValue: 'true' },
      { propertyKey: 'eraExpiration', propertyValue: exp },
    ]
    cy.stub(User, 'getMe').returns(clonedResearcher)
    mount(
      <ERACommons
        destination=""
        header={true}
        onNihStatusUpdate={() => {}}
        required={true}
        validationError={false}
      />,
    )
    cy.get('#era-commons-id').should('exist')
    cy.get('[data-cy=era-commons-header]').should('exist')
    cy.get('[data-cy=era-commons-required]').should('exist')
    cy.get('[data-cy=era-commons-authenticate-link]').should('not.exist')
    cy.get('[data-cy=era-commons-id-value]').should('exist')
    cy.get('.required-field-error-span').should('not.exist')
  })

  it('shows an error when auth token decoding fails', function () {
    mount(
      <ERACommons
        destination=""
        header={true}
        onNihStatusUpdate={() => {}}
        required={true} // Triggers the required flag on the NIH eRA Commons ID
        validationError={false}
      />,
    )
    cy.get('[data-cy=era-commons-authenticate-link]').should('exist')
    cy.get('[data-cy=era-commons-authenticate-link]').click()
    cy.get('[data-cy=era-commons-error-span]').should('be.visible')
  })

  it('shows an error when removing linked account fails', function () {
    const eraAuthedUser: Researcher = {
      ...researcher,
      eraCommonsId: 'testing',
      properties: [
        { propertyKey: 'eraAuthorized', propertyValue: 'true' },
        { propertyKey: 'eraExpiration', propertyValue: Date.now() + (30 * 24 * 60 * 60 * 1000) }, // iat + 30 days
      ],
    }
    cy.stub(User, 'getMe').returns(eraAuthedUser)
    mount(
      <ERACommons
        destination=""
        header={true}
        onNihStatusUpdate={() => {}}
        required={true}
        validationError={false}
      />,
    )
    cy.stub(AuthenticateNIH, 'deleteAccountLinkage').throws(new Error('error'))
    cy.get('[data-cy=era-delete-icon]').should('exist')
    cy.get('[data-cy=era-delete-icon]').click({ force: true })
    cy.get('[data-cy=era-commons-error-span]').should('be.visible')
  })

  it('shows an error when ECM fails', function () {
    cy.stub(Storage, 'getEnv').returns('dev')
    cy.stub(Storage, 'getCurrentUser').returns(researcher)
    mount(
      <ERACommons
        destination=""
        header={true}
        onNihStatusUpdate={() => {}}
        required={true}
        validationError={false}
      />,
    )
    cy.stub(AuthenticateNIH, 'getECMProviderAuthUrl').throws(new Error('error'))
    cy.get('[data-cy=era-commons-authenticate-link]').should('exist')
    cy.get('[data-cy=era-commons-authenticate-link]').click()
    cy.get('[data-cy=era-commons-error-span]').should('be.visible')
  })
})
