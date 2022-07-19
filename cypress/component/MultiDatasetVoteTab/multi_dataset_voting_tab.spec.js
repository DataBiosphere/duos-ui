/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import {Storage} from '../../../src/libs/storage';
import {User} from '../../../src/libs/ajax';
import MultiDatasetVotingTab, {votingColors} from '../../../src/pages/dar_collection_review/MultiDatasetVotingTab';
import {filterBucketsForUser} from '../../../src/pages/dar_collection_review/DarCollectionReview';
import {rpVoteKey} from '../../../src/utils/DarCollectionUtils';

const darInfo = {
  rus: 'test',
  diseases: true
};

const bucket1 = {
  key: 'bucket1',
  elections: [
    [
      {dataSetId: 300, electionId: 101, status: 'Open', electionType: 'DataAccess'},
      {electionId: 100, electionType: 'RP Vote'}
    ],
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        chairpersonVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        memberVotes: [
          {dacUserId: 100, displayName: 'Joe', electionId: 100, voteId: 1, createDate: 1},
          {dacUserId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1},
          {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1}
        ]
      },
      dataAccess: {
        finalVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: false},
        ],
        chairpersonVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: false},
        ],
        memberVotes: [
          {dacUserId: 100, displayName: 'Joe', rationale: 'test', electionId: 101, voteId: 1, createDate: 1},
          {dacUserId: 200, displayName: 'Sarah', vote: false, rationale: 'rationale', electionId: 101, voteId: 2, createDate: 1},
          {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
        ]
      }
    },
  ],
  dataUses: [
    {code: 'GRU', description: 'Use is permitted for any research purpose'},
  ]
};

const bucket2 = {
  key: 'bucket2',
  elections: [
    [
      {dataSetId: 400, electionId: 101, status: 'Open', electionType: 'DataAccess'},
      {electionId: 100, electionType: 'RP Vote'}
    ],
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        chairpersonVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, createDate: 1},
        ],
        memberVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1},
          {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1}
        ]
      },
      dataAccess: {
        finalVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true},
        ],
        chairpersonVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true},
        ],
        memberVotes: [
          {dacUserId: 200, displayName: 'Sarah', vote: true, rationale: 'rationale2', electionId: 102, voteId: 4, createDate: 1},
          {dacUserId: 300, displayName: 'Matt', electionId: 102, voteId: 5, createDate: 1}
        ]
      }
    },
  ],
  dataUses: [
    {code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose'}
  ]
};

const collection = {
  datasets: [
    {dataSetId: 300},
    {dataSetId: 400}
  ],
  createUser: {
    libraryCards: [{id: 1}]
  }
};

const collectionMissingLibraryCard = {
  datasets: [
    {dataSetId: 300}
  ],
  createUser: {
    libraryCards: []
  }
};

beforeEach(() => {
  cy.stub(Storage, 'getCurrentUser').returns({userId: 200});
  cy.stub(User, 'getUserRelevantDatasets').returns([{dataSetId: 300}, {dataSetId: 400}]);
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

    cy.get('[datacy=rp-slab]').should('be.visible');
    cy.get('[datacy=rp-expanded]').should('not.exist');
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

    cy.get('[datacy=dataset-vote-slab]').should('be.visible');
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

    cy.get('[datacy=dataset-vote-slab]').should('be.visible');
    cy.contains('GRU');
    cy.contains('HMB');
  });

  it('Renders vote summary tables if isChair is true', function () {
    mount(
      <MultiDatasetVotingTab
        darInfo={darInfo}
        buckets={[bucket1]}
        collection={collection}
        isChair={true}
      />
    );

    cy.get('[datacy=dataset-vote-slab]').should('be.visible');
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

    cy.get('[datacy=dataset-vote-slab]').should('be.visible');
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

describe('filterBucketsForUser - Tests', function() {
  it('Filters out buckets if current user has no votes in it', function () {
    const currentUser = {userId: 100};
    const rpBucket = {isRP: true, key: rpVoteKey};
    const prefilteredBuckets = [rpBucket, bucket1, bucket2];

    const filteredBuckets = filterBucketsForUser(currentUser, prefilteredBuckets);
    expect(filteredBuckets).to.have.lengthOf(1);
    expect(filteredBuckets).to.deep.include(bucket1);
    expect(filteredBuckets).to.not.deep.include(bucket2);
    expect(filteredBuckets).to.not.deep.include(rpBucket);
  });

  it('Does not filter out buckets with votes by the current user', function () {
    const currentUser = {userId: 200};
    const rpBucket = {
      isRP: true,
      votes: [
        {
          rp: {
            memberVotes: [
              {dacUserId: 200, displayName: 'Sarah', vote: true, createDate: 1},
            ],
          }
        }
      ]
    };
    const prefilteredBuckets = [rpBucket, bucket1];

    const filteredBuckets = filterBucketsForUser(currentUser, prefilteredBuckets);
    expect(filteredBuckets).to.have.lengthOf(2);
    expect(filteredBuckets).to.deep.include(rpBucket);
    expect(filteredBuckets).to.deep.include(bucket1);
  });
});

