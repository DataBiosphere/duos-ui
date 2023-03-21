/* eslint-disable no-undef */
import {
  updateCollectionFn,
  cancelCollectionFn,
  openCollectionFn,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket,
  collapseVotesByUser,
  updateFinalVote,
  rpVoteKey
} from '../../../src/utils/DarCollectionUtils';
import {Collections} from '../../../src/libs/ajax';
import {formatDate, Notifications, USER_ROLES} from '../../../src/libs/utils';
import {forEach, includes, concat} from 'lodash/fp';

describe('updateCollectionFn', () => {
  it('generates an update callback function for consoles to use', () => {
    const collections = [{}];
    const filterFn = () => {
    };
    const searchRef = {current: {value: 1}};
    const setCollections = () => {
    };
    const setFilteredList = () => {
    };

    expect(updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList})).to.exist;
  });

  it('collections and filteredList with the filter results', () => {
    let filteredList = [];
    let collections = [{darCollectionId: 1, dars: {}}];
    const updatedList = [{darCollectionId: 1, dars: {}}];
    const updatedCollection = {darCollectionId: 1, dars: {1: {data: 'test'}}};
    const setFilteredList = (arr) => filteredList = arr;
    const setCollections = ((arr) => collections = arr);
    const filterFn = () => updatedList;
    const searchRef = {current: {value: 'value'}};
    const callback = updateCollectionFn({collections, filterFn, searchRef, setCollections, setFilteredList});

    callback(updatedCollection);
    expect(filteredList[0].darCollectionId).to.equal(updatedList[0].darCollectionId);
    expect(filteredList[0].data).to.equal(updatedList[0].data);
    expect(collections[0].darCollectionId).to.equal(updatedCollection.darCollectionId);
    expect(collections[0].dars[1].data).to.equal(updatedCollection.dars[1].data);
  });
});

describe('cancelCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (arr) => collections = arr;
    const callback = cancelCollectionFn({updateCollections, role: USER_ROLES.admin});
    expect(callback).to.exist;
  });

  it('updates collections and filteredList on successful cancel', async () => {
    let collections = [{status: 'In Progress', darCode: 'DAR-1', darCollectionId: 1}];
    const updatedCollection = {status: 'Complete', darCode: 'DAR-1', darCollectionId: 1};
    const updateCollections = (collection) => collections = [collection];
    const callback = cancelCollectionFn({updateCollections});
    cy.stub(Collections, 'cancelCollection').returns();
    cy.stub(Collections, 'getCollectionSummaryByRoleNameAndId').returns(
      updatedCollection
    );
    cy.stub(Notifications, 'showSuccess').returns(undefined);
    cy.stub(Notifications, 'showError').returns(undefined);

    await callback({darCode: '', darCollectionId: 1});
    expect(collections).to.not.be.empty;
    expect(collections[0].darCollectionId).to.equal(1);
    expect(collections[0].status).to.equal('Complete');
  });
});

describe('openCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (arr) => collections = arr;
    const callback = openCollectionFn({updateCollections, role: USER_ROLES.admin});
    expect(callback).to.exist;
  });

  it('updatesCollections on a successful open', async () => {
    let collections = [{status: 'Complete', darCode: 'DAR-1', darCollectionId: 1}];
    const updatedCollection = {status: 'In Progress', darCode: 'DAR-1', darCollectionId: 1};
    cy.stub(Collections, 'openElectionsById').returns({});
    cy.stub(Collections, 'getCollectionSummaryByRoleNameAndId').returns(
      updatedCollection
    );
    const updateCollections = (collection) => collections = [collection];
    const callback = openCollectionFn({updateCollections});
    await callback({darCode: '', darCollectionId: 1});
    expect(collections[0].darCode).to.equal('DAR-1');
    expect(collections[0].status).to.equal('In Progress');
  });
});

