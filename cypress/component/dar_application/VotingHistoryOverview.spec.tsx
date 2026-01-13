import React from 'react'
import VotingHistoryOverview from 'src/pages/dar_application/VotingHistoryOverview'

describe('VotingHistoryOverview', () => {
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

  beforeEach(() => {
    cy.mount(
      <VotingHistoryOverview dar={mockDar} votes={mockVotes} />,
    )
  })

  it('renders the DAR overview and voting history table', () => {
    cy.contains('Voting History')
    cy.contains('Application/DAR ID:')
    cy.contains('DAR-123')
    cy.contains('Jane Doe (Test University)')
    cy.contains('Current Status:')
    cy.contains('Closed')
    cy.contains('DAR and Progress Report Voting History')
    cy.contains('Dataset A')
    cy.contains('Dataset B')
  })

  it('renders vote results with truncated rationale and toggles full rationale', () => {
    cy.contains('View Rationale').first().click()
    cy.contains('Hide Rationale')
    cy.contains(mockVotes[0].voteResult.rationale)
    cy.contains('Hide Rationale').click()
    cy.contains('View Rationale')
  })

  it('renders correct links for linked DAR IDs', () => {
    cy.get('a[href="/dar_application_review/COLL-1"]').should('contain', 'DAR-123')
    cy.get('a[href="/dar_application_review/COLL-2"]').should('contain', 'DAR-123')
  })

  it('renders all vote statuses', () => {
    cy.get('div[role="cell"]').filter(':contains("Closed")').should('have.length', 2)
  })
})
