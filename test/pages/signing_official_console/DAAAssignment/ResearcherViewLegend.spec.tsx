import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResearcherViewLegend from 'src/pages/signing_official_console/DAAAssignment/ResearcherViewLegend'

describe('ResearcherViewLegend', () => {
  it('renders all legend labels', () => {
    render(<ResearcherViewLegend />)

    expect(screen.getByText('Pre-authorized')).toBeInTheDocument()
    expect(screen.getByText('Not pre-authorized')).toBeInTheDocument()
  })

  it('renders one visual marker per legend item', () => {
    const { container } = render(<ResearcherViewLegend />)

    const legend = container.querySelector('[data-cy="researcher-view-legend"]')
    expect(legend).not.toBeNull()
    expect(legend!.children).toHaveLength(2)
  })
})
