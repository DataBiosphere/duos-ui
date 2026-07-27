import React, { useState } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { ScrollableTabs } from 'src/pages/dar_application/ScrollableTabs'

const mockApplicationTabs = [
  { id: 'researcher-info', name: 'Researcher Information', showStep: true },
  { id: 'data-access-request', name: 'Data Access Request', showStep: true },
  { id: 'research-purpose-statement', name: 'Research Purpose Statement', showStep: true },
]

const WrappedScrollableTabs = ({ initialTabId }: { initialTabId?: string }) => {
  const [selectedTab, setSelectedTab] = useState(initialTabId)
  return (
    <ScrollableTabs
      applicationTabs={mockApplicationTabs}
      formSelectedTabId={selectedTab}
      onTabChange={setSelectedTab}
    />
  )
}

describe('ScrollableTabs', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.getElementById('data-access-request')?.remove()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={mockApplicationTabs} />
      </BrowserRouter>,
    )
    expect(container.querySelector('.multi-step-buttons-container')).toBeInTheDocument()
  })

  it('renders the correct number of tabs', () => {
    render(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={mockApplicationTabs} />
      </BrowserRouter>,
    )
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('selects tab based on formSelectedTabId', () => {
    render(
      <BrowserRouter>
        <WrappedScrollableTabs initialTabId="data-access-request" />
      </BrowserRouter>,
    )
    expect(screen.getByRole('tab', { name: /Data Access Request/ })).toHaveClass('Mui-selected')
    expect(screen.getByRole('tab', { name: /Researcher Information/ })).not.toHaveClass('Mui-selected')
  })

  it('selects first tab by default and clicking changes selection', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <WrappedScrollableTabs />
      </BrowserRouter>,
    )
    expect(screen.getByRole('tab', { name: /Researcher Information/ })).toHaveClass('Mui-selected')
    expect(screen.getByRole('tab', { name: /Data Access Request/ })).not.toHaveClass('Mui-selected')

    await user.click(screen.getByRole('tab', { name: /Data Access Request/ }))
    expect(screen.getByRole('tab', { name: /Data Access Request/ })).toHaveClass('Mui-selected')
  })

  it('renders step numbers in tab labels', () => {
    const { container } = render(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={mockApplicationTabs} />
      </BrowserRouter>,
    )
    const tabs = container.querySelectorAll('[role="tab"]')
    tabs.forEach((tab, index) => {
      expect(tab.querySelector('.step')).toHaveTextContent(`Step ${index + 1}`)
      expect(tab.querySelector('.title')).toHaveTextContent(mockApplicationTabs[index].name)
    })
  })

  it('renders tabs without step numbers when showStep is false', () => {
    const tabsWithoutSteps = mockApplicationTabs.map(tab => ({ ...tab, showStep: false }))
    const { container } = render(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={tabsWithoutSteps} />
      </BrowserRouter>,
    )
    expect(container.querySelector('.step')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.title')).toHaveLength(3)
  })

  it('selects last tab based on formSelectedTabId', () => {
    render(
      <BrowserRouter>
        <WrappedScrollableTabs initialTabId="research-purpose-statement" />
      </BrowserRouter>,
    )
    expect(screen.getByRole('tab', { name: /Research Purpose Statement/ })).toHaveClass('Mui-selected')
    expect(screen.getByRole('tab', { name: /Researcher Information/ })).not.toHaveClass('Mui-selected')
  })

  it('auto-selects tab when user scrolls to its section', async () => {
    // Only tab 2 is in the DOM. The scroll handler skips tab 1 (no element), finds
    // tab 2 at offsetTop=0 which satisfies scrollPos(0)+scrollBuffer(0)>=0, and calls
    // onTabChange. Tab 3 is absent so the lastElement override never fires.
    // offsetHeight must be non-zero so elementBottom > 0 and the range check passes.
    const el = document.createElement('div')
    el.id = 'data-access-request'
    Object.defineProperty(el, 'offsetHeight', { get: () => 1000, configurable: true })
    document.body.appendChild(el)

    const onTabChange = vi.fn()
    render(
      <BrowserRouter>
        <ScrollableTabs
          applicationTabs={mockApplicationTabs}
          formSelectedTabId="researcher-info"
          onTabChange={onTabChange}
        />
      </BrowserRouter>,
    )

    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => expect(onTabChange).toHaveBeenCalledWith('data-access-request'))
  })

  it('scroll-driven tab change does not trigger programmatic re-scroll', async () => {
    // Tab 2 in DOM so goToStep('data-access-request') *would* call scrollTo if invoked.
    // Tab 1 absent so the initial CASE 1 effect finds no element and skips scrollTo.
    // This isolates the assertion to the post-scroll CASE 1 run.
    const el = document.createElement('div')
    el.id = 'data-access-request'
    Object.defineProperty(el, 'offsetHeight', { get: () => 1000, configurable: true })
    document.body.appendChild(el)

    render(
      <BrowserRouter>
        <WrappedScrollableTabs initialTabId="researcher-info" />
      </BrowserRouter>,
    )

    window.dispatchEvent(new Event('scroll'))

    // Wait for CASE 2 debounce → onTabChange → React re-render → CASE 1 effect to complete
    await waitFor(
      () => expect(screen.getByRole('tab', { name: /Data Access Request/ })).toHaveClass('Mui-selected'),
    )

    // scrollHandlerUpdatedTab.current ref must have blocked CASE 1 from re-scrolling
    expect(scrollToSpy).not.toHaveBeenCalled()
  })
})
