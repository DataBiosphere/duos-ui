import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VotingHistoryOverview from 'src/pages/dar_application/VotingHistoryOverview'

const mockDar = {
  referenceId: 'DAR-123',
  piName: 'Jane Doe',
  institution: 'Test University',
  status: 'Closed',
}

const mockVotes = [
  {
    datasetName: 'Dataset A',
    voteDate: 'June 1, 2024',
    requestType: 'Initial DAR',
    linkedDarId: 'COLL-1',
    voteResult: {
      decision: 'Approved',
      rationale: 'This is a detailed rationale for approval that is quite long and should be truncated in the table view.',
    },
    status: 'Closed',
  },
  {
    datasetName: 'Dataset B',
    voteDate: 'June 2, 2024',
    requestType: 'Progress Report',
    linkedDarId: 'COLL-2',
    voteResult: {
      decision: 'Denied',
      rationale: 'Short rationale.',
    },
    status: 'Closed',
  },
]

describe('VotingHistoryOverview', () => {
  it('renders the DAR overview and voting history table', () => {
    const { container } = render(<VotingHistoryOverview dar={mockDar} votes={mockVotes} />)
    expect(screen.getByText('Voting History')).toBeInTheDocument()
    expect(screen.getByText('Application/DAR ID:')).toBeInTheDocument()
    expect(screen.getByText('Current Status:')).toBeInTheDocument()
    expect(screen.getByText('DAR and Progress Report Voting History')).toBeInTheDocument()
    expect(screen.getByText('Dataset A')).toBeInTheDocument()
    expect(screen.getByText('Dataset B')).toBeInTheDocument()
    expect(container.querySelector('.dar-overview')).toHaveTextContent('DAR-123')
    expect(container.querySelector('.dar-overview')).toHaveTextContent('Jane Doe (Test University)')
    expect(container.querySelector('.dar-overview')).toHaveTextContent('Closed')
  })

  it('renders vote results with truncated rationale and toggles full rationale', async () => {
    const user = userEvent.setup()
    render(<VotingHistoryOverview dar={mockDar} votes={mockVotes} />)

    const viewButtons = screen.getAllByText('View Rationale')
    expect(viewButtons).toHaveLength(2)

    await user.click(viewButtons[0])
    const hideButton = screen.getByText('Hide Rationale')
    expect(hideButton).toBeInTheDocument()
    expect(hideButton.closest('[role="cell"]')).toHaveTextContent(mockVotes[0].voteResult.rationale)

    await user.click(screen.getByText('Hide Rationale'))
    expect(screen.getAllByText('View Rationale')).toHaveLength(2)
  })

  it('renders correct links for linked DAR IDs', () => {
    const { container } = render(<VotingHistoryOverview dar={mockDar} votes={mockVotes} />)
    const link1 = container.querySelector('a[href="/dar_application_review/COLL-1"]')
    const link2 = container.querySelector('a[href="/dar_application_review/COLL-2"]')
    expect(link1).toHaveTextContent('DAR-123')
    expect(link2).toHaveTextContent('DAR-123')
  })

  it('renders all vote statuses', () => {
    const { container } = render(<VotingHistoryOverview dar={mockDar} votes={mockVotes} />)
    const closedCells = Array.from(container.querySelectorAll('[role="cell"]')).filter(
      el => el.textContent === 'Closed',
    )
    expect(closedCells).toHaveLength(2)
  })
})
