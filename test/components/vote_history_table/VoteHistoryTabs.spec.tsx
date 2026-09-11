import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoteHistoryTabs from 'src/components/vote_history_table/VoteHistoryTabs'

const tabs = [
  { key: 'chair', label: 'Chair Votes', count: 3 },
  { key: 'member', label: 'Member Votes', count: 0 },
]

describe('VoteHistoryTabs', () => {
  it('renders a tab per config entry', () => {
    render(<VoteHistoryTabs value="chair" onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: /Chair Votes/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Member Votes/ })).toBeInTheDocument()
  })

  it('marks only the active tab as selected and bold', () => {
    render(<VoteHistoryTabs value="member" onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: /Member Votes/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Chair Votes/ })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: /Member Votes/ })).toHaveStyle({ fontWeight: '700' })
    expect(screen.getByRole('tab', { name: /Chair Votes/ })).toHaveStyle({ fontWeight: 'normal' })
  })

  it('renders the count badge, including zero', () => {
    render(<VoteHistoryTabs value="chair" onChange={() => {}} tabs={tabs} />)
    // Counts render with locale formatting, so assert against toLocaleString() rather than a
    // hard-coded separator to stay correct under a non-en-US locale.
    expect(screen.getByText((3).toLocaleString())).toBeInTheDocument()
    expect(screen.getByText((0).toLocaleString())).toBeInTheDocument()
  })

  it('omits the count badge when a tab has no count', () => {
    render(<VoteHistoryTabs value="chair" onChange={() => {}} tabs={[{ key: 'chair', label: 'Chair Votes' }]} />)
    expect(screen.getByRole('tab', { name: 'Chair Votes' })).toBeInTheDocument()
  })

  it('calls onChange with the tab key when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<VoteHistoryTabs value="chair" onChange={onChange} tabs={tabs} />)
    await user.click(screen.getByRole('tab', { name: /Member Votes/ }))
    expect(onChange).toHaveBeenCalledWith('member')
  })
})
