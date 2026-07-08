import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherDAASubtable from 'src/pages/signing_official_console/DAAAssignment/ResearcherDAASubtable'
import { DAARowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { makeDaa } from './fixtures'

const mockDaaRows: DAARowData[] = [
  {
    daa: {
      ...makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA' }),
      createDate: 1705276800 as unknown as string,
    },
    dacName: 'NHGRI DAC',
    status: 'authorized',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Access Agreement' }),
    dacName: 'GTEx DAC',
    status: 'not_requested',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 3, fileName: 'eMERGE Institutional Agreement' }),
    dacName: 'eMERGE DAC',
    status: 'not_requested',
  },
]

describe('ResearcherDAASubtable', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void

  beforeEach(() => {
    authorizeSpy = vi.fn()
    revokeSpy = vi.fn()
  })

  const mount = (rows = mockDaaRows) =>
    render(
      <ResearcherDAASubtable
        daaRows={rows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )

  it('renders all DAA rows', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-3"]')).toBeInTheDocument()
  })

  it('displays DAA file name, DAC name, and create date in each row', () => {
    const { container } = mount()
    const row1 = container.querySelector('[data-cy="daa-row-1"]') as HTMLElement
    expect(row1).toHaveTextContent('Default DUOS DAA')
    expect(row1).toHaveTextContent('NHGRI DAC')
    expect(row1).toHaveTextContent('2024-01-15')
    expect(row1).not.toHaveTextContent('1705276800')
    const row2 = container.querySelector('[data-cy="daa-row-2"]') as HTMLElement
    expect(row2).toHaveTextContent('GTEx Access Agreement')
    expect(row2).toHaveTextContent('GTEx DAC')
  })

  it('renders the correct status chip for each row', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-status-chip-authorized"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-2"] [data-cy="auth-status-chip-not_requested"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-3"] [data-cy="auth-status-chip-not_requested"]')).toBeInTheDocument()
  })

  it('renders Revoke button for authorized row and Authorize button for others', () => {
    const { container } = mount()
    expect(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-2"] [data-cy="auth-action-authorize"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="daa-row-3"] [data-cy="auth-action-authorize"]')).toBeInTheDocument()
  })

  it('calls onRevoke with the correct daaId when Revoke is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]') as HTMLElement)
    expect(revokeSpy).toHaveBeenCalledWith(1)
  })

  it('calls onAuthorize with the correct daaId when Authorize is clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(container.querySelector('[data-cy="daa-row-3"] [data-cy="auth-action-authorize"]') as HTMLElement)
    expect(authorizeSpy).toHaveBeenCalledWith(3)
  })

  it('renders empty table body when no DAA rows provided', () => {
    const { container } = mount([])
    expect(container.querySelector('[data-cy="daa-subtable"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy^="daa-row-"]')).not.toBeInTheDocument()
  })
})
