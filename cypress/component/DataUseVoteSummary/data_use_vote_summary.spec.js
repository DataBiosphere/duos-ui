/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import DataUseVoteSummary from '../../../src/components/common/DataUseVoteSummary/DataUseVoteSummary';

const buckets = [
  {
    key: 'RP Vote',
    isRP: true,
    votes: [{
      rp: {
        finalVotes: [{ vote: true }, { vote: true }],
      },
    }],
  },
  {
    key: 'Bucket 2',
    isRP: false,
    votes: [{
      dataAccess: {
        finalVotes: [{ vote: false }, { vote: false }],
      },
    }],
  },
];

describe('DataUseVoteSummary - Tests', function() {
  it('renders a row of elements summarizing the vote result for each bucket', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={buckets}
        isLoading={false}
      />
    );
    const component = cy.get('.vote-summary-header-component');
    component.should('exist');
    const rows = cy.get('.vote-summary-row');
    rows.should('have.length', 1);
    const elements = cy.get('.vote-summary-container');
    elements.should('have.length', 2);
  });
  it('should not render if isLoading is true', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={buckets}
        isLoading={true}
      />
    );
    const component = cy.get('.vote-summary-header-component');
    component.should('not.exist');
  });
});