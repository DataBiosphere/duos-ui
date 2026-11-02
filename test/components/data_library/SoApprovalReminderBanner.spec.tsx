import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import SoApprovalReminderBanner from 'src/components/data_library/SoApprovalReminderBanner'

describe('SoApprovalReminderBanner', () => {
  it('states that the Signing Official approves the researcher or the request before DAC review', () => {
    render(<SoApprovalReminderBanner />)
    expect(
      screen.getByText(
        /Your Signing Official must approve you or your data access request, as each DAC prefers, prior to a DAC reviewing your request/,
      ),
    ).toBeInTheDocument()
  })

  it('links to the Signing Official Guide in a new tab', () => {
    render(<SoApprovalReminderBanner />)
    const link = screen.getByRole('link', { name: 'here' })
    expect(link).toHaveAttribute('href', 'https://duos.blog/help/signingofficialguide/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
