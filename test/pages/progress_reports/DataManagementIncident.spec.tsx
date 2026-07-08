import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants'

const baseFormState: Partial<FormState> = {}

function renderComponent(customState: Partial<FormState> = {}, readOnly = false) {
  const onFormChange = vi.fn()
  render(
    <DataManagementIncident
      readOnly={readOnly}
      formState={{ ...baseFormState, ...customState } as FormState}
      onFormChange={onFormChange}
    />,
  )
  return { onFormChange }
}

describe('DataManagementIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the component correctly', () => {
    renderComponent()
    expect(document.querySelector('[data-cy="data-management-incident"]')).toBeInTheDocument()
    expect(screen.getByText('Step 4: Data Management Incident')).toBeInTheDocument()
    expect(screen.getByText('4.1 Data Management Incident')).toBeInTheDocument()
    expect(screen.getByText('Have there been any incidents related to mismanagement or misuse of data?')).toBeInTheDocument()
  })

  it('initially does not show incident details form', () => {
    renderComponent()
    expect(screen.queryByText(/Please select any of the following/)).not.toBeInTheDocument()
    expect(document.getElementById('dmiCombination')).not.toBeInTheDocument()
    expect(document.getElementById('dmiDescription')).not.toBeInTheDocument()
  })

  it('shows incident details form when "Yes" is selected', () => {
    renderComponent({ dmiYesNo: true })
    expect(screen.getByText(/Please select any of the following/)).toBeInTheDocument()
    expect(document.getElementById('dmiCombination')).toBeInTheDocument()
    expect(document.getElementById('dmiIdentification')).toBeInTheDocument()
    expect(document.getElementById('dmiSharing')).toBeInTheDocument()
    expect(document.getElementById('dmiSecurity')).toBeInTheDocument()
    expect(document.getElementById('dmiAcknowledgement')).toBeInTheDocument()
    expect(document.getElementById('dmiPublication')).toBeInTheDocument()
    expect(document.getElementById('dmiFalsification')).toBeInTheDocument()
    expect(document.getElementById('dmiOther')).toBeInTheDocument()
    expect(document.getElementById('dmiDescription')).toBeInTheDocument()
  })

  it('hides incident details form when "No" is selected', () => {
    renderComponent({ dmiYesNo: false })
    expect(document.getElementById('dmiCombination')).not.toBeInTheDocument()
    expect(document.getElementById('dmiDescription')).not.toBeInTheDocument()
  })

  it('allows checking multiple incident types', () => {
    renderComponent({ dmiYesNo: true })
    const combination = document.getElementById('dmiCombination') as HTMLInputElement
    const identification = document.getElementById('dmiIdentification') as HTMLInputElement

    expect(combination).not.toBeChecked()
    expect(identification).not.toBeChecked()

    fireEvent.click(combination)
    expect(combination).toBeChecked()

    fireEvent.click(identification)
    expect(combination).toBeChecked()
    expect(identification).toBeChecked()
  })

  it('allows entering incident description text', () => {
    renderComponent({ dmiYesNo: true })
    const textarea = document.getElementById('dmiDescription') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'An incident occurred during data processing.' } })
    expect(textarea.value).toBe('An incident occurred during data processing.')
  })

  it('enforces character limit on incident description', () => {
    renderComponent({ dmiYesNo: true })
    const textarea = document.getElementById('dmiDescription') as HTMLTextAreaElement
    expect(textarea).toHaveAttribute('maxlength', String(FORM_TEXT_AREA_MAX_LENGTH))
  })

  it('allows toggling checkboxes on and off', () => {
    renderComponent({ dmiYesNo: true })
    const combination = document.getElementById('dmiCombination') as HTMLInputElement

    fireEvent.click(combination)
    expect(combination).toBeChecked()

    fireEvent.click(combination)
    expect(combination).not.toBeChecked()
  })
})
