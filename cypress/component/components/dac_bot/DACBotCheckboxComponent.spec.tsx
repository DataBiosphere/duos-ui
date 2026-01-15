import React from 'react'
import { DACBotCheckboxComponent } from 'src/components/dac_bot/DACBotCheckboxComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { ParsedDACbotRule } from 'src/components/dac_bot/DACBotComponent'

describe('DACBotCheckboxComponent', () => {
  const mockRule = {
    id: 1,
    ruleType: 'REQUIRE_SO_DAR_APPROVAL',
    description: 'Require Signing Official approval for all data access requests',
    ruleState: 'AVAILABLE',
    activationDate: 0,
    enabledByUserId: null,
    displayName: null,
    userEmail: null,
    exclusiveRuleType: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
    isDisabled: false,
  } as ParsedDACbotRule

  const mockEnabledRule = {
    ...mockRule,
    enabledByUserId: 123,
    activationDate: Date.now(),
    displayName: 'John Doe',
    userEmail: 'john@example.com',
  }

  beforeEach(() => {
    cy.stub(DAC, 'toggleDACbotRule').resolves({
      ruleId: 1,
      isRuleEnabled: true,
      enabledTime: Date.now(),
      displayName: 'Test User',
      email: 'test@example.com',
    })
  })

  it('should render checkbox with rule description', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={false}
      />,
    )
    cy.contains('Require Signing Official approval').should('be.visible')
  })

  it('should be disabled when disableEdit is true', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={true}
      />,
    )
    cy.get('[id="1_checkbox"]').should('be.disabled')
  })

  it('should be enabled when disableEdit is false', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={false}
      />,
    )
    cy.get('[id="1_checkbox"]').should('not.be.disabled')
  })

  it('should display enabled user info when rule is enabled', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockEnabledRule}
        disableEdit={false}
      />,
    )
    cy.contains('Enabled by:').should('be.visible')
    cy.contains('John Doe').should('be.visible')
    cy.contains('a', 'John Doe').should('have.attr', 'href', 'mailto:john@example.com')
  })

  it('should not display enabled user info when rule is disabled', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={false}
      />,
    )
    cy.contains('Enabled by:').should('not.exist')
  })

  it('should call onRuleChange callback when checkbox is clicked', () => {
    const onRuleChange = cy.stub()
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={false}
        onRuleChange={onRuleChange}
      />,
    )
    cy.get('[id="1_checkbox"]').click()
    cy.wrap(onRuleChange).should('have.been.called')
  })

  it('should show success notification on successful toggle', () => {
    cy.mount(
      <DACBotCheckboxComponent
        dacId={1}
        rule={mockRule}
        disableEdit={false}
      />,
    )
    cy.get('[id="1_checkbox"]').click()
    cy.contains('Automation rule successfully saved.').should('be.visible')
  })
})
