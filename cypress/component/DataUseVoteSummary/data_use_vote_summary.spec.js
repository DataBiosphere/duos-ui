/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import DataUseVoteSummary from '../../../src/components/common/DataUseVoteSummary/DataUseVoteSummary';
import {rpVoteKey} from '../../../src/utils/DarCollectionUtils';

const buckets = [
  {
    key: rpVoteKey,
    isRP: true,
    votes: [{
      rp: {
        finalVotes: [{ dacUserId: 1, vote: true }, { dacUserId: 2, vote: true }]
      },
    }],
  },
  {
    key: 'Bucket 2',
    isRP: false,
    votes: [{
      dataAccess: {
        finalVotes: [{ dacUserId: 1, vote: false }, { dacUserId: 2, vote: false }]
      },
    }],
  },
];

const bucketsWithMultipleElections = [
  {
    key: rpVoteKey,
    isRP: true,
    votes: [
      {
        rp: {
          finalVotes: [{ dacUserId: 1, vote: true }, { dacUserId: 2, vote: true }]
        },
      },
      {
        rp: {
          finalVotes: [{ dacUserId: 3, vote: false }, { dacUserId: 4, vote: false }]
        },
      }
    ],
  },
  {
    key: 'Bucket 2',
    isRP: false,
    votes: [
      {
        dataAccess: {
          finalVotes: [{ dacUserId: 1, vote: true }, { dacUserId: 2, vote: true }]
        },
      },
      {
        dataAccess: {
          finalVotes: [{ dacUserId: 3, vote: false }, { dacUserId: 4, vote: false }]
        },
      }
    ],
  },
];

const bucketsWithMixedVotes = [
  {
    key: rpVoteKey,
    isRP: true,
    votes: [{
      rp: {
        finalVotes: [{ dacUserId: 1, vote: true }, { dacUserId: 2, vote: false }]
      },
    }],
  },
  {
    key: 'Bucket 2',
    isRP: false,
    votes: [{
      dataAccess: {
        finalVotes: [{ dacUserId: 1, vote: true }, { dacUserId: 2, vote: false }]
      },
    }],
  },
];

describe('DataUseVoteSummary - Tests', function() {
  it('renders a row of elements summarizing the vote result for each bucket', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={buckets}
        currentUser={{userId: 1}}
        isLoading={false}
      />
    );
    const component = cy.get('.vote-summary-header-component');
    component.should('exist');
    const rows = cy.get('.vote-summary-row');
    rows.should('have.length', 1);
    const bucketResult1 = cy.get('.vote-result-box-text-RUS-Vote');
    bucketResult1.should('exist');
    const bucketResult2 = cy.get('.vote-result-box-text-Bucket-2');
    bucketResult2.should('exist');
  });

  it('should not render if isLoading is true', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={buckets}
        currentUser={{userId: 1}}
        isLoading={true}
      />
    );
    const component = cy.get('.vote-summary-header-component');
    component.should('not.exist');
  });

  it('should not render if dataUseBuckets is empty', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={[]}
        currentUser={{userId: 1}}
        isLoading={true}
      />
    );
    cy.get('.vote-summary-header-component').should('not.exist');
  });

  it('filters out final votes outside of the current user\'s DAC if adminPage is false', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={bucketsWithMixedVotes}
        isLoading={false}
        currentUser={{userId: 1}}
        adminPage={false}
      />
    );

    cy.get('.vote-result-mixed-icon-RUS-Vote').should('exist');
    cy.get('.vote-result-mixed-icon-Bucket-2').should('exist');
  });

  it('includes final votes by other members of the current user\'s DAC when adminPage is false', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={bucketsWithMultipleElections}
        isLoading={false}
        currentUser={{userId: 1}}
        adminPage={true}
      />
    );

    cy.get('.vote-result-mixed-icon-RUS-Vote').should('exist');
    cy.get('.vote-result-mixed-icon-Bucket-2').should('exist');
  });

  it('includes all final votes to determine vote result if adminPage is true', function() {
    mount(
      <DataUseVoteSummary
        dataUseBuckets={bucketsWithMultipleElections}
        isLoading={false}
        currentUser={{userId: 1}}
        adminPage={true}
      />
    );

    cy.get('.vote-result-mixed-icon-RUS-Vote').should('exist');
    cy.get('.vote-result-mixed-icon-Bucket-2').should('exist');
  });
});