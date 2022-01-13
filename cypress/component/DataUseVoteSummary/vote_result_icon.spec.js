/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import VoteResultIcon from '../../../src/components/common/DataUseVoteSummary/VoteResultIcon';

const propKeyString = 'test';
describe('VoteResultIcon - Tests', function () {
  it('Shows a Yes result if the result is "true"', function () {
    mount(<VoteResultIcon result={true} propKey= {propKeyString}/>);
    cy.get(`.vote-result-box-${propKeyString}`).should('exist');
    cy.get(`.vote-result-yes-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-yes-text-${propKeyString}`).should('exist');
    cy.get(`.vote-result-yes-text-${propKeyString}`).contains("Yes");
  });
  it('Shows a No Result if the result is false', function() {
    mount(<VoteResultIcon result={false} propKey={propKeyString} />);
    cy.get(`.vote-result-box-${propKeyString}`).should('exist');
    cy.get(`.vote-result-no-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-no-text-${propKeyString}`).should('exist');
    cy.get(`.vote-result-no-text-${propKeyString}`).contains('No');
  });
  it('Shows a Under Review Result if the result is "underReview"', function () {
    mount(<VoteResultIcon result="underReview" propKey={propKeyString} />);
    cy.get(`.vote-result-box-${propKeyString}`).should('exist');
    cy.get(`.vote-result-under-review-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-under-review-text-${propKeyString}`).should('exist');
    cy.get(`.vote-result-under-review-text-${propKeyString}`).contains('Under Review');
  });
  it('Shows a Mixed Result if the result is "mixed"', function () {
    mount(<VoteResultIcon result="mixed" propKey={propKeyString} />);
    cy.get(`.vote-result-box-${propKeyString}`).should('exist');
    cy.get(`.vote-result-mixed-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-mixed-text-${propKeyString}`).should('exist');
    cy.get(`.vote-result-mixed-text-${propKeyString}`).contains(
      'Mixed'
    );
  });
  it('Shows a Legacy Result if the result is "legacy"', function () {
    mount(<VoteResultIcon result="legacy" propKey={propKeyString} />);
    cy.get(`.vote-result-box-${propKeyString}`).should('exist');
    cy.get(`.vote-result-legacy-text-${propKeyString}`).should('exist');
    cy.get(`.vote-result-legacy-text-${propKeyString}`).contains('N/A (Legacy)');
  });
});
