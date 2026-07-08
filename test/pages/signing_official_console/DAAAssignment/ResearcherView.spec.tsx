import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherView from 'src/pages/signing_official_console/DAAAssignment/ResearcherView'
import {
  buildResearcherRows,
  getDacName,
  getAuthStatus,
} from 'src/pages/signing_official_console/DAAAssignment/researcherViewHelpers'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { DuosUser, DAAObject } from 'src/types/model'
import { makeDaa, makeResearcher } from './fixtures'

const mockDaas: DAAObject[] = [
  makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA', dacId: 10 }),
  makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Access Agreement', dacId: 20 }),
]

const mockResearchers: DuosUser[] = [
  makeResearcher({
    userId: 1,
    displayName: 'Test User Alpha',
    email: 'test.user.alpha@test.org',
    daaDetails: [{ daaId: 1 }],
  }),
  makeResearcher({
    userId: 2,
    displayName: 'Test User Beta',
    email: 'test.user.beta@test.org',
  }),
]

// ── Pure helper unit tests ─────────────────────────────────────────────────────

describe('ResearcherView pure helpers', () => {
  describe('getDacName', () => {
    it('returns the DAC name from daa.dacs', () => {
      const daa = makeDaa({ broadDaa: true, daaId: 1, fileName: 'Test DAA', dacId: 10 })
      expect(getDacName(daa)).toBe('DAC-10')
    })

    it('returns — when dacs array is empty', () => {
      const daa = { ...makeDaa({ broadDaa: true, daaId: 1, fileName: 'Test DAA', dacId: 10 }), dacs: [] }
      expect(getDacName(daa)).toBe('—')
    })

    it('joins multiple DAC names', () => {
      const daa: DAAObject = {
        ...makeDaa({ broadDaa: true, daaId: 1, fileName: 'Multi DAA', dacId: 10 }),
        dacs: [
          { dacId: 10, name: 'DAC A' },
          { dacId: 20, name: 'DAC B' },
        ],
      }
      expect(getDacName(daa)).toBe('DAC A / DAC B')
    })
  })

  describe('getAuthStatus', () => {
    it('returns authorized when daaId is present in the library card (legacy daaIds)', () => {
      const researcher = makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com', daaDetails: [{ daaId: 1 }, { daaId: 2 }] })
      expect(getAuthStatus(researcher, 1)).toBe('authorized')
    })

    it('returns not_requested when daaId is absent from libraryCard', () => {
      const researcher = makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com', daaDetails: [{ daaId: 1 }] })
      expect(getAuthStatus(researcher, 99)).toBe('not_requested')
    })

    it('returns not_requested when researcher has no libraryCard', () => {
      const researcher = { ...makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com' }), libraryCard: undefined }
      expect(getAuthStatus(researcher, 1)).toBe('not_requested')
    })
  })

  describe('buildResearcherRows', () => {
    it('counts authorized correctly', () => {
      const rows = buildResearcherRows(mockResearchers, mockDaas)
      const userOne = rows.find(r => r.researcher.userId === 1)
      expect(userOne?.authorizedCount).toBe(1)
    })

    it('counts not_requested as 0 authorized', () => {
      const rows = buildResearcherRows(mockResearchers, mockDaas)
      const userTwo = rows.find(r => r.researcher.userId === 2)
      expect(userTwo?.authorizedCount).toBe(0)
    })
  })
})

// ── Component tests ────────────────────────────────────────────────────────────

describe('ResearcherView', () => {
  let refreshSpy: (updated: DuosUser[]) => void

  beforeEach(() => {
    refreshSpy = vi.fn()
    vi.spyOn(User, 'list').mockResolvedValue(mockResearchers)
  })

  afterEach(() => vi.restoreAllMocks())

  const mount = (overrides: Partial<React.ComponentProps<typeof ResearcherView>> = {}) =>
    render(
      <ResearcherView
        researchers={mockResearchers}
        daas={mockDaas}
        isLoading={false}
        onResearchersRefresh={refreshSpy}
        {...overrides}
      />,
    )

  it('renders a row for each researcher', () => {
    const { container } = mount()
    const list = container.querySelector('[data-cy="researcher-list"]') as HTMLElement
    expect(list.querySelectorAll('[data-cy="researcher-row-1"], [data-cy="researcher-row-2"]')).toHaveLength(2)
  })

  it('shows a loading spinner when isLoading is true', () => {
    const { container } = mount({ isLoading: true })
    expect(container.querySelector('[data-cy="researcher-view-loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-view"]')).not.toBeInTheDocument()
  })

  it('filters researchers by name', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="researcher-search"] input') as HTMLElement, 'Beta')
    expect(container.querySelector('[data-cy="researcher-row-1"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-2"]')).toBeInTheDocument()
  })

  it('filters researchers by email', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="researcher-search"] input') as HTMLElement, 'test.user.alpha')
    expect(container.querySelector('[data-cy="researcher-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-2"]')).not.toBeInTheDocument()
  })

  it('shows empty message when search has no matches', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.type(container.querySelector('[data-cy="researcher-search"] input') as HTMLElement, 'xyznotfound')
    expect(container.querySelector('[data-cy="researcher-empty-message"]')).toBeInTheDocument()
  })

  it('expands all rows when Expand All is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="expand-collapse-all"]') as HTMLElement)
    expect(container.querySelectorAll('[data-cy="daa-subtable"]')).toHaveLength(2)
  })

  it('collapses all rows when Collapse All is clicked after expanding', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="expand-collapse-all"]') as HTMLElement)
    expect(container.querySelector('[data-cy="expand-collapse-all"]')).toHaveTextContent('Collapse All')
    await user.click(container.querySelector('[data-cy="expand-collapse-all"]') as HTMLElement)
    expect(container.querySelector('[data-cy="daa-subtable"]')).not.toBeInTheDocument()
  })

  it('expands a single row when its header is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    expect(container.querySelector('[data-cy="researcher-row-1"] [data-cy="daa-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="researcher-row-2"] [data-cy="daa-subtable"]')).not.toBeInTheDocument()
  })

  it('opens confirm dialog when Authorize is clicked in an expanded row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-2"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toBeInTheDocument()
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toHaveTextContent('Authorize')
  })

  it('closes the confirm dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-2"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-cancel"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).not.toBeInTheDocument()
  })

  it('calls createDaaLcLink and refreshes when Authorize is confirmed', async () => {
    vi.spyOn(DAA, 'createDaaLcLink').mockResolvedValue(undefined as unknown as DAAObject)
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-2"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-confirm"]') as HTMLElement)
    await waitFor(() => expect(DAA.createDaaLcLink).toHaveBeenCalledOnce())
    await waitFor(() => expect(User.list).toHaveBeenCalled())
  })

  it('opens revoke confirm dialog when Revoke is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    expect(document.body.querySelector('[data-cy="confirm-dialog"]')).toHaveTextContent('Revoke')
  })

  it('calls deleteDaaLcLink and refreshes when Revoke is confirmed', async () => {
    vi.spyOn(DAA, 'deleteDaaLcLink').mockResolvedValue(0)
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="researcher-row-toggle-1"]') as HTMLElement)
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    await user.click(document.body.querySelector('[data-cy="confirm-dialog-confirm"]') as HTMLElement)
    await waitFor(() => expect(DAA.deleteDaaLcLink).toHaveBeenCalledOnce())
    await waitFor(() => expect(User.list).toHaveBeenCalled())
  })
})
