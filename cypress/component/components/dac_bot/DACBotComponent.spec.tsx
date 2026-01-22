import React from 'react'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'

describe('DACBotComponent', () => {
  const mockRules = [
    {
      id: 1,
      ruleType: 'REQUIRE_SO_DAR_APPROVAL',
      description: 'Require SO approval for data access',
      ruleState: 'AVAILABLE',
      activationDate: Date.now(),
      enabledByUserId: 1,
      displayName: 'Test User',
      userEmail: 'testuser@example.com',
    },
    {
      id: 2,
      ruleType: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
      description: 'Auto open DAR for all members',
      ruleState: 'AVAILABLE',
      activationDate: 0,
      enabledByUserId: null,
      displayName: null,
      userEmail: null,
    },
  ]

  beforeEach(() => {
    // Mock the user to be a chair so checkboxes are enabled
    cy.stub(Storage, 'getCurrentUser').returns({
      roles: [{ dacId: 1, name: 'Chairperson' }],
    })
    cy.stub(DAC, 'fetchDACbotRules').resolves(mockRules)
    cy.stub(DAC, 'toggleDACbotRule').resolves({
      ruleId: 1,
      isRuleEnabled: true,
      enabledTime: Date.now(),
      displayName: 'Test User',
      email: 'test@example.com',
    })
    cy.mount(
      <DACBotComponent
        dacId={1}
        mutuallyExclusiveRules={{
          REQUIRE_SO_DAR_APPROVAL: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
          AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'REQUIRE_SO_DAR_APPROVAL',
        }}
      />,
    )
  })

  it('should render component with heading and description', () => {
    cy.contains('h4', 'Rule Automated Data Access Request (RADAR) Settings').should('be.visible')
    cy.contains('p', 'Data Access Committees may automate Data Access Requests').should('be.visible')
  })

  it('should display all rules from API', () => {
    cy.get('[id="1_checkbox"]').should('exist')
    cy.get('[id="2_checkbox"]').should('exist')
  })

  it('should disable exclusive rule checkbox when other is enabled', () => {
    cy.get('[id="2_checkbox"]').should('be.disabled')
  })

  it('should call toggleDACbotRule API when checkbox is clicked', () => {
    cy.get('[id="1_checkbox"]').click()
    cy.wrap(DAC.toggleDACbotRule).should('have.been.called')
  })

  it('should display enabled rule info with user details', () => {
    cy.contains('Enabled by:').should('be.visible')
    cy.contains('Test User').should('be.visible')
  })
})
