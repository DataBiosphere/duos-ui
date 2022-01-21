/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import VoteResultContainer from '../../../src/components/common/DataUseVoteSummary/VoteResultContainer';

const label = "Test Label";
const propKey = 'Test-Label';
const additionalLabelStyle = {};

describe('VoteResultContainer - Tests', function () {
  it('Renders a Mixed result if ', function () {
    mount(
      <VoteResultContainer
        finalVotes={[{vote:true}, {vote:false}]}
        label={label}
        additionalLabelStyle={additionalLabelStyle}
      />
    );
    const container = cy.get('.vote-summary-container');
    const result = cy.get(`.vote-result-mixed-text-${propKey}`);
    container.should('exist');
    result.contains("Mixed");
    cy.contains(`.vote-result-label-text-${propKey}`, label);
  });

  it('Renders "Under Review if not all votes are in', function() {
    mount(
      <VoteResultContainer
        finalVotes={[{vote: undefined}]}
        label={label}
        additionalLabelStyle={additionalLabelStyle}
      />
    );
    const container = cy.get('.vote-summary-container');
    container.should('exist');
    const result = cy.get(`.vote-result-under-review-text-${propKey}`);
    result.contains('Under Review');
    cy.contains(`.vote-result-label-text-${propKey}`, label);
  });
  it('Renders "Yes" if all votes are true', function () {
    mount(
      <VoteResultContainer
        finalVotes={[{ vote: true }, {vote: true}]}
        label={label}
        additionalLabelStyle={additionalLabelStyle}
      />
    );
    const container = cy.get('.vote-summary-container');
    container.should('exist');
    const result = cy.get(`.vote-result-yes-text-${propKey}`);
    result.contains('Yes');
    cy.contains(`.vote-result-label-text-${propKey}`, label);
  });
  it('Renders "NO" if all votes are false', function () {
    mount(
      <VoteResultContainer
        finalVotes={[{ vote: false }, { vote: false }]}
        label={label}
        additionalLabelStyle={additionalLabelStyle}
      />
    );
    const container = cy.get('.vote-summary-container');
    container.should('exist');
    const result = cy.get(`.vote-result-no-text-${propKey}`);
    result.contains('No');
    cy.contains(`.vote-result-label-text-${propKey}`, label);
  });
});
