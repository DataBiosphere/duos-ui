import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDaaAssociations from 'src/pages/AdminDaaAssociations'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, ROLES, USER_ROLES } from 'src/libs/utils'
import { DAAObject, DuosUser } from 'src/types/model'
import { makeDaa, makeResearcher } from './signing_official_console/DAAAssignment/fixtures'

const mockDaas: DAAObject[] = [
  makeDaa({ daaId: 1, fileName: 'Default DUOS DAA', dacId: 10 }),
  makeDaa({ daaId: 2, fileName: 'GTEx Access Agreement', dacId: 20 }),
]

// Researchers from two different institutions; the admin list is not institution-scoped.
const mockResearchers: DuosUser[] = [
  makeResearcher({
    userId: 1,
    displayName: 'Test User Alpha',
    email: 'test.user.alpha@institution-a.org',
    daaDetails: [{ daaId: 1, authorizedBy: 'so@institution-a.org' }],
    institutionName: 'Institution Alpha',
  }),
  makeResearcher({
    userId: 2,
    displayName: 'Test User Beta',
    email: 'test.user.beta@institution-b.org',
    institutionName: 'Institution Beta',
  }),
  // Shaped like a real list response: the derived `isResearcher` flag is absent
  // (only the signed-in user gets it), so `roles` is what identifies a researcher.
  {
    ...makeResearcher({
      userId: 5,
      displayName: 'Test User Epsilon',
      email: 'test.user.epsilon@institution-c.org',
    }),
    isResearcher: false,
  },
]

// The Admin user list returns every role, and pre-authorization applies to none
// of these, so the page must drop them. Roles come from the payload's `roles`
// array — a list response does not carry the derived `isResearcher` flag, so
// these fixtures deliberately leave it false.
const mockNonResearchers: DuosUser[] = [
  makeResearcher({
    userId: 3,
    displayName: 'Test Admin Gamma',
    email: 'admin.gamma@test.org',
    roles: [{ roleId: ROLES.admin.roleId, name: USER_ROLES.admin, userId: 3 }],
  }),
  makeResearcher({
    userId: 4,
    displayName: 'Test SO Delta',
    email: 'so.delta@institution-a.org',
    roles: [{ roleId: ROLES.signingOfficial.roleId, name: USER_ROLES.signingOfficial, userId: 4 }],
  }),
]

const mockUsers: DuosUser[] = [...mockResearchers, ...mockNonResearchers]

const ACTION_SELECTORS = [
  '[data-cy="auth-action-authorize"]',
  '[data-cy="auth-action-revoke"]',
  '[data-cy="auth-action-reauthorize"]',
  '[data-cy^="bulk-approve-all-"]',
  '[data-cy^="bulk-remove-all-"]',
]

// MUI Dialogs portal to document.body, so they are never inside the RTL container.
const DIALOG_SELECTORS = [
  '[data-cy="confirm-dialog"]',
  '[data-cy="bulk-confirm-dialog"]',
]

const expectNoActionControls = (container: HTMLElement) => {
  ACTION_SELECTORS.forEach((selector) => {
    expect(container.querySelector(selector)).not.toBeInTheDocument()
  })
  DIALOG_SELECTORS.forEach((selector) => {
    expect(document.body.querySelector(selector)).not.toBeInTheDocument()
  })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
}

const mountPage = () => render(<AdminDaaAssociations />)

const mountLoadedPage = async () => {
  const rendered = mountPage()
  await waitFor(() =>
    expect(rendered.container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument())
  return rendered
}

const openDaaViewTab = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
  await user.click(await waitFor(() => {
    const tab = container.querySelectorAll('[role="tab"]')[1] as HTMLElement
    expect(tab).toHaveTextContent('DAA View')
    return tab
  }))
}

afterEach(() => vi.restoreAllMocks())

