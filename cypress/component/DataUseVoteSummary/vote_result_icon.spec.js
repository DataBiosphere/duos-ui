/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import VoteResultIcon from '../../../src/components/common/DataUseVoteSummary/VoteResultIcon';

const propKeyString = 'test';
describe('VoteResultIcon - Tests', function () {
  it('Shows a Yes result if all votes are true', function () {
    mount(
      <VoteResultIcon
        votes={[{ vote: true }, {vote: true}]}
        propKey= {propKeyString}/>
    );
    cy.get(`.vote-result-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-yes-icon-${propKeyString}`).should('exist');
  });
  it('Shows a No Result if all votes are false', function() {
    mount(
      <VoteResultIcon
        votes={[{ vote: false }, { vote: false }]}
        propKey={propKeyString} />
    );
    cy.get(`.vote-result-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-no-icon-${propKeyString}`).should('exist');
  });
  it('Shows a Under Review Result if not all votes are in', function () {
    mount(
      <VoteResultIcon
        votes={[{vote: undefined}]}
        propKey={propKeyString}
      />
    );
    cy.get(`.vote-result-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-under-review-icon-${propKeyString}`).should('exist');
  });
  it('Shows a Mixed Result if there are true and false votes', function () {
    mount(
      <VoteResultIcon
        votes={[{vote:true}, {vote:false}]}
        propKey={propKeyString}
      />
    );
    cy.get(`.vote-result-icon-${propKeyString}`).should('exist');
    cy.get(`.vote-result-mixed-icon-${propKeyString}`).should('exist');
  });
});
