/* eslint-disable no-undef */
import React from 'react';
import CollectionSubmitVoteBox from "../../../src/components/collection_vote_box/CollectionSubmitVoteBox";
import {mount} from "@cypress/react";
import {Votes} from '../../../src/libs/ajax';

const votesMatch = [
  {vote: true, voteId: 1, rationale: "test"},
  {vote: true, voteId: 2, rationale: "test"},
  {vote: true, voteId: 3, rationale: "test"}
];

const votesMixed = [
  {vote: true, voteId: 1, rationale: "test1"},
  {vote: false, voteId: 2, rationale: "test2"},
];


describe('CollectionSubmitVoteBox - Tests', function() {
  it('renders yes vote button as selected if all vote values are true', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('does not render any buttons as selected if vote values are different', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('does not render any buttons as selected if vote values are null', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={[{voteId: 4}]}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=collection-vote-box]').should('exist');
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('does not render any buttons as selected if list of votes is empty', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={[]}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=collection-vote-box]').should('exist');
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('does not render any buttons as selected if list of votes is null', function() {
    mount(
      <CollectionSubmitVoteBox
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=collection-vote-box]').should('exist');
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('renders existing rationale if rationale is the same for all votes', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('textarea').should('have.text', 'test');
  });

  it('Does not render existing rationale in textarea if rationale different between votes', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('textarea').should('not.contain.text');
  });

  it('can always edit rationale textarea when vote is not final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('textarea').should('have.text', 'test');
    cy.get('textarea').type('sample text');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'testsample text');
    cy.get('textarea').type(' hello');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'testsample text hello');
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('textarea').type('{backspace}{backspace}');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'testsample text hel');
  });

  it('can always edit vote value when vote is not final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(218, 0, 3)');

  });

  it('can edit rationale textarea multiple times before voting when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('textarea').should('have.text', '');
    cy.get('textarea').type('sample text');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample text');
    cy.get('textarea').type(' test');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample text test');
  });

  it('can not edit rationale textarea after voting when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('textarea').should('have.text', '');
    cy.get('textarea').type('sample text');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample text');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('textarea').should('be.disabled');
  });

  it('can only vote once when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('can not vote if votes already have vote value when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('disables vote buttons and text area if page is loading', function () {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
        isLoading={true}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('disables vote buttons and text area if isDisabled prop is true', function () {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
        isDisabled={true}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('disables yes vote button if isApprovalDisabled is true', function () {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
        isDisabled={false}
        isApprovalDisabled={true}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('does not disable no vote button if isApprovalDisabled is true', function () {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
        isDisabled={false}
        isApprovalDisabled={true}
      />
    );
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(218, 0, 3)');
    cy.get('textarea').should('not.be.disabled');
  });

  it('renders a different heading if user is viewing from the admin page', () => {
    mount(<CollectionSubmitVoteBox
      votes={votesMixed}
      isFinal={false}
      question={'question'}
      isDisabled={false}
      isApprovalDisabled={true}
      adminPage={true}
    />);
    const heading = cy.get('.vote-subsection-heading');
    expect(heading).to.exist;
  });
});