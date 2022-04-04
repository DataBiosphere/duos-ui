/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import ResearchProposalVoteSlab from "../../../src/components/collection_voting_slab/ResearchProposalVoteSlab";
import MultiDatasetVoteSlab from "../../../src/components/collection_voting_slab/MultiDatasetVoteSlab";
import {h} from "react-hyperscript-helpers";

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
    memberVotes: [
      {dacUserId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1},
      {dacUserId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1},
      {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1}
    ]
  }
};

const votesForOpenElection2 = {
  dataAccess: {
    memberVotes: [
      {dacUserId: 100, displayName: 'Joe', rationale: 'test2', electionId: 102, voteId: 4, createDate: 2},
      {dacUserId: 200, displayName: 'Sarah', rationale: 'test1', vote: false, electionId: 102, voteId: 5, createDate: 1},
      {dacUserId: 300, displayName: 'Matt', vote: false, electionId: 102, voteId: 6}
    ]
  }
};

const votesForClosedElection = {
  dataAccess: {
    memberVotes: [
      {dacUserId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7},
      {dacUserId: 300, displayName: 'Matt', vote: true, electionId: 103, voteId: 8}
    ]
  }
};

describe('ResearchProposalVoteSlab - Tests', function() {
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
        collectionDatasets={[
          {dataSetId: 385, name: 'Dataset 1', datasetIdentifier: 'DUOS-1'},
          {dataSetId: 415, name: 'Dataset 2', datasetIdentifier: 'DUOS-2'},
        ]}
        isChair={true}
      />
    );

    cy.contains('GRU');
    cy.contains('Use is permitted for any research purpose');
    cy.contains('HMB');
    cy.contains('Use is permitted for a health, medical, or biomedical research purpose');
  });

  it('Renders a selected vote button when all current user votes match', function() {

  });

  it('Renders vote button unselected when not all current user votes match', function() {

  });

  it('Renders unselected disabled vote buttons if no votes for current user in bucket', function() {

  });

  it('Renders unselected disabled vote buttons if some elections are closed and current votes do not match', function() {

  });

  it('Renders selected disabled vote buttons if some elections are closed and current votes do match', function() {

  });

  it('Does not render pie chart or vote summary table when current user is not chairperson', function() {

  });

  it('Does not render pie chart or table when current user is chairperson but no votes for dac in this bucket', function() {

  });

  it('Renders a pie chart with votes for dac of user when current user is chairperson', function() {

  });

  it('Does not render rows of vote summary table for votes outside of dac for current user', function() {

  });

  it('Renders collapsed row of vote summary table when the same user has same vote for multiple elections', function() {

  });

  it('Renders collapsed row with appended dates/rationales when the same user has same vote but different dates / rationales for multiple elections', function() {

  });

  it('Does not append date/rationale values when properties are undefined', function() {

  });

  it('Renders separate row with when the same user has different vote for multiple elections', function() {

  });

  it('Renders filler text when some fields of vote are empty', function() {

  });
});