describe('extractDacDataAccessVotesFromBucket', () => {
  it('returns empty list if data access votes in this bucket do not have the userId of the given user', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{userId: 2}, {userId: 3}]
          }
        }
      ]
    };
    const user = {userId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.be.empty;
  });

  it('returns all member votes in the same data access elections as the given user', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}, {userId: 3}],
          }
        },
        {
          dataAccess: {
            memberVotes: [
              {vote: true, userId: 4},
              {vote: false, rationale: 'rationale', userId: 1}],
          }
        },
        {
          dataAccess: {
            memberVotes: [{vote: true, userId: 5}, {userId: 6}],
          }
        }
      ]
    };
    const user = {userId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(5);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: false, userId: 2});
    expect(votes).to.deep.include({userId: 3});
    expect(votes).to.deep.include({vote: true, userId: 4});
    expect(votes).to.deep.include({vote: false, rationale: 'rationale', userId: 1});
    expect(votes).to.not.deep.include({vote: true, userId: 5});
    expect(votes).to.not.deep.include({userId: 6});
  });

  it('only returns data access votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: true, userId: 1}, {userId: 2}],
          },
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 3}],
          }
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: false, userId: 3});
    expect(votes).to.not.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 2});
  });

  it('only returns member votes', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 3}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 2}],
          }
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: false, userId: 3});
    expect(votes).to.not.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 2});
  });
});

describe('extractDacRPVotesFromBucket', () => {
  it('returns empty list if rp votes in this bucket do not have the userId of the given user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 2}, {userId: 3}]
          }
        }
      ]
    };
    const user = {userId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.be.empty;
  });

  it('returns all member votes in the same rp elections as the given user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}, {userId: 3}],
          }
        },
        {
          rp: {
            memberVotes: [
              {vote: true, userId: 4},
              {vote: false, rationale: 'rationale', userId: 1}],
          }
        },
        {
          rp: {
            memberVotes: [{vote: true, userId: 5}, {userId: 6}],
          }
        }
      ]
    };
    const user = {userId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(5);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: false, userId: 2});
    expect(votes).to.deep.include({userId: 3});
    expect(votes).to.deep.include({vote: true, userId: 4});
    expect(votes).to.deep.include({vote: false, rationale: 'rationale', userId: 1});
    expect(votes).to.not.deep.include({vote: true, userId: 5});
    expect(votes).to.not.deep.include({userId: 6});
  });

  it('only returns rp votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: true, userId: 1}, {userId: 2}],
          },
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 3}],
          }
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.not.deep.include({userId: 1});
    expect(votes).to.not.deep.include({vote: false, userId: 3});
    expect(votes).to.deep.include({vote: true, userId: 1});
    expect(votes).to.deep.include({userId: 2});
  });

  it('only returns member votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 1}, {vote: false, userId: 3}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 2}],
          }
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: false, userId: 3});
    expect(votes).to.not.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 2});
  });
});

describe('extractUserDataAccessVotesFromBucket', () => {
  it('returns data access votes by this user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: false, userId: 1}],
          },
          dataAccess: {
            memberVotes: [{userId: 1}, {userId: 2}],
          },
        },
        {
          dataAccess: {
            memberVotes: [{vote: true, userId: 1}, {userId: 3}],
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });

  it('only returns member votes if isChair is false', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 3}],
            finalVotes: [{vote: true, userId: 1}]
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.not.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({vote: false, userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });

  it('only returns chairperson votes if isChair is true', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 3}],
            finalVotes: [{vote: true, userId: 1}]
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, true);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 1});
    expect(votes).to.not.deep.include({vote: false, userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });
});

describe('extractUserRPVotesFromBucket', () => {
  it('returns rp votes by this user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 1}, {userId: 2}],
          },
          dataAccess: {
            memberVotes: [{vote: false, userId: 1}],
          },
        },
        {
          rp: {
            memberVotes: [{vote: true, userId: 1}, {userId: 3}],
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });

  it('only returns member votes if isChair is false', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 3}]
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.deep.include({userId: 1});
    expect(votes).to.not.deep.include({vote: true, userId: 1});
    expect(votes).to.not.deep.include({vote: false, userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });

  it('only returns chairperson votes if isChair is true', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{userId: 1}, {vote: false, userId: 2}],
            chairpersonVotes: [{vote: true, userId: 1}, {userId: 3}]
          },
        },
      ]
    };
    const user = {userId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, true);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.not.deep.include({userId: 1});
    expect(votes).to.not.deep.include({vote: false, userId: 2});
    expect(votes).to.not.deep.include({userId: 3});
  });
});

