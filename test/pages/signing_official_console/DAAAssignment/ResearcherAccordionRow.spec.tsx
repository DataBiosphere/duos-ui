import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherAccordionRow from 'src/pages/signing_official_console/DAAAssignment/ResearcherAccordionRow'
import { DuosUser } from 'src/types/model'
import { DAARowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { makeDaa, makeResearcher } from './fixtures'

const mockResearcher: DuosUser = makeResearcher({
  userId: 42,
  displayName: 'Test User Gamma',
  email: 'test.user.gamma@test.org',
  daaDetails: [{ daaId: 1 }],
})

const mockDaaRows: DAARowData[] = [
  {
    daa: makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA' }),
    dacName: 'NHGRI DAC',
    status: 'authorized',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Agreement' }),
    dacName: 'GTEx DAC',
    status: 'not_requested',
  },
]

describe('ResearcherAccordionRow', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void
  let toggleSpy: () => void

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
    toggleSpy = vi.fn()
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof ResearcherAccordionRow>> = {}) =>
    render(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        {...overrides}
      />,
    )

  it('renders the researcher name and email', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="researcher-row-42"]')).toHaveTextContent('Test User Gamma')
    expect(container.querySelector('[data-cy="researcher-row-42"]')).toHaveTextContent('test.user.gamma@test.org')
  })

  it('shows authorized badge when authorizedCount > 0', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="researcher-authorized-badge-42"]')).toHaveTextContent('1 pre-authorized')
  })

  it('shows no pre-auth status when authorizedCount is 0', () => {
    const { container } = mount({ authorizedCount: 0 })
    expect(container.querySelector('[data-cy="researcher-no-status-42"]')).toHaveTextContent('No pre-auth status')
  })

  it('calls onToggle when the header is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-42"]') as HTMLElement)
    expect(toggleSpy).toHaveBeenCalledOnce()
  })

  it('does not render the DAA subtable when collapsed', () => {
    const { container } = mount({ isExpanded: false })
    expect(container.querySelector('[data-cy="daa-subtable"]')).not.toBeInTheDocument()
  })

  it('renders the DAA subtable when expanded', () => {
    const { container } = mount({ isExpanded: true })
    expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-2"]')).toBeInTheDocument()
  })
})
