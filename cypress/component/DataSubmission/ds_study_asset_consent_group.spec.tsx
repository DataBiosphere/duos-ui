import React from 'react'
import { ConsentGroupAddEdit } from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { mount } from 'cypress/react'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'

describe('Consent Group', function () {
  it('Edits without saving', function () {
    mount(
      <ConsentGroupAddEdit
        id={0}
        consentGroups={[]}
        closeAction={function (): void {
          throw new Error('Function not implemented.')
        }}
        onConsentGroupChange={function (items: ConsentGroup2[]): void {
          throw new Error('Function not implemented.')
        }}
      />,
    )
    cy.get('#consentGroupName').type('Hello!')
    cy.get('#url').type('https://www.asdf.gov')
  })

  it('Shows conditional fields only when checked', function () {
    mount(
      <ConsentGroupAddEdit
        id={0}
        consentGroups={[]}
        closeAction={function (): void {
          throw new Error('Function not implemented.')
        }}
        onConsentGroupChange={function (items: ConsentGroup2[]): void {
          throw new Error('Function not implemented.')
        }}
      />,
    )

    cy.get('#primaryConsent_generalResearchUse').click()

    cy.get('#gsText').should('not.exist')
    cy.get('#gs').check()
    cy.get('#gsText').should('exist')

    cy.get('#otherSecondaryText').should('not.exist')
    cy.get('#otherSecondary').check()
    cy.get('#otherSecondaryText').should('exist')

    cy.get('#otherPrimaryText').should('not.exist')
    cy.get('#primaryConsent_otherPrimary').check()
    cy.get('#otherPrimaryText').should('exist')

    cy.get('#diseaseSpecificUseText').should('not.exist')
    cy.get('#primaryConsent_diseaseSpecificUse').check()
    cy.get('#diseaseSpecificUseText').should('exist')
  })
})