describe('collapseVotesByUser', () => {
  it('does not collapse votes by different users', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, voteId: 1},
      {userId: 2, displayName: 'John', vote: true, voteId: 2},
      {userId: 3, displayName: 'Lauren', vote: true, voteId: 3},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(3);
    expect(collapsedVotes).to.deep.include({userId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, lastUpdated: null});
    expect(collapsedVotes).to.deep.include({userId: 2, voteId: 2, displayName: 'John', vote: true, rationale: null, lastUpdated: null});
    expect(collapsedVotes).to.deep.include({userId: 3, voteId: 3, displayName: 'Lauren', vote: true, rationale: null, lastUpdated: null});
  });

  it('does not collapse votes by the same user with different vote values', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, voteId: 1},
      {userId: 1, displayName: 'John', vote: false, voteId: 2},
      {userId: 1, displayName: 'John', voteId: 3},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(3);
    expect(collapsedVotes).to.deep.include({userId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, lastUpdated: null});
    expect(collapsedVotes).to.deep.include({userId: 1, voteId: 2, displayName: 'John', vote: false, rationale: null, lastUpdated: null});
    expect(collapsedVotes).to.deep.include({userId: 1, voteId: 3, displayName: 'John', vote: undefined, rationale: null, lastUpdated: null});
  });

  it('collapses votes by the same user without appending identical dates / rationales', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      lastUpdated: `${formatDate('20000')}\n`
    });
  });

  it('collapses votes by the same user and appends different dates', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '30000', voteId: 2},
    ];
    const collapsedVotes = collapseVotesByUser(votes);
    const formattedDate = `${formatDate('20000')}\n${formatDate('30000')}\n`;

    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      lastUpdated: formattedDate
    });
  });

  it('collapses votes by the same user and appends different rationales', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale1', createDate: '20000', voteId: 1},
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale2', createDate: '20000', voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale1\nrationale2\n',
      lastUpdated: `${formatDate('20000')}\n`
    });
  });

  it('does not append null dates / rationales', () => {
    const votes = [
      {userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {userId: 1, displayName: 'John', vote: true, voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      vote: true,
      displayName: 'John',
      rationale: 'rationale\n',
      lastUpdated: `${formatDate('20000')}\n`
    });
  });
});

describe('updateFinalVote()', () => {
  it('updates votes for the target bucket in the source collection (non-RP)', () => {
    const voteIds = [1,2,3];
    const votePayload = {vote: true, rationale: 'test rationale'};
    const key = 'targetKey';
    let dataUseBuckets = [{key, votes: [{dataAccess: {
      finalVotes: [{voteId: 1}, {voteId: 2}, {voteId: 4}],
      chairpersonVotes: [{voteId: 3}]
    }}]}];
    const setDataUseBuckets = (newBucketArray) => dataUseBuckets = newBucketArray;
    const updatedBuckets = updateFinalVote({key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets});

    forEach((bucket) => {
      const voteObj = bucket.votes[0].dataAccess;
      const votes = concat(voteObj.finalVotes, voteObj.chairpersonVotes);
      forEach((vote) => {
        if(includes(vote.voteId)(voteIds)) {
          expect(vote.vote).to.equal(votePayload.vote);
          expect(vote.rationale).to.equal(votePayload.rationale);
        } else {
          expect(vote.vote).to.equal(undefined);
          expect(vote.rationale).to.equal(undefined);
        }
      })(votes);
    })(updatedBuckets);

    expect(dataUseBuckets).to.deep.equal(updatedBuckets);
  });

  it('updates votes for the target bucket in the source collection (rp votes)', () => {
    const voteIds = [1,2,3];
    const votePayload = {vote: false, rationale: 'false rationale'};
    const key = rpVoteKey;
    let dataUseBuckets = [{key, votes: [{rp: {
      finalVotes: [{voteId: 1}, {voteId: 2}, {voteId: 4}],
      chairpersonVotes: [{voteId: 1}, {voteId: 2}, {voteId: 4}]
    }}]}];
    const setDataUseBuckets = (newBucketArray) => dataUseBuckets = newBucketArray;
    const updatedBuckets = updateFinalVote({key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets});

    forEach((bucket) => {
      const voteObj = bucket.votes[0].rp;
      const votes = concat(voteObj.finalVotes, voteObj.chairpersonVotes);
      forEach((vote) => {
        if (includes(vote.voteId)(voteIds)) {
          expect(vote.vote).to.equal(votePayload.vote);
          expect(vote.rationale).to.equal(votePayload.rationale);
        } else {
          expect(vote.vote).to.equal(undefined);
          expect(vote.rationale).to.equal(undefined);
        }
      })(votes);
    })(updatedBuckets);

    expect(dataUseBuckets).to.deep.equal(updatedBuckets);
  });
});


