import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ElectionWithMemberVotesTable from 'src/components/vote_history_table/ElectionWithMemberVotesTable'
import { ElectionWithMemberVotes } from 'src/types/model'

const electionWithMemberVotes1: ElectionWithMemberVotes = {
  electionId: 2,
  electionType: 'DataAccess',
  finalVote: false,
  status: 'In Progress',
  createDate: new Date('2023-02-01T10:30:00-05:00').getTime(),
  lastUpdate: new Date('2023-02-05T10:30:00-05:00').getTime(),
  finalVoteDate: '',
  referenceId: 'REF67890',
  finalRationale: '',
  finalAccessVote: false,
  datasetId: 202,
  datasetIdentifier: 'DUOS-00202',
  displayId: 'E-002',
  dulName: 'Data Use Agreement',
  version: 2,
  archived: false,
  votes: {},
  progressReport: true,
  memberVotes: [
    {
      voteId: 3,
      userId: 103,
      createDate: '2023-02-02',
      electionId: 2,
      displayName: 'Alice Johnson',
      type: 'DAC',
      vote: true,
      rationale: 'Clear benefits',
      updateDate: new Date('2023-02-03T10:30:00-05:00').getTime(),
      isReminderSent: false,
      hasConcerns: false,
    },
    {
      voteId: 4,
      userId: 104,
      createDate: '2023-02-03',
      electionId: 2,
      displayName: 'Bob Brown',
      type: 'DAC',
      vote: false,
      rationale: 'Unclear methodology',
      updateDate: new Date('2023-02-04T10:30:00-05:00').getTime(),
      isReminderSent: true,
      hasConcerns: true,
    },
  ],
}

const electionWithMemberVotes2: ElectionWithMemberVotes = {
  electionId: 3,
  electionType: 'Data Access',
  finalVote: true,
  status: 'Closed',
  createDate: new Date('2023-01-15T10:30:00-05:00').getTime(),
  lastUpdate: new Date('2023-01-20T10:30:00-05:00').getTime(),
  finalVoteDate: '2023-01-20',
  referenceId: 'REF12345',
  finalRationale: 'All criteria met',
  finalAccessVote: true,
  datasetId: 303,
  datasetIdentifier: 'DUOS-00303',
  displayId: 'E-003',
  dulName: 'Data Use Limitation',
  version: 1,
  archived: false,
  votes: {},
  progressReport: false,
  memberVotes: [
    {
      voteId: 5,
      userId: 105,
      createDate: '2023-01-16T00:00:00Z',
      electionId: 3,
      displayName: 'Charlie Davis',
      type: 'Primary',
      vote: true,
      rationale: 'Meets all requirements',
      updateDate: new Date('2023-01-18T10:30:00-05:00').getTime(),
      isReminderSent: false,
      hasConcerns: false,
    },
    {
      voteId: 6,
      userId: 106,
      createDate: '2023-01-17T00:00:00Z',
      electionId: 3,
      displayName: 'Dana Lee',
      type: 'Secondary',
      isReminderSent: true,
      hasConcerns: false,
    },
  ],
}

const electionWithMemberVotes3: ElectionWithMemberVotes = {
  electionId: 4,
  electionType: 'Data Access',
  finalVote: false,
  status: 'In Progress',
  createDate: new Date('2023-03-10T10:30:00-05:00').getTime(),
  lastUpdate: new Date('2023-03-12T10:30:00-05:00').getTime(),
  finalVoteDate: '',
  referenceId: 'REF98765',
  finalRationale: '',
  finalAccessVote: false,
  datasetId: 404,
  datasetIdentifier: 'DUOS-00404',
  displayId: 'E-004',
  dulName: 'Data Sharing Agreement',
  version: 3,
  archived: false,
  votes: {},
  progressReport: true,
  memberVotes: [
    {
      voteId: 7,
      userId: 107,
      createDate: '2023-03-11',
      electionId: 4,
      displayName: 'Eve White',
      type: 'DAC',
      isReminderSent: false,
    },
    {
      voteId: 8,
      userId: 108,
      createDate: '2023-03-11',
      electionId: 4,
      displayName: 'Frank Green',
      type: 'DAC',
      isReminderSent: true,
    },
  ],
}

