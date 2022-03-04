/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from '@cypress/react';
import MemberActions from '../../../src/components/dar_collection_table/MemberActions';
import { cloneDeep } from 'lodash/fp';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;
const collectionSkeleton = {
  collectiond,
  dars: undefined
};

const votableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: { dacUserId: 2 },
        },
        datasetId: 1,
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        votes: {
          2: { dacUserId: 1 },
        },
        datasetId: 2,
      },
    },
  },
};

const submittedVoteDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: { dacUserId: 2, },
        },
        datasetId: 1,
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        votes: {
          2: { dacUserId: 1, vote: true },
        },
        datasetId: 2,
      },
    },
  },
};

const closedDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: { dacUserId: 2 },
        },
        datasetId: 1,
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Closed',
        votes: {
          2: { dacUserId: 1 },
        },
        datasetId: 2,
      },
    },
  }
};

const noVoteInDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: { dacUserId: 2 },
        },
        datasetId: 1,
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        votes: {},
        datasetId: 2,
      },
    },
  },
};

const noElectionsForDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        votes: {
          1: { dacUserId: 2 },
        },
        datasetId: 1,
      },
    },
  },
  2: {
    elections: {},
  },
};

const user = {
  dacUserId: 1,
  roles: [
    {
      dacId: 2,
    },
    {}, //not all roles are tied to a DAC, this is a stub for those roles
    {
      dacId: 3,
    },
  ],
};

const props = {
  collection: collectionSkeleton,
  showCancelModal: () => {},
  updateCollections: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(Storage, 'getCurrentUser').returns(user);
});

describe('Member Actions - Vote Button', () => {
  it('renders the cell container', () => {
    propCopy.collection.dars = votableDars;
    mount(<MemberActions {...propCopy} />);
    const container = cy.get('.member-actions');
    container.should('exist');
  });

  it('renders the vote button if the member has a vote present for an open election', () => {
    propCopy.collection.dars = votableDars;
    mount(<MemberActions {...propCopy}/>);
    const voteButton = cy.get(`#member-vote-${collectionId}`);
    voteButton.should('exist');
  });

  it('does not render the vote button if the member does not have a vote present', () => {
    propCopy.collection.dars = noVoteInDars;
    mount(<MemberActions {...propCopy}/>);
    const voteButton = cy.get(`#member-vote-${collectionId}`);
    voteButton.should('not.exist');
  });

  it('does not render the vote button if there are no open elections for the member to vote on', () => {
    propCopy.collection.dars = closedDars;
    mount(<MemberActions {...propCopy} />);
    const voteButton = cy.get(`#member-vote-${collectionId}`);
    voteButton.should('not.exist');
  });

  it('shows "Vote" if the user has yet to vote on an election', () => {
    propCopy.collection.dars = votableDars;
    mount(<MemberActions {...propCopy} />);
    const voteButton = cy.get(`#member-vote-${collectionId}`);
    voteButton.should('exist');
    voteButton.contains('Vote');
  });

  it('shows "Update Vote" if the user has already voted but the election is still open', () => {
    propCopy.collection.dars = submittedVoteDars;
    mount(<MemberActions {...propCopy} />);
    const voteButton = cy.get(`#member-vote-${collectionId}`);
    voteButton.should('exist');
    voteButton.contains('Update Vote');
  });
});