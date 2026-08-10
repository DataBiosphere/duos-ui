import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import TabControl from 'src/components/TabControl'

const labels = ['Tab One', 'Tab Two', 'Tab Three']

describe('TabControl', () => {
  it('renders a tab for each label', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    labels.forEach(label => expect(screen.getByRole('tab', { name: label })).toBeInTheDocument())
  })

  it('exposes the tabs as a tablist for assistive technology', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Tab Two' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls setSelectedTab with the clicked label', async () => {
    const setSelectedTab = vi.fn()
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={setSelectedTab} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tab Two' }))
    expect(setSelectedTab).toHaveBeenCalledWith('Tab Two')
  })

  it('renders loading placeholders instead of tabs when isLoading is true', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isLoading={true} />)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(document.querySelectorAll('.text-placeholder')).toHaveLength(labels.length)
  })

  it('renders tabs when isLoading is false', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isLoading={false} />)
    expect(screen.getAllByRole('tab')).toHaveLength(labels.length)
  })

  it('disables all tabs when isDisabled is true', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isDisabled={true} />)
    screen.getAllByRole('tab').forEach(tab => expect(tab).toBeDisabled())
  })

  it('does not disable tabs when isDisabled is false', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isDisabled={false} />)
    screen.getAllByRole('tab').forEach(tab => expect(tab).not.toBeDisabled())
  })

  it('selects no tab when the selected label is not among the tabs', () => {
    render(<TabControl labels={labels} selectedTab="Not A Tab" setSelectedTab={vi.fn()} />)
    screen.getAllByRole('tab').forEach(tab => expect(tab).toHaveAttribute('aria-selected', 'false'))
  })

  it('renders the tab-list container', () => {
    const { container } = render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    expect(container.querySelector('.tab-list')).toBeInTheDocument()
  })
})
