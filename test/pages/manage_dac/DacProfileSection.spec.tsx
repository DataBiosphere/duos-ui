import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DacProfileSection } from 'src/pages/manage_dac/DacProfileSection'

describe('DacProfileSection', () => {
  it('labels the section with its heading', () => {
    render(
      <DacProfileSection title="Rule Automation for DARs (RADAR)">
        <p>Section body</p>
      </DacProfileSection>,
    )

    const section = screen.getByRole('region', { name: 'Rule Automation for DARs (RADAR)' })
    const heading = screen.getByRole('heading', { name: 'Rule Automation for DARs (RADAR)' })

    expect(section).toContainElement(heading)
    expect(section).toHaveAttribute('aria-labelledby', heading.id)
  })

  it('renders its children inside the card', () => {
    render(
      <DacProfileSection title="DAC Info">
        <p>Section body</p>
      </DacProfileSection>,
    )

    expect(screen.getByRole('region', { name: 'DAC Info' })).toContainElement(screen.getByText('Section body'))
  })

  it('renders a card with no children', () => {
    render(<DacProfileSection title="Datasets Managed by this DAC" />)

    expect(screen.getByRole('region', { name: 'Datasets Managed by this DAC' })).toBeInTheDocument()
  })
})
