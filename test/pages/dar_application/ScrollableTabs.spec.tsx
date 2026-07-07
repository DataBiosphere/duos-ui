import React, { useState } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
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
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

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
})
