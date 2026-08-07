import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ApplicationInformation from 'src/pages/dar_collection_review/ApplicationInformation'

describe('ApplicationInformation', () => {
  it('renders the application information page container', () => {
    const { container } = render(<ApplicationInformation />)
    expect(container.querySelector('.application-information-page')).toBeTruthy()
  })

  it('renders the Non-Technical Summary section', () => {
    const { container } = render(<ApplicationInformation nonTechSummary="test summary" />)
    expect(container.querySelector('.non-technical-summary-subheader')).toBeTruthy()
    expect(container.querySelector('.non-technical-summary-textbox')?.textContent).toContain('test summary')
  })

  it('renders the Research Use Statement section', () => {
    const { container } = render(<ApplicationInformation rus="test rus" />)
    expect(container.querySelector('.rus-subheader')).toBeTruthy()
    expect(container.querySelector('.rus-textbox')?.textContent).toContain('test rus')
  })

  it('renders skeleton placeholders when isLoading is true', () => {
    const { container } = render(<ApplicationInformation isLoading={true} />)
    expect(container.querySelector('.non-technical-summary-subheader')).toBeNull()
    expect(container.querySelectorAll('.text-placeholder').length).toBeGreaterThan(0)
  })
})
