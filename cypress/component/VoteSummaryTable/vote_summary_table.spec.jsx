import React from 'react'
import VoteSummaryTable from 'src/components/vote_summary_table/VoteSummaryTable'

const dacVotes = [
  {
    displayName: 'John Doe',
    updateDate: 1642032000000,
    vote: false,
  },
]

describe('VoteSummaryTable - Tests', function () {
  it('Renders four columns of data', function () {
    cy.mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />,
    )
    cy.get('.column-header').should('have.length', 4)
  })

  it('Renders member decision in the vote column', function () {
    cy.mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />,
    )
    cy.get('.table-data').contains('No')
  })

  // this test works locally but fails on Github
  /*
  it('Formats date of vote to YYYY-MM-DD in date column', function() {
    cy.mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    cy.get('.table-data').contains("2022-01-12");
  });
  */

  it('Renders filler content for missing rationale', function () {
    cy.mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />,
    )
    cy.get('.table-data').contains('- -')
  })

  it('Renders skeleton table if isLoading is true', function () {
    cy.mount(
      <VoteSummaryTable
        isLoading={true}
      />,
    )
    cy.get('.table-data').should('exist')
    cy.get('.table-loading-placeholder').should('exist')
  })
})
