import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryTabs } from 'src/components/data_library/LibraryTabs'
import { AssetType } from 'src/types/library'

const tabs = [
  { key: AssetType.STUDIES, label: 'Studies' },
  { key: AssetType.DATASETS, label: 'Datasets' },
]

describe('LibraryTabs', () => {
  it('renders all tabs', () => {
    render(<LibraryTabs value={AssetType.STUDIES} onChange={() => {}} tabs={tabs} />)
    expect(screen.getByText('Studies')).toBeInTheDocument()
    expect(screen.getByText('Datasets')).toBeInTheDocument()
  })

  it('highlights the active tab with bold font weight', () => {
    render(<LibraryTabs value={AssetType.DATASETS} onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Datasets' })).toHaveStyle({ fontWeight: '700' })
    expect(screen.getByRole('tab', { name: 'Studies' })).toHaveStyle({ fontWeight: 'normal' })
  })

  it('renders scroll navigation buttons when tabs overflow', async () => {
    // MUI v9 uses IntersectionObserver to detect whether the first/last tab is out of view.
    // jsdom doesn't implement IntersectionObserver, so we provide a class-based mock that lets
    // us manually fire the callback to simulate overflow (last tab not visible).
    const observerCallbacks: IntersectionObserverCallback[] = []
    const savedIO = (global as Record<string, unknown>).IntersectionObserver
    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) { observerCallbacks.push(cb) }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(global, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    })
    try {
      const { container } = render(<LibraryTabs value={AssetType.STUDIES} onChange={() => {}} tabs={tabs} />)
      // MUI registers firstObserver (index 0) then lastObserver (index 1).
      // Firing the lastObserver with isIntersecting: false sets displayEndScroll → true,
      // which causes scroll buttons to render.
      act(() => {
        observerCallbacks[1]?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
      })
      await waitFor(() => {
        expect(container.querySelector('.MuiTabs-scrollButtons')).toBeInTheDocument()
      })
    }
    finally {
      Object.defineProperty(global, 'IntersectionObserver', {
        configurable: true,
        writable: true,
        value: savedIO,
      })
    }
  })

  it('renders the item count alongside the label when a count is provided', () => {
    const tabsWithCounts = [
      { key: AssetType.STUDIES, label: 'Studies', count: 1234 },
      { key: AssetType.DATASETS, label: 'Datasets', count: 0 },
    ]
    render(<LibraryTabs value={AssetType.STUDIES} onChange={() => {}} tabs={tabsWithCounts} />)
    // Counts render with locale formatting, including zero. Assert against
    // toLocaleString() (not a hard-coded separator) so the expectation matches
    // the runtime locale and the test isn't flaky under a non-en-US locale.
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument()
    expect(screen.getByText((0).toLocaleString())).toBeInTheDocument()
  })

  it('omits the count when a tab has no count (e.g. still loading)', () => {
    render(<LibraryTabs value={AssetType.STUDIES} onChange={() => {}} tabs={tabs} />)
    // Accessible name stays just the label so nothing extra is announced.
    expect(screen.getByRole('tab', { name: 'Studies' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Datasets' })).toBeInTheDocument()
  })

  it('calls onChange with the tab key when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LibraryTabs value={AssetType.STUDIES} onChange={onChange} tabs={tabs} />)
    await user.click(screen.getByRole('tab', { name: 'Datasets' }))
    expect(onChange).toHaveBeenCalledWith(AssetType.DATASETS)
  })
})
