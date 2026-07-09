import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DAAResearcherSubtable from 'src/pages/signing_official_console/DAAAssignment/DAAResearcherSubtable'
import { DAAResearcherRowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { DuosUser } from 'src/types/model'

const makeResearcher = (userId: number, displayName: string, email: string): DuosUser => ({
  userId,
  displayName,
  email,
  createDate: new Date('2020-01-01'),
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
})

const mockRows: DAAResearcherRowData[] = [
  {
    researcher: makeResearcher(1, 'Test User Theta', 'test.user.theta@test.org'),
    status: 'authorized',
    authorizedBy: 'so@test.org',
  },
  {
    researcher: makeResearcher(2, 'Test User Iota', 'test.user.iota@test.org'),
    status: 'not_requested',
  },
  {
    researcher: makeResearcher(3, 'Test User Kappa', 'test.user.kappa@test.org'),
    status: 'revoked',
  },
]

describe('DAAResearcherSubtable', () => {
  let authorizeSpy: (researcherId: number) => void
  let revokeSpy: (researcherId: number) => void

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
  })

  const mount = (rows = mockRows) =>
    render(
      <DAAResearcherSubtable
        researcherRows={rows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )

  it('renders all researcher rows', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-3"]')).toBeInTheDocument()
  })

  it('displays researcher name and email in each row', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-researcher-row-1"]')).toHaveTextContent('Test User Theta')
    expect(container.querySelector('[data-cy="daa-researcher-row-1"]')).toHaveTextContent('test.user.theta@test.org')
    expect(container.querySelector('[data-cy="daa-researcher-row-2"]')).toHaveTextContent('Test User Iota')
  })

  it('renders the correct status chip for each row', () => {
    const { container } = mount()
    const row1 = container.querySelector('[data-cy="daa-researcher-row-1"]') as HTMLElement
    const row2 = container.querySelector('[data-cy="daa-researcher-row-2"]') as HTMLElement
    const row3 = container.querySelector('[data-cy="daa-researcher-row-3"]') as HTMLElement
    expect(within(row1).queryByTestId?.('auth-status-chip-authorized') ?? row1.querySelector('[data-cy="auth-status-chip-authorized"]')).toBeInTheDocument()
    expect(within(row2).queryByTestId?.('auth-status-chip-not_requested') ?? row2.querySelector('[data-cy="auth-status-chip-not_requested"]')).toBeInTheDocument()
    expect(within(row3).queryByTestId?.('auth-status-chip-revoked') ?? row3.querySelector('[data-cy="auth-status-chip-revoked"]')).toBeInTheDocument()
  })

  it('renders Revoke button for authorized rows and Pre-Authorize for others', () => {
    const { container } = mount()
    const row1 = container.querySelector('[data-cy="daa-researcher-row-1"]') as HTMLElement
    const row2 = container.querySelector('[data-cy="daa-researcher-row-2"]') as HTMLElement
    const row3 = container.querySelector('[data-cy="daa-researcher-row-3"]') as HTMLElement
    expect(row1.querySelector('[data-cy="auth-action-revoke"]')).toBeInTheDocument()
    expect(row2.querySelector('[data-cy="auth-action-authorize"]')).toBeInTheDocument()
    expect(row3.querySelector('[data-cy="auth-action-reauthorize"]')).toBeInTheDocument()
  })

  it('calls onRevoke with the correct researcherId when Revoke is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    expect(revokeSpy).toHaveBeenCalledWith(1)
  })

  it('calls onAuthorize with the correct researcherId when Pre-Authorize is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]') as HTMLElement)
    expect(authorizeSpy).toHaveBeenCalledWith(2)
  })

  it('shows empty message when no researcher rows provided', () => {
    const { container } = mount([])
    expect(container.querySelector('[data-cy="daa-researcher-subtable-empty"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy^="daa-researcher-row-"]')).not.toBeInTheDocument()
  })

  it('renders all five column headers including Pre-authorized By', () => {
    const { container } = mount()
    const subtable = container.querySelector('[data-cy="daa-researcher-subtable"]') as HTMLElement
    expect(within(subtable).getByText('Researcher')).toBeInTheDocument()
    expect(within(subtable).getByText('Email')).toBeInTheDocument()
    expect(within(subtable).getByText('Pre-Auth Status')).toBeInTheDocument()
    expect(within(subtable).getByText('Pre-authorized By')).toBeInTheDocument()
    expect(within(subtable).getByText('Action')).toBeInTheDocument()
  })

  it('shows the authorizedBy email when the field is populated', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-authorized-by-1"]')).toHaveTextContent('so@test.org')
  })

  it('shows a dash when authorizedBy is not set', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-authorized-by-2"]')).toHaveTextContent('—')
    expect(container.querySelector('[data-cy="daa-authorized-by-3"]')).toHaveTextContent('—')
  })

  it('renders a Pre-authorized By cell for every row', () => {
    const { container } = mount()
    mockRows.forEach(({ researcher }) => {
      expect(container.querySelector(`[data-cy="daa-authorized-by-${researcher.userId}"]`)).toBeInTheDocument()
    })
  })
})
