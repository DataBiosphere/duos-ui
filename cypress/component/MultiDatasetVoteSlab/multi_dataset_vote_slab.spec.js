/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import MultiDatasetVoteSlab from "../../../src/components/collection_voting_slab/MultiDatasetVoteSlab";
import {Storage} from "../../../src/libs/storage";
import {Votes} from "../../../src/libs/ajax";

const openElection1 = [
  {dataSetId: 10, electionId: 101, status: 'Open', electionType: 'DataAccess'},
  {electionType: 'RP Vote'}
];

const openElection2 = [
  {dataSetId: 20, electionId: 102, status: 'Open', electionType: 'DataAccess'},
  {electionType: 'RP Vote'}
];

const closedElection =  [
  {dataSetId: 30, electionId: 103, status: 'Closed', electionType: 'DataAccess'},
  {electionType: 'RP Vote'}
];

const votesForOpenElection1 = {
  dataAccess: {
    finalVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    chairpersonVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    memberVotes: [
      {dacUserId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1},
      {dacUserId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
      {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
    ]
  }
};

const votesForOpenElection2 = {
  dataAccess: {
    finalVotes: [
      {dacUserId: 200, displayName: 'Sarah',  vote: true, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
    ],
    chairpersonVotes: [
      {dacUserId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
    ],
    memberVotes: [
      {dacUserId: 100, displayName: 'Joe', rationale: 'test2', electionId: 102, voteId: 4, createDate: 2},
      {dacUserId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
      {dacUserId: 300, displayName: 'Matt', vote: false, electionId: 102, voteId: 6}
    ]
  }
};

const votesForClosedElection = {
  dataAccess: {
    finalVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
    ],
    chairpersonVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
    ],
    memberVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
      {dacUserId: 300, displayName: 'Matt', vote: true, rationale: 'test3', electionId: 103, voteId: 8}
    ]
  }
};

describe('MultiDatasetVoteSlab - Tests', function() {
  it('Renders data use pills', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          dataUses: [
            {code: 'GRU', description: 'Use is permitted for any research purpose'},
            {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose'}
          ]
        }}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );

    cy.contains('GRU');
    cy.contains('Use is permitted for any research purpose');
    cy.contains('HMB');
    cy.contains('Use is permitted for a health, medical, or biomedical research purpose');
  });

  it('Renders a selected vote button when all current user votes match (Member)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(218, 0, 3)');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders a disabled selected vote button when all current user votes match (Chair)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1],
          votes: [votesForOpenElection1]
        }}
        dacDatasetIds={[10]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Member)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Chair)', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('not.be.disabled');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders unselected disabled vote buttons if no votes for current user in bucket', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        dacDatasetIds={[30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders unselected disabled vote buttons if some elections are closed and current votes do not match', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        dacDatasetIds={[20, 30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=yes-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders selected disabled vote buttons if some elections are closed and current votes do match', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, closedElection],
          votes: [votesForOpenElection1, votesForClosedElection]
        }}
        dacDatasetIds={[10, 30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('[dataCy=no-collection-vote-button]').click();
    cy.get('[dataCy=yes-collection-vote-button]').should('have.css', 'background-color', 'rgb(31, 163, 113)');
    cy.get('[dataCy=no-collection-vote-button]').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('textarea').should('be.disabled');
  });

  it('Does not render pie chart or vote summary table when current user is not chairperson', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        dacDatasetIds={[30]}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 300});

    cy.get('[dataCy=chair-vote-info]').should('not.exist');
  });

  it('Does not render pie chart or table when current user is chairperson but no votes for dac in this bucket', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        dacDatasetIds={[30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});

    cy.get('[dataCy=chair-vote-info]').should('not.exist');
  });

  it('Renders a pie chart with votes for dac of user when current user is chairperson', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [closedElection],
          votes: [votesForClosedElection]
        }}
        dacDatasetIds={[30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 300});

    cy.get('[dataCy=chair-vote-info]').should('exist');
  });

  it('Does not render rows of vote summary table for votes outside of dac for current user', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        dacDatasetIds={[10, 30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});

    const component = cy.get('.table-data');
    component.should('exist');
    component.should('contain', 'test1');
    component.should('contain', 'test2');
    component.should('not.contain', 'test3');
  });

  it('Renders collapsed row of vote summary table when the same user has same vote for multiple elections', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection2, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 200});

    cy.get('.table-data').should('exist');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders collapsed row with appended rationales when the same user has same vote but different rationales for multiple elections', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});

    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'test1\ntest2');
  });

  it('Does not append rationale values when properties are undefined', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2, closedElection],
          votes: [votesForOpenElection2, votesForClosedElection]
        }}
        dacDatasetIds={[10, 30]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 200});

    cy.get('.table-data').should('exist').should('not.contain', 'undefined');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders separate row with when the same user has different vote for multiple elections', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});

    cy.get('.table-data').should('exist');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', 'No');
    cy.get('.row-data-3').should('contain.text', 'Matt').should('contain.text', 'Yes');
  });

  it('Renders filler text when some fields of vote are empty', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection2],
          votes: [votesForOpenElection2]
        }}
        dacDatasetIds={[20]}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({dacUserId: 100});

    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', '- -');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });
});