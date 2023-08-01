/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import MultiDatasetVoteSlab from '../../../src/components/collection_voting_slab/MultiDatasetVoteSlab';
import {Storage} from '../../../src/libs/storage';
import {Votes} from '../../../src/libs/ajax';
import {votingColors} from '../../../src/pages/dar_collection_review/MultiDatasetVotingTab';
import {ControlledAccessType} from '../../../src/libs/dataUseTranslation';

const openElection1 = {dataSetId: 10, electionId: 101, status: 'Open', electionType: 'DataAccess'};

const openElection2 = {dataSetId: 20, electionId: 102, status: 'Open', electionType: 'DataAccess'};

const closedElection = {dataSetId: 30, electionId: 103, status: 'Closed', electionType: 'DataAccess'};

const votesForOpenElection1 = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    memberVotes: [
      {userId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1},
      {userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
      {userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
    ]
  }
};

const votesForOpenElection2 = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah',  vote: true, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
    ],
    memberVotes: [
      {userId: 100, displayName: 'Joe', rationale: 'test2', electionId: 102, voteId: 4, createDate: 2},
      {userId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
      {userId: 300, displayName: 'Matt', vote: false, electionId: 102, voteId: 6}
    ]
  }
};

const votesForClosedElection = {
  dataAccess: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
    ],
    memberVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
      {userId: 300, displayName: 'Matt', vote: true, rationale: 'test3', electionId: 103, voteId: 8}
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
            {code: 'GRU', description: 'Use is permitted for any research purpose', type: ControlledAccessType.permissions},
            {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose', type: ControlledAccessType.permissions},
            {code: 'NCU', description: 'The dataset will be used in a study related to a commercial purpose.', type: ControlledAccessType.modifiers}
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
    cy.contains(ControlledAccessType.modifiers);
    cy.contains('NCU');
    cy.contains('The dataset will be used in a study related to a commercial purpose.');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Replaces vote buttons with vote result text when all current user votes match (Chair)', function() {
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'YES');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
    cy.get('[datacy=no-collection-vote-button]').click();
    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders NOT SELECTED vote result text if no votes for current user in bucket', function() {
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NOT SELECTED');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders NOT SELECTED vote result text if some elections are closed and current votes do not match', function() {
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NOT SELECTED');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Renders vote result text if some elections are closed and current votes do match', function() {
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'YES');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Replaces vote buttons with vote result text when readOnly is true', function() {
    mount(
      <MultiDatasetVoteSlab
        title={'GROUP 1'}
        bucket={{
          elections: [openElection1, openElection2],
          votes: [votesForOpenElection1, votesForOpenElection2]
        }}
        dacDatasetIds={[10, 20]}
        isChair={false}
        readOnly={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    cy.get('[datacy=chair-vote-info]').should('not.exist');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('[datacy=chair-vote-info]').should('not.exist');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    cy.get('[datacy=chair-vote-info]').should('exist');
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
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
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', '- -');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });

  it('Renders send reminder button when user is chair and no vote', function() {
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
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'Send Reminder');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });
});