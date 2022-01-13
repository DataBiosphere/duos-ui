/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import VoteResultContainer from '../../../src/components/common/DataUseVoteSummary/VoteResultContainer';

const finalVotes = [{vote: true}];
const rpVotes = [{vote: true}, {vote: false}];
const label = "Test Label";
const propKey = 'Test-Label';
const additionalLabelStyle = {};
const legacyFlag = false;

describe('VoteResultLabel - Tests', function () {
  context('Legacy Flag', function() {
    it('Renders a Legacy result if the flag is true and multiple votes were submitted', function () {
      mount(
        <VoteResultContainer
          finalVotes={rpVotes}
          label={label}
          additionalLabelStyle={additionalLabelStyle}
          legacyFlag={true}
        />
      );
      const container = cy.get('.vote-summary-container');
      const result = cy.get(`.vote-result-legacy-text-${propKey}`);
      container.should('exist');
      result.contains("N/A (Legacy)");
      cy.contains(`.vote-result-label-text-${propKey}`, label);
    });
    it('Renders "Under Review if legacy flag is true but not all votes are in', function() {
      mount(
        <VoteResultContainer
          finalVotes={rpVotes}
          label={label}
          additionalLabelStyle={additionalLabelStyle}
          legacyFlag={true}
        />
      );
      const container = cy.get('.vote-summary-container');
      container.should('exist');
    });
  });
});
