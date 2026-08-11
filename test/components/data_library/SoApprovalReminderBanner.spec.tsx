import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import SoApprovalReminderBanner from 'src/components/data_library/SoApprovalReminderBanner'

describe('SoApprovalReminderBanner', () => {
  // Requirement 1: the reminder states that an SO must approve before DAC review
  it('states that Signing Officials approve the researcher or the request before DAC review', () => {
    render(<SoApprovalReminderBanner />)
    expect(
      screen.getByText(/require Signing Officials to approve either the researcher or individual requests before they review/),
    ).toBeInTheDocument()
  })

  // Requirement 2: the banner shows on every tab, but only the Datasets tab has the column to point at
  it('omits the per-dataset pointer when no SO Approval column is shown', () => {
    render(<SoApprovalReminderBanner />)
    expect(screen.queryByText(/Each dataset below/)).not.toBeInTheDocument()
  })

  it('adds the per-dataset pointer when the SO Approval column is shown', () => {
    render(<SoApprovalReminderBanner showsPerDatasetIndicator />)
    expect(screen.getByText(/Each dataset below indicates which approval model applies/)).toBeInTheDocument()
  })
})
