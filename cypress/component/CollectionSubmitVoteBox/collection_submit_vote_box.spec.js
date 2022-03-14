/* eslint-disable no-undef */
import React from 'react';
import CollectionSubmitVoteBox from "../../../src/components/collection_vote_box/CollectionSubmitVoteBox";
import {mount} from "@cypress/react";

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
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
  });

  it('does not render any buttons as selected if vote values are different', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('does not render any buttons as selected if vote values are null', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={[{voteId: 4}]}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=collection-vote-box]').should('exist');
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('does not render any buttons as selected if list of votes is empty', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={[]}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=collection-vote-box]').should('exist');
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('does not render any buttons as selected if list of votes is null', function() {
    mount(
      <CollectionSubmitVoteBox
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=collection-vote-box]').should('exist');
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('can always edit rationale textarea when vote is not final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
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
    cy.get('textarea').should('have.text', 'testsample test hello');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('textarea').type('{backspace}{backspace}');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'testsample test hel');
  });

  it('can always edit vote value when vote is not final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#DA0003');

  });

  it('can edit rationale textarea multiple times before voting when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('textarea').should('have.text', 'Optional: Describe your rationale or add comments here');
    cy.get('textarea').type('sample text');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample text');
    cy.get('textarea').type(' test');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample test test');
  });

  it('can not edit rationale textarea after voting when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('textarea').should('have.text', 'Optional: Describe your rationale or add comments here');
    cy.get('textarea').type('sample text');
    cy.get('textarea').blur();
    cy.get('textarea').should('have.text', 'sample text');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('textarea').should('be.disabled');
    cy.get('textarea').type('123');
    cy.get('textarea').blur();
    cy.get('textarea').type('sample text');
  });

  it('can only vote once when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMixed}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=yes-collection-vote-button]').should('be.disabled');
    cy.get('[dataCy=no-collection-vote-button]').should('be.disabled');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('can not vote if votes already have vote value when vote is final', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={true}
        question={"question"}
      />
    );
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
    cy.get('[dataCy=yes-collection-vote-button]').should('be.disabled');
    cy.get('[dataCy=no-collection-vote-button]').should('be.disabled');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', '#1FA371');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', '#FFFFFF');
  });

  it('renders success notification when vote update is successful', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={votesMatch}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('Successfully updated votes').should('exist');
  });

  it('renders error notification when vote update fails', function() {
    mount(
      <CollectionSubmitVoteBox
        votes={[{}, {voteId:123}]}
        isFinal={false}
        question={"question"}
      />
    );
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('Successfully updated votes').should('exist');
  });

});