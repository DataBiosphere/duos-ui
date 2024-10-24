/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import {Storage} from '../../../src/libs/storage';
import { User } from '../../../src/libs/ajax/User';
import MultiDatasetVotingTab, {votingColors} from '../../../src/pages/dar_collection_review/MultiDatasetVotingTab';
import {ControlledAccessType} from '../../../src/libs/dataUseTranslation';

const darInfo = {
  rus: 'test',
  diseases: true
};

const bucket1 = {
  key: 'bucket1',
  elections: [
    [
      {datasetId: 300, electionId: 101, status: 'Open', electionType: 'DataAccess'},
      {electionId: 100, electionType: 'RP Vote'}
    ],
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        chairpersonVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        memberVotes: [
          {userId: 100, displayName: 'Joe', electionId: 100, voteId: 1, createDate: 1},
          {userId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1},
          {userId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1}
        ]
      },
      dataAccess: {
        finalVotes: [
          {userId: 200, displayName: 'Sarah', vote: false},
        ],
        chairpersonVotes: [
          {userId: 200, displayName: 'Sarah', vote: false},
        ],
        memberVotes: [
          {userId: 100, displayName: 'Joe', rationale: 'test', electionId: 101, voteId: 1, createDate: 1},
          {userId: 200, displayName: 'Sarah', vote: false, rationale: 'rationale', electionId: 101, voteId: 2, createDate: 1},
          {userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
        ]
      }
    },
  ],
  dataUses: [
    {code: 'GRU', description: 'Use is permitted for any research purpose', type: ControlledAccessType.permissions},
  ]
};

const bucket2 = {
  key: 'bucket2',
  elections: [
    [
      {datasetId: 400, electionId: 101, status: 'Open', electionType: 'DataAccess'},
      {electionId: 100, electionType: 'RP Vote'}
    ],
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        chairpersonVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        memberVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1},
          {userId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1}
        ]
      },
      dataAccess: {
        finalVotes: [
          {userId: 200, displayName: 'Sarah', vote: true},
        ],
        chairpersonVotes: [
          {userId: 200, displayName: 'Sarah', vote: true},
        ],
        memberVotes: [
          {userId: 200, displayName: 'Sarah', vote: true, rationale: 'rationale2', electionId: 102, voteId: 4, createDate: 1},
          {userId: 300, displayName: 'Matt', electionId: 102, voteId: 5, createDate: 1}
        ]
      }
    },
  ],
  dataUses: [
    {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose', type: ControlledAccessType.permissions}
  ]
};

const collection = {
  datasets: [
    {datasetId: 300},
    {datasetId: 400}
  ],
  createUser: {
    libraryCards: [{id: 1}]
  }
};

const collectionMissingLibraryCard = {
  datasets: [
    {datasetId: 300}
  ],
  createUser: {
    libraryCards: []
  }
};

beforeEach(() => {
  cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
  cy.stub(User, 'getUserRelevantDatasets').returns([{datasetId: 300}, {datasetId: 400}]);
});

describe('MultiDatasetVoteTab - Tests', function() {
  it('Renders rp slab', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1]}
        collection={collection}
        isChair={false}
      />
    );

    cy.get('[data-cy=rp-slab]').should('be.visible');
    cy.get('[data-cy=rp-expanded]').should('not.exist');
    cy.contains('DS');
  });

  it('Renders dataset voting slab with vote button selected', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1]}
        collection={collection}
        isChair={false}
      />
    );

    cy.get('[data-cy=dataset-vote-slab]').should('be.visible');
    cy.contains('GRU');
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default);
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no);
  });

  it('Renders multiple dataset voting slabs', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1, bucket2]}
        collection={collection}
        isChair={false}
      />
    );

    cy.get('[data-cy=dataset-vote-slab]').should('be.visible');
    cy.contains('GRU');
    cy.contains('HMB');
  });

  it('Renders vote summary tables', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1]}
        collection={collection}
      />
    );

    cy.get('.table-data').should('not.exist');
    cy.get('#show-member-vote-dropdown').click();
    cy.get('.table-data').should('exist');
    cy.get('[data-cy=dataset-vote-slab]').should('be.visible');
    cy.get('.row-data-0').should('contain.text', 'Joe').should('contain.text', '- -');
    cy.get('.row-data-1').should('contain.text', 'Sarah').should('contain.text', 'No');
    cy.get('.row-data-2').should('contain.text', 'Matt').should('contain.text', 'Yes');
  });

  it('Does not render vote summary tables if isChair is false', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1, bucket2]}
        collection={collection}
        isChair={false}
      />
    );

    cy.get('[data-cy=dataset-vote-slab]').should('be.visible');
    cy.get('.table-data').should('not.exist');
  });

  it('Renders warning text that data access cannot be approved when the researcher is missing a library card', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1, bucket2]}
        collection={collectionMissingLibraryCard}
        isChair={true}
      />
    );

    cy.get('[id=missing_lc_alert]').should('be.visible');
  });

  it('Does not render warning text that data access cannot be approved when the researcher has a library card', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1, bucket2]}
        collection={collection}
        isChair={true}
      />
    );

    cy.get('[id=missing_lc_alert]').should('not.exist');
  });
});
