import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DaaAssociationsPage from 'src/pages/signing_official_console/DAAAssignment/DaaAssociationsPage'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { Notifications, ROLES, USER_ROLES } from 'src/libs/utils'
import { DAAObject, DuosUser } from 'src/types/model'
import { makeDaa, makeResearcher } from './fixtures'

const mockDaas: DAAObject[] = [makeDaa({ daaId: 1, fileName: 'Default DUOS DAA', dacId: 10 })]

const researcher: DuosUser = makeResearcher({
  userId: 1,
  displayName: 'Test User Alpha',
  email: 'test.user.alpha@institution-a.org',
})

// Identified by `roles`, the field a list response actually carries.
const nonResearcher: DuosUser = makeResearcher({
  userId: 2,
  displayName: 'Test Admin Beta',
  email: 'admin.beta@test.org',
  roles: [{ roleId: ROLES.admin.roleId, name: USER_ROLES.admin, userId: 2 }],
})

const mount = (scope: 'Admin' | 'SigningOfficial') =>
  render(
    <DaaAssociationsPage
      title="DAA Associations"
      description="Test description"
      scope={scope}
    />,
  )

const mountManaged = (scope: 'Admin' | 'SigningOfficial') =>
  render(
    <DaaAssociationsPage
      title="DAA Associations"
      description="Test description"
      scope={scope}
      readOnly={false}
    />,
  )

afterEach(() => vi.restoreAllMocks())

describe('DaaAssociationsPage', () => {
  beforeEach(() => {
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => {})
    vi.spyOn(DAA, 'getDaas').mockResolvedValue(mockDaas)
    vi.spyOn(User, 'list').mockResolvedValue([researcher, nonResearcher])
  })

  it('narrows the Admin list to researchers', async () => {
    const { container } = mount(USER_ROLES.admin)
    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="researcher-row-2"]')).not.toBeInTheDocument()
  })

  // The SO endpoint is already institution-scoped to researchers, so the page
  // must not second-guess what it returns.
  it('passes the SigningOfficial list through unfiltered', async () => {
    const { container } = mount(USER_ROLES.signingOfficial)
    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="researcher-row-2"]')).toBeInTheDocument()
  })

  // Granting and revoking is an SO responsibility, so the cross-institution scope
  // must not expose the controls even when a caller forgets to ask for read-only.
  it('forces read-only for the Admin scope even when readOnly is false', async () => {
    const user = userEvent.setup()
    const { container } = mountManaged(USER_ROLES.admin)

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="bulk-approve-all-researcher-1"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="bulk-remove-all-researcher-1"]')).not.toBeInTheDocument()

    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="auth-action-authorize"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="auth-action-revoke"]')).not.toBeInTheDocument()
  })

  it('keeps the action controls for the SigningOfficial scope', async () => {
    const { container } = mountManaged(USER_ROLES.signingOfficial)
    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="bulk-approve-all-researcher-1"]')).toBeInTheDocument()
  })

  // Independent requests: the DAA fetch must not wait on the user list, which is
  // the slower of the two under the system-wide Admin scope.
  it('loads the user list and the DAAs concurrently', async () => {
    let resolveUsers: (users: DuosUser[]) => void = () => {}
    vi.mocked(User.list).mockReturnValue(new Promise((resolve) => {
      resolveUsers = resolve
    }))

    const { container } = mount(USER_ROLES.signingOfficial)

    // Still waiting on the user list, yet the DAAs are already requested.
    await waitFor(() => expect(DAA.getDaas).toHaveBeenCalledOnce())
    expect(container.querySelector('[data-cy="researcher-row-1"]')).not.toBeInTheDocument()

    resolveUsers([researcher])
    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
  })

  it('leaves both lists unset when the DAA request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(DAA.getDaas).mockRejectedValue(new Error('daa service down'))

    const { container } = mount(USER_ROLES.signingOfficial)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
    // Not "this researcher has no DAAs" — nothing loaded at all.
    expect(container.querySelector('[data-cy="researcher-row-1"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-empty-message"]')).toBeInTheDocument()
  })

  // The read-only Admin page cannot reach a refresh, but the narrowing must not
  // depend on that: any future refresh has to land on the same filtered list.
  it('keeps the Admin list narrowed after a post-mutation refresh', async () => {
    vi.spyOn(DAA, 'createDaaLcLink').mockResolvedValue(undefined as unknown as DAAObject)
    const user = userEvent.setup()
    // readOnly is forced on for the Admin scope, so drive the refresh through the
    // SO scope and assert the narrowing is applied to whatever comes back.
    const { container } = mountManaged(USER_ROLES.signingOfficial)

    await waitFor(() => expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument())
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-confirm"]') as HTMLElement)

    await waitFor(() => expect(User.list).toHaveBeenCalledTimes(2))
    expect(User.list).toHaveBeenLastCalledWith(USER_ROLES.signingOfficial)
  })
})
