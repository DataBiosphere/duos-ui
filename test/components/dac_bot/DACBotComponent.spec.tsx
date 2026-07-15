import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'

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

    let container: HTMLElement

    beforeEach(async () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ roles: [{ dacId: 1, name: 'Chairperson' }] } as never)
      vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue(mockRules as never)
      vi.spyOn(DAC, 'toggleDACbotRule').mockResolvedValue({
        ruleId: 1, isRuleEnabled: true, enabledTime: Date.now(), displayName: 'Test User', email: 'test@example.com',
      } as never)
      vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
      const result = render(
        <DACBotComponent
          dacId={1}
          mutuallyExclusiveRules={{
            REQUIRE_SO_DAR_APPROVAL: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS',
            AUTO_OPEN_DAR_FOR_ALL_MEMBERS: 'REQUIRE_SO_DAR_APPROVAL',
          }}
        />,
      )
      container = result.container
      await waitFor(() => expect(document.getElementById('1_checkbox')).toBeInTheDocument())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should render component with heading and description', () => {
      expect(screen.getByText(/Data Access Committees may automate Data Access Requests/)).toBeInTheDocument()
    })

    it('should display all rules from API', () => {
      expect(document.getElementById('1_checkbox')).toBeInTheDocument()
      expect(document.getElementById('2_checkbox')).toBeInTheDocument()
    })

    it('should disable exclusive rule checkbox when other is enabled', () => {
      expect(document.getElementById('2_checkbox')).toBeDisabled()
    })

    it('should call toggleDACbotRule API when checkbox is clicked', async () => {
      await userEvent.click(document.getElementById('1_checkbox')!)
      await waitFor(() => expect(DAC.toggleDACbotRule).toHaveBeenCalled())
    })

    it('should display enabled rule info with user details', () => {
      expect(screen.getByText(/Enabled by:/)).toBeInTheDocument()
      expect(container).toHaveTextContent('Test User')
    })
  })

  describe('rule grouping', () => {
    const allRules = [
      { id: 1, ruleType: 'GRU_V1', description: `Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.`, ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 2, ruleType: 'HMB_V1', description: `Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **Health/Medical/Biomedical Use (HMB)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.`, ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 3, ruleType: 'GRU_DSV1', description: `Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Disease Specific (DS) with one or more selected diseases** with no ethical concerns designated.`, ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 4, ruleType: 'HMB_DSV1', description: `Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **Health/Medical/Biomedical Use (HMB)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Disease Specific (DS) with one or more selected diseases** only with no ethical concerns designated.`, ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 5, ruleType: 'AUTO_OPEN_DAR_FOR_ALL_MEMBERS', description: 'Automatically open Data Access Requests (DARs) for all DAC members upon submission, **without requiring Chair to open manually**.', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 6, ruleType: 'REQUIRE_SO_DAR_APPROVAL', description: 'Require approval by the Signing Official identified in the Data Access Request (DAR) prior to DAC Voting.', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
    ]

    let container: HTMLElement

    beforeEach(async () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ roles: [{ dacId: 1, name: 'Chairperson' }] } as never)
      vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue(allRules as never)
      vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
      const result = render(<DACBotComponent dacId={1} />)
      container = result.container
      await waitFor(() => expect(document.getElementById('1_checkbox')).toBeInTheDocument())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('renders a heading for each group', () => {
      expect(screen.getByRole('heading', { level: 4, name: 'Automatically approve DARs when...' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 4, name: 'Send DARs to the entire DAC on submission by researchers?' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 4, name: 'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?' })).toBeInTheDocument()
    })

    it('places GRU_V1, HMB_V1, GRU_DSV1, HMB_DSV1 under Automatic approval', () => {
      const group = container.querySelector('[data-cy="rule-group-automatic-approval"]') as HTMLElement
      expect(group).toHaveTextContent('only General Research Use (GRU)')
      expect(group).toHaveTextContent('only Health/Medical/Biomedical Use (HMB)')
      expect(group).toHaveTextContent('Disease Specific (DS) with one or more selected diseases')
      expect(group).not.toHaveTextContent('without requiring Chair to open manually')
      expect(group).not.toHaveTextContent('Require approval by the Signing Official')
    })

    it('places AUTO_OPEN_DAR_FOR_ALL_MEMBERS under Automatic open', () => {
      const group = container.querySelector('[data-cy="rule-group-automatic-open"]') as HTMLElement
      expect(group).toHaveTextContent('without requiring Chair to open manually')
      expect(group).not.toHaveTextContent('only General Research Use (GRU)')
      expect(group).not.toHaveTextContent('Disease Specific (DS) with one or more selected diseases')
      expect(group).not.toHaveTextContent('Require approval by the Signing Official')
    })

    it('places REQUIRE_SO_DAR_APPROVAL under SO prior approval', () => {
      const group = container.querySelector('[data-cy="rule-group-so-prior-approval"]') as HTMLElement
      expect(group).toHaveTextContent('require approval by the Signing Official')
      expect(group).not.toHaveTextContent('only General Research Use (GRU)')
      expect(group).not.toHaveTextContent('Disease Specific (DS) with one or more selected diseases')
      expect(group).not.toHaveTextContent('without requiring Chair to open manually')
    })

    it('renders groups in order: Automatically approve DARs when..., Send DARs..., Require SO sign-off', () => {
      const headings = screen.getAllByRole('heading', { level: 4 })
      const labels = headings.map(h => h.textContent)
      expect(labels).toEqual([
        'Automatically approve DARs when...',
        'Send DARs to the entire DAC on submission by researchers?',
        'Require researchers\' Signing Officials to sign-off on DARs and DAAs, prior to the DAC recieving the DAR?',
      ])
    })
  })

  describe('rule grouping - unknown ruleType', () => {
    const rulesWithUnknown = [
      { id: 1, ruleType: 'GRU_V1', description: `Automatically approve Data Access Requests (DARs) when the requested datasets' data use term is only **General Research Use (GRU)** with no modifiers (i.e. IRB, COL, GSO, NPU etc.), and the primary purpose of the DAR's research use statement (RUS) is **Health/Medical/Biomedical Use (HMB)** only with no ethical concerns designated.`, ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
      { id: 2, ruleType: 'FUTURE_RULE', description: 'Some future rule', ruleState: 'AVAILABLE', activationDate: 0, enabledByUserId: null, displayName: null, userEmail: null },
    ]

    let container: HTMLElement

    beforeEach(async () => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ roles: [{ dacId: 1, name: 'Chairperson' }] } as never)
      vi.spyOn(DAC, 'fetchDACbotRules').mockResolvedValue(rulesWithUnknown as never)
      vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
      const result = render(<DACBotComponent dacId={1} />)
      container = result.container
      await waitFor(() => expect(document.getElementById('1_checkbox')).toBeInTheDocument())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('places rules with unknown ruleType in an Other group at the end', () => {
      const headings = screen.getAllByRole('heading', { level: 4 })
      expect(headings[headings.length - 1]).toHaveTextContent('Other')
      const otherGroup = container.querySelector('[data-cy="rule-group-other"]') as HTMLElement
      expect(within(otherGroup).getByText(/Some future rule/)).toBeInTheDocument()
    })
  })
})
