import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Actions from 'src/components/dar_collection_table/Actions'
import { DarCollectionSummary } from 'src/types/model'

// The app sets `html { font-size: 10px }` globally (src/styles/bootstrap_replacement.css),
// which every `rem` value in the app is sized against. This isolated component test doesn't
// load that global stylesheet, so it must set the same root font-size itself, or every `rem`
// in Actions.tsx renders at the browser's 16px default instead - double the real size.
beforeAll(() => {
  document.documentElement.style.fontSize = '10px'
})

afterAll(() => {
  document.documentElement.style.fontSize = ''
})

// Matches the `rowHeight` prop passed to <DataGrid> in DarCollectionTable.tsx.
const ROW_HEIGHT = 56

const baseCollection: DarCollectionSummary = {
  darCollectionId: 1,
  darCode: 'DAR-1',
  name: 'Test Collection',
  actions: ['Open', 'Vote', 'Cancel'],
  dacNames: ['DAC-A'],
  dacCode: '',
  datasetCount: 1,
  datasetIds: [1],
  expired: false,
  expiresAt: 0,
  institutionName: 'Broad',
  latestReferenceId: 'ref-1',
  progressReport: false,
  referenceIds: ['ref-1'],
  requiresSOApproval: false,
  researcherName: 'Jane',
  status: 'Open',
  submissionDate: 0,
}

const renderActionsInRow = (actions: string[] = baseCollection.actions) =>
  render(
    <MemoryRouter>
      <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Actions
          collection={{ ...baseCollection, actions }}
          consoleType="chair"
          showConfirmationModal={vi.fn()}
          goToVote={vi.fn()}
          actions={actions}
          status="Open"
        />
      </div>
    </MemoryRouter>,
  )

describe('Actions - button sizing within a single DataGrid row (browser)', () => {
  it('keeps every text button only slightly taller than its own font size', async () => {
    renderActionsInRow(['Open', 'Vote'])
    const openButton = await screen.findByText('Open')
    const rect = openButton.getBoundingClientRect()
    const fontSize = Number.parseFloat(window.getComputedStyle(openButton).fontSize)

    expect(rect.height).toBeLessThanOrEqual(ROW_HEIGHT)
    // "Only slightly taller than the font" - generous upper bound of 2x the font size,
    // well short of the old ~32px+ button height that overflowed a single row.
    expect(rect.height).toBeLessThan(fontSize * 2)
  })

  it('keeps the icon (Cancel) button fully within the row height', async () => {
    renderActionsInRow(['Cancel'])
    const cancelSpan = document.querySelector('.dar-actions-container span[id]') as HTMLElement
    expect(cancelSpan).not.toBeNull()
    const rect = cancelSpan.getBoundingClientRect()
    expect(rect.height).toBeLessThanOrEqual(ROW_HEIGHT)
  })

  it('does not overflow the row when several buttons render together', async () => {
    const { container } = renderActionsInRow(['Open', 'Vote', 'Cancel'])
    const actionsDiv = container.querySelector('.dar-actions-container') as HTMLElement
    const rowDiv = actionsDiv.parentElement as HTMLElement
    const actionsRect = actionsDiv.getBoundingClientRect()
    const rowRect = rowDiv.getBoundingClientRect()

    expect(actionsRect.bottom).toBeLessThanOrEqual(rowRect.bottom + 0.5)
    expect(actionsRect.top).toBeGreaterThanOrEqual(rowRect.top - 0.5)
  })

  it('is not affected by the (now-removed) narrow-viewport media query', async () => {
    renderActionsInRow(['Open'])
    const openButton = await screen.findByText('Open')
    const cs = window.getComputedStyle(openButton)
    // Regression guard for the bug that made every earlier size fix silently no-op: a
    // `@media (max-width: 1024px)` rule in dar_collection_table.css used `!important` to
    // re-inflate font-size/padding on any viewport under 1024px (the default headless
    // viewport is narrower than that), beating this component's inline styles outright.
    expect(cs.padding).toBe('0px 10px')
    expect(cs.fontSize).toBe('11px')
  })
})
