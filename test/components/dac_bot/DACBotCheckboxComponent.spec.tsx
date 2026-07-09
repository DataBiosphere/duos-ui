import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DACBotCheckboxComponent } from 'src/components/dac_bot/DACBotCheckboxComponent'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { ParsedDACbotRule } from 'src/components/dac_bot/DACBotComponent'

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
} as ParsedDACbotRule

describe('DACBotCheckboxComponent', () => {
  beforeEach(() => {
    vi.spyOn(DAC, 'toggleDACbotRule').mockResolvedValue({
      ruleId: 1,
      isRuleEnabled: true,
      enabledTime: Date.now(),
      displayName: 'Test User',
      email: 'test@example.com',
    } as never)
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => {})
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render checkbox with rule description', () => {
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={vi.fn()} />)
    expect(screen.getByText(/Require Signing Official approval/)).toBeInTheDocument()
  })

  it('should be disabled when disableEdit is true', () => {
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={true} onRuleChange={vi.fn()} />)
    expect(document.getElementById('1_checkbox')).toBeDisabled()
  })

  it('should be enabled when disableEdit is false', () => {
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={vi.fn()} />)
    expect(document.getElementById('1_checkbox')).not.toBeDisabled()
  })

  it('should display enabled user info when rule is enabled', () => {
    render(<DACBotCheckboxComponent rule={mockEnabledRule} disableEdit={false} onRuleChange={vi.fn()} />)
    expect(screen.getByText(/Enabled by:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'John Doe' })).toHaveAttribute('href', 'mailto:john@example.com')
  })

  it('should not display enabled user info when rule is disabled', () => {
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={vi.fn()} />)
    expect(screen.queryByText(/Enabled by:/)).not.toBeInTheDocument()
  })

  it('should call onRuleChange callback when checkbox is clicked', async () => {
    const onRuleChange = vi.fn().mockResolvedValue(undefined)
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={onRuleChange} />)
    await userEvent.click(document.getElementById('1_checkbox')!)
    expect(onRuleChange).toHaveBeenCalled()
  })

  it('should show success notification on successful toggle', async () => {
    const onRuleChange = vi.fn().mockResolvedValue(undefined)
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={onRuleChange} />)
    await userEvent.click(document.getElementById('1_checkbox')!)
    await waitFor(() =>
      expect(Notifications.showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Automation rule successfully saved.' }),
      ),
    )
  })

  it('should revert checkbox if onRuleChange fails', async () => {
    const onRuleChange = vi.fn().mockRejectedValue(new Error('Failed to update'))
    render(<DACBotCheckboxComponent rule={mockRule} disableEdit={false} onRuleChange={onRuleChange} />)
    await userEvent.click(document.getElementById('1_checkbox')!)
    await waitFor(() =>
      expect(Notifications.showError).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Error: Unable to change automation rule. Please try this operation again.' }),
      ),
    )
    expect(document.getElementById('1_checkbox')).not.toBeChecked()
  })
})
