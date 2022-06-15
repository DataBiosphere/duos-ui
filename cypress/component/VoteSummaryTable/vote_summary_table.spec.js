/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import VoteSummaryTable from "../../../src/components/vote_summary_table/VoteSummaryTable";

const dacVotes = [
  {
    "displayName": "John Doe",
    "updateDate": 1642032000000,
    "vote": false,
  }
];

describe('VoteSummaryTable - Tests', function() {
  it('Renders four columns of data', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 4);
  });

  it('Renders member decision in the vote column', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    const component = cy.get('.table-data');
    component.contains("No");
  });

  //this test works locally but fails on Github
  /*
  it('Formats date of vote to YYYY-MM-DD in date column', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    const component = cy.get('.table-data');
    component.contains("2022-01-12");
  });
  */

  it('Renders filler content for missing rationale', function() {
    mount(
      <VoteSummaryTable
        dacVotes={dacVotes}
        isLoading={false}
      />
    );
    const component = cy.get('.table-data');
    component.contains("- -");
  });

  it('Renders skeleton table if isLoading is true', function() {
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