import React from 'react'
import { mount } from 'cypress/react'
import DataCustodianTable from 'src/pages/signing_official_console/DataCustodianTable'

const dpaHeaderText = 'BROAD DATA USE OVERSIGHT SYSTEM (DUOS) - DATA PROVIDER AGREEMENT'

describe('DataCustodianTable - Tests', function () {
  it('Issue modal displays the DPA Text', function () {
    cy.viewport(600, 300)
    mount(
      <DataCustodianTable
        isLoading={false}
        signingOfficial={{ institutionId: 1 }}
        researchers={[
          {
            email: 'email',
            userId: 1,
            displayName: 'researcher',
            roles: [{ name: 'Researcher' }],
          },
        ]}
        unregisteredResearchers={[]}
      />,
    )
    cy.get('button').last().should('exist').click()
    cy.contains(dpaHeaderText).should('exist')
  })
})
