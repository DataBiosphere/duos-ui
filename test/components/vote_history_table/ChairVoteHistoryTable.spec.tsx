import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import ChairVoteHistoryTable from 'src/components/vote_history_table/ChairVoteHistoryTable'
import { VoteHistoryRow } from 'src/types/model'

const testData: VoteHistoryRow[] = [
  {
    voteId: 1,
    userId: 101,
    createDate: '2023-01-03',
    electionId: 201,
    displayName: 'Alice Johnson',
    type: 'Chair',
    datasetIdentifier: 'DUOS-00401',
    progressReport: true,
    electionDate: new Date('2023-01-03T10:30:00-05:00').getTime(),
    vote: true,
    updateDate: new Date('2023-01-04T10:30:00-05:00').getTime(),
    rationale: 'Approved',
  },
  {
    voteId: 2,
    userId: 102,
    createDate: '2023-01-01',
    electionId: 202,
    displayName: 'Bob Smith',
    type: 'Chair',
    datasetIdentifier: 'DUOS-00402',
    progressReport: false,
    electionDate: new Date('2023-01-01T10:30:00-05:00').getTime(),
    vote: false,
    updateDate: new Date('2023-01-02T10:30:00-05:00').getTime(),
    rationale: 'Rejected',
  },
  {
    voteId: 3,
    userId: 103,
    createDate: '2023-01-02',
    electionId: 203,
    displayName: 'Charlie Brown',
    type: 'Chair',
    datasetIdentifier: 'DUOS-00403',
    progressReport: true,
    electionDate: new Date('2023-01-02T10:30:00-05:00').getTime(),
    vote: false,
    updateDate: new Date('2023-01-03T10:30:00-05:00').getTime(),
  },
]

describe('ChairVoteHistoryTable', () => {
  it('renders the table with specific headers', () => {
    const { container } = render(<ChairVoteHistoryTable voteHistory={testData} />)
    expect(container.querySelectorAll('.column-header')).toHaveLength(8)
    const sortButtons = container.querySelectorAll('.cell-sort')
    expect(sortButtons[0]).toHaveTextContent('Request Type')
    expect(sortButtons[1]).toHaveTextContent('Dataset ID')
    expect(sortButtons[2]).toHaveTextContent('Election Date')
    expect(sortButtons[3]).toHaveTextContent('Vote')
    expect(sortButtons[4]).toHaveTextContent('Name')
    expect(sortButtons[5]).toHaveTextContent('Vote Date')
    expect(sortButtons[6]).toHaveTextContent('Vote Type')
    expect(sortButtons[7]).toHaveTextContent('Rationale')
  })

  it('renders rows with correct default sort (by vote date descending)', () => {
    const { container } = render(<ChairVoteHistoryTable voteHistory={testData} />)

    const row0 = container.querySelectorAll('.row-data-0 [role="cell"]')
    expect(row0[0]).toHaveTextContent('Progress Report')
    expect(row0[1]).toHaveTextContent('DUOS-00401')
    expect(row0[2]).toHaveTextContent('2023-01-03')
    expect(row0[3]).toHaveTextContent('Yes')
    expect(row0[4]).toHaveTextContent('Alice Johnson')
    expect(row0[5]).toHaveTextContent('2023-01-04')
    expect(row0[6]).toHaveTextContent('Chair')
    expect(row0[7]).toHaveTextContent('Approved')

    const row1 = container.querySelectorAll('.row-data-1 [role="cell"]')
    expect(row1[0]).toHaveTextContent('Progress Report')
    expect(row1[1]).toHaveTextContent('DUOS-00403')
    expect(row1[2]).toHaveTextContent('2023-01-02')
    expect(row1[3]).toHaveTextContent('No')
    expect(row1[4]).toHaveTextContent('Charlie Brown')
    expect(row1[5]).toHaveTextContent('2023-01-03')
    expect(row1[6]).toHaveTextContent('Chair')
    expect(row1[7]).toHaveTextContent('--')

    const row2 = container.querySelectorAll('.row-data-2 [role="cell"]')
    expect(row2[0]).toHaveTextContent('Initial DAR')
    expect(row2[1]).toHaveTextContent('DUOS-00402')
    expect(row2[2]).toHaveTextContent('2023-01-01')
    expect(row2[3]).toHaveTextContent('No')
    expect(row2[4]).toHaveTextContent('Bob Smith')
    expect(row2[5]).toHaveTextContent('2023-01-02')
    expect(row2[6]).toHaveTextContent('Chair')
    expect(row2[7]).toHaveTextContent('Rejected')
  })
})
