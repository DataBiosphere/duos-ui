import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import TabControl from 'src/components/TabControl'
import { reviewTabsSx } from 'src/pages/dar_collection_review/reviewTabStyles'

const labels = ['Full DAR', 'Chair Vote', 'Voting History']

const renderTabs = () =>
  render(
    <TabControl
      labels={labels}
      selectedTab="Voting History"
      setSelectedTab={vi.fn()}
      sx={reviewTabsSx}
    />,
  )

describe('DAR review tabs - hover layout stability (browser)', () => {
  it('does not move or resize the tabs when hovering an unselected tab', () => {
    renderTabs()
    const tabs = labels.map(label => screen.getByRole('tab', { name: label }))
    const before = tabs.map(tab => tab.getBoundingClientRect())

    fireEvent.mouseEnter(tabs[0])
    fireEvent.mouseOver(tabs[0])
    const after = tabs.map(tab => tab.getBoundingClientRect())

    after.forEach((rect, index) => {
      expect(rect.width).toBeCloseTo(before[index].width, 1)
      expect(rect.left).toBeCloseTo(before[index].left, 1)
    })
  })

  it('marks the selected tab without changing its font weight', () => {
    renderTabs()
    const selected = screen.getByRole('tab', { name: 'Voting History' })
    const unselected = screen.getByRole('tab', { name: 'Full DAR' })

    expect(selected).toHaveAttribute('aria-selected', 'true')
    // Selection is shown by colour and the indicator, so tabs keep their width as selection moves.
    expect(window.getComputedStyle(selected).fontWeight).toBe(window.getComputedStyle(unselected).fontWeight)
    expect(document.querySelector('.MuiTabs-indicator')).toBeInTheDocument()
  })
})