const electionHistory: ElectionWithMemberVotes[] = [electionWithMemberVotes1, electionWithMemberVotes2, electionWithMemberVotes3]

describe('ElectionWithMemberVotesTable', () => {
  it('renders the table with specific headers', () => {
    const { container } = render(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)
    expect(container.querySelectorAll('.column-header')).toHaveLength(6)
    const sortButtons = container.querySelectorAll('.cell-sort')
    expect(sortButtons[0]).toHaveTextContent('Request Type')
    expect(sortButtons[1]).toHaveTextContent('Dataset ID')
    expect(sortButtons[2]).toHaveTextContent('Election Date')
    expect(sortButtons[3]).toHaveTextContent('Election Status')
    expect(sortButtons[4]).toHaveTextContent('Votes Cast')
    expect(sortButtons[5]).toHaveTextContent('Vote Summary')
  })

  it('displays election rows with correct data in correct default order', () => {
    const { container } = render(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    const row0 = container.querySelectorAll('.row-data-0 [role="cell"]')
    expect(row0[0]).toHaveTextContent('Progress Report')
    expect(row0[1]).toHaveTextContent('DUOS-00404')
    expect(row0[2]).toHaveTextContent('2023-03-10')
    expect(row0[3]).toHaveTextContent('In Progress')
    expect(row0[4]).toHaveTextContent('0/2')
    expect(row0[5]).toHaveTextContent('No votes cast')

    const row1 = container.querySelectorAll('.row-data-1 [role="cell"]')
    expect(row1[0]).toHaveTextContent('Progress Report')
    expect(row1[1]).toHaveTextContent('DUOS-00202')
    expect(row1[2]).toHaveTextContent('2023-02-01')
    expect(row1[3]).toHaveTextContent('In Progress')
    expect(row1[4]).toHaveTextContent('2/2')
    expect(row1[5]).toHaveTextContent('1 Yes, 1 No')

    const row2 = container.querySelectorAll('.row-data-2 [role="cell"]')
    expect(row2[0]).toHaveTextContent('Initial DAR')
    expect(row2[1]).toHaveTextContent('DUOS-00303')
    expect(row2[2]).toHaveTextContent('2023-01-15')
    expect(row2[3]).toHaveTextContent('Closed')
    expect(row2[4]).toHaveTextContent('1/2')
    expect(row2[5]).toHaveTextContent(/1 Yes/)
  })

  it('expands and collapses election rows', async () => {
    const user = userEvent.setup()
    const { container } = render(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    await user.click(container.querySelector('[data-testid="ExpandMoreIcon"]')!)
    await waitFor(() =>
      expect(container.querySelector('[data-testid="ExpandLessIcon"]')).toBeInTheDocument(),
    )
    expect(container.querySelectorAll('.table-data').length).toBeGreaterThan(1)

    await user.click(container.querySelector('[data-testid="ExpandLessIcon"]')!)
    await waitFor(() =>
      expect(container.querySelector('[data-testid="ExpandMoreIcon"]')).toBeInTheDocument(),
    )
    expect(container.querySelectorAll('.table-data')).toHaveLength(1)
  })

  it('shows member vote dropdown when election is expanded', async () => {
    const user = userEvent.setup()
    render(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    await user.click(screen.getAllByTestId('ExpandMoreIcon')[0])
    await waitFor(() => expect(screen.getByText('Eve White')).toBeInTheDocument())

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Vote')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Rationale')).toBeInTheDocument()
    expect(screen.getByText('Eve White')).toBeInTheDocument()
    expect(screen.getByText('Frank Green')).toBeInTheDocument()
  })
})
