/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import VoteSummaryTable from "../../../src/components/vote_summary_table/VoteSummaryTable";

const dacVotes = [
  {
    "displayName": "John Doe",
    "vote": {
      "updateDate": 1642032000000,
      "vote": false,
    }
  }
];

describe('VoteSummaryTable - Tests', function() {
  it('renders four columns of data', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 4);
  });

  it('renders "No" for the vote column', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    cy.contains("No");
  });

  it('formats date to YYYY-MM-DD in date column', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    cy.contains("2022-01-12");
  });

  it('renders filler content for missing rationale', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    cy.contains("- -");
  });

  it('should render skeleton table if isLoading is true', function() {
    mount(
      <VoteSummaryTable
        isLoading={true}
      />
    );
    const component = cy.get('.table-data');
    component.should('exist');
    const rows = cy.get('.placeholder-row-0');
    rows.should('exist');
  });
});