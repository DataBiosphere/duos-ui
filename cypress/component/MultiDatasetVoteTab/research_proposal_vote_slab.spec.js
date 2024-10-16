/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import ResearchProposalVoteSlab from '../../../src/components/collection_voting_slab/ResearchProposalVoteSlab';
import { Votes } from '../../../src/libs/ajax/Votes';
import {Storage} from '../../../src/libs/storage';
import {votingColors} from '../../../src/pages/dar_collection_review/MultiDatasetVotingTab';

const darInfoPrimaryUseManualReviewFalse = {
  'rus': 'test',
  'diseases': true
};

const darInfoSecondaryUseManualReviewTrue = {
  'stigmatizedDiseases': true
};

const darInfoPrimarySecondaryUse = {
  'diseases': true,
  'illegalBehavior': true
};

const primaryUseCode = 'DS';
const secondaryUseCode = 'OTHER';

const expandSlabLinkText = 'Expand to view Research Purpose and Vote';
const collapseSlabLinkText = 'Hide Research Use Statement (Narrative)';

const votesForElection1 = {
  rp: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
    ],
    memberVotes: [
      {userId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1},
      {userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
      {userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
    ]
  }
};

const votesForElection2 = {
  rp: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah',  vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1},
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

const votesForElection3 = {
  rp: {
    finalVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
    ],
    chairpersonVotes: [
      {userId: 200, displayName: 'Sarah', vote: true, electionId: 103, voteId: 7},
    ],
    memberVotes: [
      {userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
      {userId: 300, displayName: 'Matt', vote: true, rationale: 'test3', electionId: 103, voteId: 8}
    ]
  }
};

describe('ResearchProposalVoteSlab - Tests', function() {
  it('Does not render expanded view when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    cy.get('[data-cy=rp-slab]').should('be.visible');
    cy.get('[data-cy=rp-expanded]').should('not.exist');
  });

  it('Renders primary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    cy.contains(primaryUseCode);
    cy.get(secondaryUseCode).should('not.exist');
  });

  it('Renders secondary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />
    );
    cy.contains(secondaryUseCode);
    cy.get(primaryUseCode).should('not.exist');
  });

  it('Renders primary and secondary data use pills', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    cy.contains(primaryUseCode);
    cy.contains(secondaryUseCode);
  });

  it('Renders link to expand when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    cy.contains(expandSlabLinkText);
  });

  it('Renders link to collapse when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        bucket={{key: 'test'}}
      />
    );
    const link = cy.contains(expandSlabLinkText);
    link.click();
    cy.contains(collapseSlabLinkText);
  });

  it('Renders data use pills when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        bucket={{ key: 'test' }}
      />
    );
    const link = cy.contains(expandSlabLinkText);
    link.click();
    cy.contains(primaryUseCode);
    cy.contains(secondaryUseCode);
  });

  it('Renders research purpose when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        bucket={{key: 'test'}}
      />
    );
    const link = cy.contains(expandSlabLinkText);
    link.click();
    cy.get('[data-cy=research-purpose]').should('exist');
    cy.contains('test');
  });

  it('Does not render research purpose when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    cy.get('[data-cy=research-purpose]').should('not.exist');
    cy.get('test').should('not.exist');
  });

  it('Renders data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        bucket={{ key: 'test' }}
      />
    );

    const link = cy.contains(expandSlabLinkText);
    link.click();
    cy.get('[datacy=alert-box]').should('exist');
  });

  it('Does not render data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        bucket={{ key: 'test' }}
      />
    );
    const link = cy.contains(expandSlabLinkText);
    link.click();
    cy.get('[datacy=alert-box]').should('not.exist');
  });

  it('Does not render data use alert box when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />
    );
    cy.get('[datacy=alert-box]').should('not.exist');
  });

  it('Does not render data use summary when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        isLoading={true}
      />
    );
    cy.get(primaryUseCode).should('not.exist');
    cy.get(secondaryUseCode).should('not.exist');
  });

  it('Does not render link to expand/collapse when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        isLoading={true}
      />
    );
    cy.get('#expand-rp-vote-button').should('not.exist');
  });

  it('Renders skeleton when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={true}
      />
    );
    cy.get('.text-placeholder').should('exist');
  });

  it('Does not render skeleton when not loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={false}
      />
    );
    cy.get('.text-placeholder').should('not.exist');
  });

  it('Renders a selected vote button when all current user votes match (Member)', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders a selected vote button when all current user votes match (Chair)', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Member)', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders vote button unselected when not all current user votes match (Chair)', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2, votesForElection3]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=yes-collection-vote-button]').click();
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('textarea').should('not.be.disabled');
  });

  it('Renders NOT SELECTED vote result text if no votes for current user in bucket', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection3]
        }}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NOT SELECTED');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Replaces vote buttons with vote result text when readOnly is true', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={false}
        readOnly={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
    cy.stub(Votes, 'updateVotesByIds');

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });

  it('Does not render pie chart or vote summary table when current user is not chairperson', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection3]
        }}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[data-cy=chair-vote-info]').should('not.exist');
  });

  it('Does not render pie chart or table when current user is chairperson but no votes for dac in this bucket', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection3]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[data-cy=chair-vote-info]').should('not.exist');
  });

  it('Renders a pie chart with votes for dac of user when current user is chairperson', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection3]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 300});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('[data-cy=chair-vote-info]').should('exist');
  });

  it('Does not render rows of vote summary table for votes outside of dac for current user', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2, votesForElection3]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

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
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2, votesForElection2]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders collapsed row with appended rationales when the same user has same vote but different rationales for multiple elections', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'test1\ntest2');
  });

  it('Does not append rationale values when properties are undefined', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2, votesForElection3]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 200});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist').should('not.contain', 'undefined');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'test1');
  });

  it('Renders separate row with when the same user has different vote for multiple elections', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection1, votesForElection2]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', 'No');
    cy.get('.row-data-3').should('contain.text', 'Matt').should('contain.text', 'Yes');
  });

  it('Renders filler text when some fields of vote are empty', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2]
        }}
        isChair={false}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', '- -');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });

  it('Allows sending reminder if no vote', function() {
    mount(
      <ResearchProposalVoteSlab
        bucket={{
          votes: [votesForElection2]
        }}
        isChair={true}
      />
    );
    cy.stub(Storage, 'getCurrentUser').returns({userId: 100});

    const link = cy.contains(expandSlabLinkText);
    link.click();

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', 'Send Reminder');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', '- -');
  });

  it('shows the RP vote decision on the admin review page', () => {
    mount(<ResearchProposalVoteSlab
      bucket={{
        votes: [votesForElection2],
      }}
      isChair={false}
      adminPage={true}
    />);
    cy.get('#expand-rp-vote-button').click();
    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'The final vote is: NO');
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist');
    cy.get('[datacy=no-collection-vote-button]').should('not.exist');
    cy.get('textarea').should('be.disabled');
  });
});