import React from 'react'
import { mount } from 'cypress/react'
import ElectionWithMemberVotesTable from 'src/components/vote_history_table/ElectionWithMemberVotesTable'
import { ElectionWithMemberVotes } from 'src/types/model'

describe('ElectionWithMemberVotesTable Component Tests', () => {
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

  it('should render the table with specific headers', () => {
    mount(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    cy.get('.column-header').should('have.length', 6)
    cy.get(':nth-child(1) > .cell-sort').contains('Request Type')
    cy.get(':nth-child(2) > .cell-sort').contains('Dataset ID')
    cy.get(':nth-child(3) > .cell-sort').contains('Election Date')
    cy.get(':nth-child(4) > .cell-sort').contains('Election Status')
    cy.get(':nth-child(5) > .cell-sort').contains('Votes Cast')
    cy.get(':nth-child(6) > .cell-sort').contains('Vote Summary')
  })

  it('should display election rows with correct data in correct default order', () => {
    mount(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    cy.get('.row-data-0 > :nth-child(1)').contains('Progress Report')
    cy.get('.row-data-0 > :nth-child(2)').contains('DUOS-00404')
    cy.get('.row-data-0 > :nth-child(3)').contains('2023-03-10')
    cy.get('.row-data-0 > :nth-child(4)').contains('In Progress')
    cy.get('.row-data-0 > :nth-child(5)').contains('0/2')
    cy.get('.row-data-0 > :nth-child(6)').contains('No votes cast')

    cy.get('.row-data-1 > :nth-child(1)').contains('Progress Report')
    cy.get('.row-data-1 > :nth-child(2)').contains('DUOS-00202')
    cy.get('.row-data-1 > :nth-child(3)').contains('2023-02-01')
    cy.get('.row-data-1 > :nth-child(4)').contains('In Progress')
    cy.get('.row-data-1 > :nth-child(5)').contains('2/2')
    cy.get('.row-data-1 > :nth-child(6)').contains('1 Yes, 1 No')

    cy.get('.row-data-2 > :nth-child(1)').contains('Initial DAR')
    cy.get('.row-data-2 > :nth-child(2)').contains('DUOS-00303')
    cy.get('.row-data-2 > :nth-child(3)').contains('2023-01-15')
    cy.get('.row-data-2 > :nth-child(4)').contains('Closed')
    cy.get('.row-data-2 > :nth-child(5)').contains('1/2')
    cy.get('.row-data-2 > :nth-child(6)').contains('1 Yes')
  })

  it('should expand and collapse election rows', () => {
    mount(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)
    cy.get('.row-data-0 > :nth-child(1) > div > [data-testid="ExpandMoreIcon"]').click()
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1) > .table-data').should('exist')

    cy.get('.row-data-0 > :nth-child(1) > div > [data-testid="ExpandLessIcon"]').click()
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1) > .table-data').should('not.exist')
  })

  it('should show member vote dropdown when election is expanded', () => {
    mount(<ElectionWithMemberVotesTable electionsWithMemberVotes={electionHistory} />)

    cy.get('.row-data-0 > :nth-child(1) > div > [data-testid="ExpandMoreIcon"]').click()
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1)').contains('Name')
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1)').contains('Vote')
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1)').contains('Date')
    cy.get('[style="width: 80%; margin: auto;"] > :nth-child(1)').contains('Rationale')

    cy.get('.table-data > .row-data-0 > [style="width: 15%;"]').contains('Eve White')
    cy.get('.table-data > .row-data-1 > [style="width: 15%;"]').contains('Frank Green')
  })
})
