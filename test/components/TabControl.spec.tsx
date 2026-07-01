import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import TabControl from 'src/components/TabControl'

const labels = ['Tab One', 'Tab Two', 'Tab Three']

describe('TabControl', () => {
  it('renders a button for each label', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    labels.forEach(label => expect(screen.getByRole('button', { name: label })).toBeInTheDocument())
  })

  it('calls setSelectedTab with the clicked label', async () => {
    const setSelectedTab = vi.fn()
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={setSelectedTab} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tab Two' }))
    expect(setSelectedTab).toHaveBeenCalledWith('Tab Two')
  })

  it('renders loading placeholders instead of buttons when isLoading is true', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isLoading={true} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(document.querySelectorAll('.text-placeholder')).toHaveLength(labels.length)
  })

  it('renders buttons when isLoading is false', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isLoading={false} />)
    expect(screen.getAllByRole('button')).toHaveLength(labels.length)
  })

  it('disables all buttons when isDisabled is true', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isDisabled={true} />)
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled())
  })

  it('does not disable buttons when isDisabled is false', () => {
    render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} isDisabled={false} />)
    screen.getAllByRole('button').forEach(btn => expect(btn).not.toBeDisabled())
  })

  it('applies tabContainer styleOverride to the container div', () => {
    const styleOverride = { tabContainer: { backgroundColor: 'red' } }
    const { container } = render(
      <TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} styleOverride={styleOverride} />,
    )
    const tabList = container.querySelector('.tab-list') as HTMLElement
    expect(tabList.style.backgroundColor).toBe('red')
  })

  it('falls back to the default container style when no tabContainer override is given', () => {
    const { container } = render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    const tabList = container.querySelector('.tab-list') as HTMLElement
    expect(tabList.style.backgroundColor).toBe('white')
    expect(tabList.style.display).toBe('flex')
  })

  it('renders the tab-list container', () => {
    const { container } = render(<TabControl labels={labels} selectedTab="Tab One" setSelectedTab={vi.fn()} />)
    expect(container.querySelector('.tab-list')).toBeInTheDocument()
  })
})