describe('AdminDaaAssociations', () => {
  beforeEach(() => {
    vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
    vi.spyOn(User, 'list').mockResolvedValue(mockUsers)
    vi.spyOn(DAA, 'getDaas').mockResolvedValue(mockDaas)
  })

  // ── Data scope ──────────────────────────────────────────────────────────────

  it('loads the system-wide user list, not the institution-scoped one', async () => {
    await mountLoadedPage()
    expect(User.list).toHaveBeenCalledWith(USER_ROLES.admin)
    expect(User.list).not.toHaveBeenCalledWith(USER_ROLES.signingOfficial)
  })

  it('lists researchers from every institution', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-2"]')).toBeInTheDocument()
  })

  // Guards the trap that `isResearcher` is derived for the signed-in user only,
  // so filtering on it would empty this page against a real response.
  it('identifies researchers by their roles, not the derived isResearcher flag', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-row-5"]')).toBeInTheDocument()
  })

  it('excludes users who are not researchers', async () => {
    const { container } = await mountLoadedPage()
    mockNonResearchers.forEach(({ userId }) => {
      expect(container.querySelector(`[data-cy="researcher-row-${userId}"]`)).not.toBeInTheDocument()
    })
    // The header toggle shares the `researcher-row-` prefix, so exclude it from the count.
    expect(container.querySelectorAll(
      '[data-cy^="researcher-row-"]:not([data-cy^="researcher-row-toggle-"])',
    )).toHaveLength(mockResearchers.length)
  })

  it('excludes non-researchers from the per-DAA researcher list too', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await user.click(await waitFor(() =>
      container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement))

    expect(container.querySelectorAll('[data-cy^="daa-researcher-row-"]')).toHaveLength(mockResearchers.length)
    mockNonResearchers.forEach(({ userId }) => {
      expect(container.querySelector(`[data-cy="daa-researcher-row-${userId}"]`)).not.toBeInTheDocument()
    })
  })

  it('excludes DAAs with no DAC mapping', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([
      makeDaa({ daaId: 1, mapped: true }),
      makeDaa({ daaId: 2, mapped: false }),
    ])
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    expect(container.querySelectorAll('[data-cy^="daa-row-"]')).toHaveLength(1)
    expect(container.querySelector('[data-cy="daa-row-1"]')).toBeInTheDocument()
  })

  // ── Page structure ──────────────────────────────────────────────────────────

  it('renders the DAA Associations header and both view tabs', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="table-header-title"]')).toHaveTextContent('DAA Associations')
    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent('Researcher View')
    expect(tabs[1]).toHaveTextContent('DAA View')
  })

  it('sets the document title', async () => {
    await mountLoadedPage()
    expect(document.title).toEqual('DAA Associations | DUOS')
  })

  it('defaults to the Researcher View tab', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-view"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-view"]')).not.toBeInTheDocument()
  })

  // ── Institution ─────────────────────────────────────────────────────────────

  it('shows each researcher institution in the Researcher View', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-institution-1"]')).toHaveTextContent('Institution Alpha')
    expect(container.querySelector('[data-cy="researcher-institution-2"]')).toHaveTextContent('Institution Beta')
  })

  it('shows a dash for a researcher with no institution', async () => {
    const { container } = await mountLoadedPage()
    // User 5 is built without an institution.
    expect(container.querySelector('[data-cy="researcher-institution-5"]')).toHaveTextContent('—')
  })

  it('shows an Institution column in the per-DAA researcher sub-table', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await user.click(await waitFor(() =>
      container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement))

    const headers = Array.from(container.querySelectorAll('[data-cy="daa-researcher-subtable"] th'))
      .map(th => th.textContent)
    expect(headers).toEqual([
      'Researcher',
      'Email',
      'Institution',
      'Pre-Auth Status',
      'Pre-authorized By',
    ])
    expect(container.querySelector('[data-cy="daa-researcher-institution-1"]')).toHaveTextContent('Institution Alpha')
  })

  it('does not match the dash shown for researchers with no institution', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await user.type(
      container.querySelector('[data-cy="researcher-search"] input') as HTMLElement,
      '—',
    )
    expect(container.querySelector('[data-cy="researcher-empty-message"]')).toBeInTheDocument()
  })

  it('advertises institution search in the search placeholder', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-search"] input'))
      .toHaveAttribute('placeholder', 'Search by researcher, email, or institution')
  })

  it('renders the search bar, legend, and expand/collapse-all control', async () => {
    const { container } = await mountLoadedPage()
    expect(container.querySelector('[data-cy="researcher-search"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-view-legend"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="expand-collapse-all"]')).toBeInTheDocument()
  })

  it('shows a loading indicator while data is loading', () => {
    vi.mocked(User.list).mockReturnValue(new Promise(() => {}))
    const { container } = mountPage()
    expect(container.querySelector('[data-cy="researcher-view-loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-list"]')).not.toBeInTheDocument()
  })

  it('shows an error notification when the initial data load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(User.list).mockRejectedValue(new Error('network'))

    mountPage()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledOnce())
  })

  // ── Read-only behavior ──────────────────────────────────────────────────────

  it('renders no action controls in the Researcher View', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    expectNoActionControls(container)
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
    expectNoActionControls(container)
  })

  it('omits the Action column from the expanded researcher sub-table', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    const headers = Array.from(container.querySelectorAll('[data-cy="daa-subtable"] th'))
      .map(th => th.textContent)
    expect(headers).toEqual(['DAA', 'DAC', 'Effective Date', 'Status'])
  })

  it('renders no action controls in the DAA View', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await waitFor(() => expect(container.querySelector('[data-cy="daa-view"]')).toBeInTheDocument())

    expect(container.querySelector('[data-cy="daa-accordion-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).toBeInTheDocument()
    expectNoActionControls(container)

    await user.click(container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-researcher-subtable"]')).toBeInTheDocument()
    expectNoActionControls(container)
  })

  it('omits the Action column from the expanded DAA sub-table', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await user.click(await waitFor(() =>
      container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement))

    const headers = Array.from(container.querySelectorAll('[data-cy="daa-researcher-subtable"] th'))
      .map(th => th.textContent)
    expect(headers).not.toContain('Action')
  })

  it('still shows pre-authorization status for all researchers under a DAA', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await user.click(await waitFor(() =>
      container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement))

    expect(container.querySelector('[data-cy="daa-researcher-row-1"] [data-cy="auth-status-chip-authorized"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-researcher-row-2"] [data-cy="auth-status-chip-not_requested"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-authorized-by-1"]')).toHaveTextContent('so@institution-a.org')
  })

  it('never calls a mutating DAA endpoint', async () => {
    // Every DAA mutation the two views can reach: single-link, researcher-scoped
    // bulk (ResearcherView) and DAA-scoped bulk (DAAView).
    const mutations = [
      'createDaaLcLink',
      'deleteDaaLcLink',
      'bulkAddDaasToUser',
      'bulkRemoveDaasFromUser',
      'bulkAddUsersToDaa',
      'bulkRemoveUsersFromDaa',
    ] as const
    const spies = mutations.map(name => [name, vi.spyOn(DAA, name)] as const)
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    await openDaaViewTab(user, container)
    await user.click(await waitFor(() =>
      container.querySelector('[data-cy="daa-accordion-toggle-1"]') as HTMLElement))

    spies.forEach(([name, spy]) => {
      expect(spy, `DAA.${name} should not be called from a read-only page`).not.toHaveBeenCalled()
    })
  })

  // ── Search ──────────────────────────────────────────────────────────────────

  // Institution is admin-only: this page's list spans institutions, so the
  // search covers it alongside the fields the SO console already searched.
  it.each([
    { field: 'name', query: 'Alpha', kept: 1, dropped: 2 },
    { field: 'email', query: 'institution-b', kept: 2, dropped: 1 },
    { field: 'institution', query: 'Institution Beta', kept: 2, dropped: 1 },
  ])('filters researchers by $field', async ({ query, kept, dropped }) => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await user.type(
      container.querySelector('[data-cy="researcher-search"] input') as HTMLElement,
      query,
    )
    expect(container.querySelector(`[data-cy="researcher-row-${kept}"]`)).toBeInTheDocument()
    expect(container.querySelector(`[data-cy="researcher-row-${dropped}"]`)).not.toBeInTheDocument()
  })

  it.each([
    { field: 'name', query: 'GTEx' },
    { field: 'DAC', query: 'DAC-20' },
  ])('filters DAAs by $field in the DAA View', async ({ query }) => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()

    await openDaaViewTab(user, container)
    await user.type(
      await waitFor(() => container.querySelector('[data-cy="daa-search"] input') as HTMLElement),
      query,
    )
    expect(container.querySelector('[data-cy="daa-accordion-row-2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-accordion-row-1"]')).not.toBeInTheDocument()
  })

  // ── Expand / collapse all ───────────────────────────────────────────────────

  it('expands and collapses every researcher row', async () => {
    const user = userEvent.setup()
    const { container } = await mountLoadedPage()
    const toggleAll = container.querySelector('[data-cy="expand-collapse-all"]') as HTMLElement

    await user.click(toggleAll)
    expect(container.querySelectorAll('[data-cy="daa-subtable"]')).toHaveLength(mockResearchers.length)

    await user.click(toggleAll)
    await waitFor(() => expect(container.querySelector('[data-cy="daa-subtable"]')).not.toBeInTheDocument())
  })
})
