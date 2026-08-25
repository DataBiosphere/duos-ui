import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { PI_QUALIFICATION } from 'src/libs/principalInvestigator'
import { makeDaa, makeResearcher } from './DAAAssignment/fixtures'

afterEach(() => vi.restoreAllMocks())

describe('ManageResearcherDAAs', () => {
  beforeEach(() => {
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
  })

  it('loads the page and filters out DAAs with no DAC mapping', async () => {
    vi.spyOn(User, 'list').mockResolvedValue([makeResearcher({
      userId: 1,
      displayName: 'Test User Eta',
      email: 'test@test.com',
      daaDetails: [{ daaId: 1 }, { daaId: 2 }],
    })])
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([
      makeDaa({ daaId: 1, mapped: true }),
      makeDaa({ daaId: 2, mapped: false }),
      makeDaa({ daaId: 3, mapped: false }),
    ])

    const { container } = render(<ManageResearcherDAAs />)

    expect(screen.getByText(PI_QUALIFICATION, { exact: false })).toBeInTheDocument()

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    // The researcher holds DAAs 1 and 2, but 2 has no DAC mapping so only 1 is shown.
    expect(container.querySelectorAll('[data-cy^="daa-row-"]')).toHaveLength(1)
  })

  // The Admin Console renders the same page read-only, so the SO Console keeps an
  // explicit guard that its institution scope and action controls are intact.
  it('loads the institution-scoped researcher list and keeps the action controls', async () => {
    vi.spyOn(User, 'list').mockResolvedValue([makeResearcher({
      userId: 1,
      displayName: 'Test User Eta',
      email: 'test@test.com',
      daaDetails: [{ daaId: 1 }],
    })])
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([makeDaa({ daaId: 1, mapped: true })])

    const { container } = render(<ManageResearcherDAAs />)

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())
    expect(User.list).toHaveBeenCalledWith(USER_ROLES.signingOfficial)
    expect(container.querySelector('[data-cy="bulk-remove-all-researcher-1"]')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]')).toBeInTheDocument()
  })

  // Institution is an Admin Console addition: an SO's list is one institution, so
  // the SO page must look exactly as it did.
  it('does not show institution or offer institution search', async () => {
    vi.spyOn(User, 'list').mockResolvedValue([makeResearcher({
      userId: 1,
      displayName: 'Test User Eta',
      email: 'test@test.com',
      institutionName: 'Institution Eta',
    })])
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([makeDaa({ daaId: 1, mapped: true })])

    const { container } = render(<ManageResearcherDAAs />)

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="researcher-institution-1"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-1"]')).not.toHaveTextContent('Institution Eta')
    expect(container.querySelector('[data-cy="researcher-search"] input'))
      .toHaveAttribute('placeholder', 'Search researchers')

    const user = userEvent.setup()
    await user.type(
      container.querySelector('[data-cy="researcher-search"] input') as HTMLElement,
      'Institution Eta',
    )
    expect(container.querySelector('[data-cy="researcher-empty-message"]')).toBeInTheDocument()
  })

  it('sets the document title', async () => {
    vi.spyOn(User, 'list').mockResolvedValue([])
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([])

    const { container } = render(<ManageResearcherDAAs />)

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())
    expect(document.title).toEqual('Pre-Authorize Researchers (DAAs) | DUOS')
  })

  it('shows an error notification when initial data load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(User, 'list').mockRejectedValue(new Error('network'))
    vi.spyOn(DAA, 'getDaas').mockResolvedValue([])

    render(<ManageResearcherDAAs />)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
  })
})
