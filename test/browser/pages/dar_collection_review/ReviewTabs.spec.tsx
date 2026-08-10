import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import TabControl from 'src/components/TabControl'
import { tabStyleOverride } from 'src/pages/dar_collection_review/reviewTabStyles'

const labels = ['Full DAR', 'Chair Vote', 'Voting History']

const renderTabs = () =>
  render(
    <TabControl
      labels={labels}
      selectedTab="Voting History"
      setSelectedTab={vi.fn()}
      styleOverride={tabStyleOverride}
    />,
  )

describe('DAR review tabs - hover layout stability (browser)', () => {
  it('does not move or resize the tabs when hovering an unselected tab', () => {
    renderTabs()
    const tabs = labels.map(label => screen.getByRole('button', { name: label }))
    const before = tabs.map(tab => tab.getBoundingClientRect())

    fireEvent.mouseEnter(tabs[0])
    const after = tabs.map(tab => tab.getBoundingClientRect())

    after.forEach((rect, index) => {
      expect(rect.width).toBeCloseTo(before[index].width, 1)
      expect(rect.left).toBeCloseTo(before[index].left, 1)
    })
  })

  it('keeps the selected tab underlined and bold while hovered', () => {
    renderTabs()
    const selectedTab = screen.getByRole('button', { name: 'Voting History' })

    fireEvent.mouseEnter(selectedTab)

    const computed = window.getComputedStyle(selectedTab)
    expect(computed.fontWeight).toBe('600')
    expect(computed.borderBottomWidth).toBe('2px')
    expect(computed.borderBottomStyle).toBe('solid')
  })
})
