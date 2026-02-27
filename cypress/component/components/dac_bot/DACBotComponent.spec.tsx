import React from 'react'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'

describe('DACBotComponent', () => {
  describe('mutual exclusivity rules', () => {
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

  describe('rule grouping', () => {
    const allRules = [
      { id: 1, ruleType: 'GRU_V1', description: "Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.", ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 2, ruleType: 'HMB_V1', description: "Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **Health/Medical/Biomedical Use (HMB)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.", ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 3, ruleType: 'GRU_DSV1', description: "Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Disease Specific (DS) with one or more selected diseases** with no ethical concerns designated.", ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 4, ruleType: 'HMB_DSV1', description: "Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **Health/Medical/Biomedical Use (HMB)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Disease Specific (DS) with one or more selected diseases** only with no ethical concerns designated.", ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 5, ruleType: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS', description: 'Automatically open Data Access Requests (DARs) for all DAC members upon submission, **without requiring Chair to open manually**.', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 6, ruleType: 'REQUIRE_SO_DAR_APPROVAL', description: 'Require approval by the Signing Official identified in the Data Access Request (DAR) prior to DAC Voting.', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
    ]

    beforeEach(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        roles: [{ dacId: 1, name: 'Chairperson' }],
      })
      cy.stub(DAC, 'fetchDACbotRules').resolves(allRules)
      cy.mount(<DACBotComponent dacId={1} />)
    })

    it('renders a heading for each group', () => {
      cy.contains('h6', 'Automatic approval').should('be.visible')
      cy.contains('h6', 'Automatic open').should('be.visible')
      cy.contains('h6', 'SO prior approval').should('be.visible')
    })

    it('places GRU_V1, HMB_V1, GRU_DSV1, HMB_DSV1 under Automatic approval', () => {
      cy.get('[data-cy="rule-group-automatic-approval"]').within(() => {
        cy.contains('only General Research Use (GRU)').should('exist')
        cy.contains('only Health/Medical/Biomedical Use (HMB)').should('exist')
        cy.contains('Disease Specific (DS) with one or more selected diseases').should('exist')
      })
    })

    it('places AUTO_OPEN_DAR_FOR_ALL_MEMBERS under Automatic open', () => {
      cy.get('[data-cy="rule-group-automatic-open"]').within(() => {
        cy.contains('without requiring Chair to open manually').should('exist')
      })
    })

    it('places REQUIRE_SO_DAR_APPROVAL under SO prior approval', () => {
      cy.get('[data-cy="rule-group-so-prior-approval"]').within(() => {
        cy.contains('Require approval by the Signing Official').should('exist')
      })
    })

    it('renders groups in order: Automatic approval, Automatic open, SO prior approval', () => {
      cy.get('h6').then($headings => {
        const labels = [...$headings].map(el => el.textContent)
        expect(labels).to.deep.equal(['Automatic approval', 'Automatic open', 'SO prior approval'])
      })
    })
  })

  describe('rule grouping - unknown ruleType', () => {
    const rulesWithUnknown = [
      { id: 1, ruleType: 'GRU_V1', description: "Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.", ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 2, ruleType: 'FUTURE_RULE', description: 'Some future rule', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
    ]

    beforeEach(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        roles: [{ dacId: 1, name: 'Chairperson' }],
      })
      cy.stub(DAC, 'fetchDACbotRules').resolves(rulesWithUnknown)
      cy.mount(<DACBotComponent dacId={1} />)
    })

    it('places rules with unknown ruleType in an Other group at the end', () => {
      cy.get('h6').last().should('have.text', 'Other')
      cy.get('[data-cy="rule-group-other"]').within(() => {
        cy.contains('Some future rule').should('exist')
      })
    })
  })
})
