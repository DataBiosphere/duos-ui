/* eslint-disable no-undef */
import {
  checkIfOpenableElectionPresent,
  checkIfCancelableElectionPresent,
  updateCollectionFn,
  cancelCollectionFn,
  openCollectionFn,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket, collapseVotesByUser, getMatchDataForBuckets
} from '../../../src/utils/DarCollectionUtils';
import {Collections, Match} from '../../../src/libs/ajax';
import {formatDate, Notifications} from '../../../src/libs/utils';
import {cloneDeep} from 'lodash/fp';

const openableAndClosableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Open',
        electionType: 'RP'
      },
    },
  },
  2: {
    elections: {
      3: {
        status: 'Canceled',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Canceled',
        electionType: 'RP'
      }
    },
  },
};

const closeableDars = {
  1: {
    elections: {
      1: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Open',
        electionType: 'RP'
      }
    }
  },
  2: {
    elections: {
      3: {
        status: 'Open',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Open',
        electionType: 'RP'
      }
    }
  }
};

const openableDars = {
  1: {
    elections: {
      1: {
        status: 'Canceled',
        electionType: 'DataAccess'
      },
      2: {
        status: 'Canceled',
        electionType: 'RP'
      }
    }
  },
  2: {
    elections: {
      3: {
        status: 'Closed',
        electionType: 'DataAccess'
      },
      4: {
        status: 'Closed',
        electionType: 'RP'
      }
    }
  }
};

const mockBuckets = [
  {
    key: 'RP Vote',
    isRP: true
  },
  {
    key: 'OTH1',
    elections: [
      [
        { electionType: 'RP', referenceId: 'test3' },
        { electionType: 'DataAccess', referenceId: 'test4' },
      ],
      [
        { electionType: 'RP', referenceId: 'test5' },
        { electionType: 'DataAccess', referenceId: 'test6' },
      ],
    ],
  }
];

describe('checkIfOpenableElectionPresent()', () => {
  it('returns true if there is at least one election that is not open', () => {
    const isOpenable = checkIfOpenableElectionPresent(openableAndClosableDars);
    expect(isOpenable).to.be.true;
  });
  it('returns false if there is no valid election to be opened', () => {
    const isOpenable = checkIfOpenableElectionPresent(closeableDars);
    expect(isOpenable).to.be.false;
  });
});

describe('checkIfCancelableElectionPresent()', () => {
  it('returns true if there is at least one cancelable election present', () => {
    const isCancelable = checkIfCancelableElectionPresent(openableAndClosableDars);
    expect(isCancelable).to.be.true;
  });
  it('returns false if there is no valid elections for cancelation', () => {
    const isCancelable = checkIfCancelableElectionPresent(openableDars);
    expect(isCancelable).to.be.false;
  });
});

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
    const callback = cancelCollectionFn({updateCollections, role: 'admin'});
    expect(callback).to.exist;
  });

  it('updates collections and filteredList on successful cancel', async () => {
    let collections = [{dars: {1: {status: 'Open'}}}];
    const updatedCollection = {dars: {1: {status: 'Canceled'}}};
    const updateCollections = (collection) => collections = [collection];
    const callback = cancelCollectionFn({updateCollections});
    cy.stub(Collections, 'cancelCollection').returns(updatedCollection);
    cy.stub(Notifications, 'showSuccess').returns(undefined);
    cy.stub(Notifications, 'showError').returns(undefined);

    await callback({darCode: 'test', darCollectionId: 1});
    expect(collections).to.not.be.empty;
    expect(collections[0].dars[1].status).to.equal(updatedCollection.dars[1].status);
  });
});

describe('openCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (arr) => collections = arr;
    const callback = openCollectionFn(updateCollections);
    expect(callback).to.exist;
  });

  it('updatesCollections on a successful open', async () => {
    const updatedCollection = {dars: {1: {status: 'Open'}}};
    cy.stub(Collections, 'openElectionsById').returns(updatedCollection);
    let collections = [{dars: {1: {status: 'Canceled'}}}];
    const updateCollections = (collection) => collections = [collection];
    const callback = openCollectionFn({updateCollections});
    await callback({darCode: 'test', darCollectionId: 1});
    expect(collections[0].dars[1].status).to.equal(updatedCollection.dars[1].status);
  });
});

describe('extractDacDataAccessVotesFromBucket', () => {
  it('returns empty list if data access votes in this bucket do not have the dacUserId of the given user', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{dacUserId: 2}, {dacUserId: 3}]
          }
        }
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.be.empty;
  });

  it('returns all member votes in the same data access elections as the given user', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}, {dacUserId: 3}],
          }
        },
        {
          dataAccess: {
            memberVotes: [
              {vote: true, dacUserId: 4},
              {vote: false, rationale: 'rationale', dacUserId: 1}],
          }
        },
        {
          dataAccess: {
            memberVotes: [{vote: true, dacUserId: 5}, {dacUserId: 6}],
          }
        }
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(5);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.deep.include({dacUserId: 3});
    expect(votes).to.deep.include({vote: true, dacUserId: 4});
    expect(votes).to.deep.include({vote: false, rationale: 'rationale', dacUserId: 1});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 5});
    expect(votes).to.not.deep.include({dacUserId: 6});
  });

  it('only returns data access votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: true, dacUserId: 1}, {dacUserId: 2}],
          },
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 3}],
          }
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: false, dacUserId: 3});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 2});
  });

  it('only returns member votes', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 3}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 2}],
          }
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacDataAccessVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: false, dacUserId: 3});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 2});
  });
});

describe('extractDacRPVotesFromBucket', () => {
  it('returns empty list if rp votes in this bucket do not have the dacUserId of the given user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 2}, {dacUserId: 3}]
          }
        }
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.be.empty;
  });

  it('returns all member votes in the same rp elections as the given user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}, {dacUserId: 3}],
          }
        },
        {
          rp: {
            memberVotes: [
              {vote: true, dacUserId: 4},
              {vote: false, rationale: 'rationale', dacUserId: 1}],
          }
        },
        {
          rp: {
            memberVotes: [{vote: true, dacUserId: 5}, {dacUserId: 6}],
          }
        }
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(5);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.deep.include({dacUserId: 3});
    expect(votes).to.deep.include({vote: true, dacUserId: 4});
    expect(votes).to.deep.include({vote: false, rationale: 'rationale', dacUserId: 1});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 5});
    expect(votes).to.not.deep.include({dacUserId: 6});
  });

  it('only returns rp votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: true, dacUserId: 1}, {dacUserId: 2}],
          },
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 3}],
          }
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.not.deep.include({dacUserId: 1});
    expect(votes).to.not.deep.include({vote: false, dacUserId: 3});
    expect(votes).to.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.deep.include({dacUserId: 2});
  });

  it('only returns member votes', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 3}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 2}],
          }
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractDacRPVotesFromBucket(bucket, user);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: false, dacUserId: 3});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 2});
  });
});

describe('extractUserDataAccessVotesFromBucket', () => {
  it('returns data access votes by this user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{vote: false, dacUserId: 1}],
          },
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {dacUserId: 2}],
          },
        },
        {
          dataAccess: {
            memberVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}],
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });

  it('only returns member votes if isChair is false', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}],
            finalVotes: [{vote: true, dacUserId: 1}]
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });

  it('only returns chairperson votes if isChair is true', () => {
    const bucket = {
      votes: [
        {
          dataAccess: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}],
            finalVotes: [{vote: true, dacUserId: 1}]
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserDataAccessVotesFromBucket(bucket, user, true);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 1});
    expect(votes).to.not.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });
});

describe('extractUserRPVotesFromBucket', () => {
  it('returns rp votes by this user', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 1}, {dacUserId: 2}],
          },
          dataAccess: {
            memberVotes: [{vote: false, dacUserId: 1}],
          },
        },
        {
          rp: {
            memberVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}],
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(2);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });

  it('only returns member votes if isChair is false', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}]
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, false);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.deep.include({dacUserId: 1});
    expect(votes).to.not.deep.include({vote: true, dacUserId: 1});
    expect(votes).to.not.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });

  it('only returns chairperson votes if isChair is true', () => {
    const bucket = {
      votes: [
        {
          rp: {
            memberVotes: [{dacUserId: 1}, {vote: false, dacUserId: 2}],
            chairpersonVotes: [{vote: true, dacUserId: 1}, {dacUserId: 3}]
          },
        },
      ]
    };
    const user = {dacUserId: 1};

    const votes = extractUserRPVotesFromBucket(bucket, user, true);
    expect(votes).to.have.lengthOf(1);
    expect(votes).to.not.deep.include({dacUserId: 1});
    expect(votes).to.not.deep.include({vote: false, dacUserId: 2});
    expect(votes).to.not.deep.include({dacUserId: 3});
  });
});

describe('collapseVotesByUser', () => {
  it('does not collapse votes by different users', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, voteId: 1},
      {dacUserId: 2, displayName: 'John', vote: true, voteId: 2},
      {dacUserId: 3, displayName: 'Lauren', vote: true, voteId: 3},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(3);
    expect(collapsedVotes).to.deep.include({dacUserId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, createDate: null});
    expect(collapsedVotes).to.deep.include({dacUserId: 2, voteId: 2, displayName: 'John', vote: true, rationale: null, createDate: null});
    expect(collapsedVotes).to.deep.include({dacUserId: 3, voteId: 3, displayName: 'Lauren', vote: true, rationale: null, createDate: null});
  });

  it('does not collapse votes by the same user with different vote values', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, voteId: 1},
      {dacUserId: 1, displayName: 'John', vote: false, voteId: 2},
      {dacUserId: 1, displayName: 'John', voteId: 3},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(3);
    expect(collapsedVotes).to.deep.include({dacUserId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, createDate: null});
    expect(collapsedVotes).to.deep.include({dacUserId: 1, voteId: 2, displayName: 'John', vote: false, rationale: null, createDate: null});
    expect(collapsedVotes).to.deep.include({dacUserId: 1, voteId: 3, displayName: 'John', vote: undefined, rationale: null, createDate: null});
  });

  it('collapses votes by the same user without appending identical dates / rationales', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      dacUserId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      createDate: `${formatDate('20000')}\n`
    });
  });

  it('collapses votes by the same user and appends different dates', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '30000', voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    const formattedDate = `${formatDate('20000')}\n${formatDate('30000')}\n`;

    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      dacUserId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      createDate: formattedDate
    });
  });

  it('collapses votes by the same user and appends different rationales', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale1', createDate: '20000', voteId: 1},
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale2', createDate: '20000', voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      dacUserId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale1\nrationale2\n',
      createDate: `${formatDate('20000')}\n`
    });
  });

  it('does not append null dates / rationales', () => {
    const votes = [
      {dacUserId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', voteId: 1},
      {dacUserId: 1, displayName: 'John', vote: true, voteId: 2},
    ];

    const collapsedVotes = collapseVotesByUser(votes);
    expect(collapsedVotes).to.have.lengthOf(1);
    expect(collapsedVotes).to.deep.include({
      dacUserId: 1,
      voteId: 1,
      vote: true,
      displayName: 'John',
      rationale: 'rationale\n',
      createDate: `${formatDate('20000')}\n`
    });
  });
});

describe('getMatchDataForBuckets', () => {
  it("fetches matches for buckets based on the bucket's data access election", async() => {

    const mockDate = new Date();
    const mockId = 10;
    const mockMatchReturn = [
      {
        purpose: 'test4',
        match: true,
        failed: false,
        createDate: mockDate,
        id: mockId
      }
    ];

    cy.stub(Match, 'findMatchBatch').returns(mockMatchReturn);
    const buckets = cloneDeep(mockBuckets);
    await getMatchDataForBuckets(buckets);
    buckets.forEach(bucket => {
      if(bucket.key.toLowerCase() !== 'rp vote') {
        const {algorithmResult} = bucket;
        expect(algorithmResult).to.not.be.empty;
        expect(algorithmResult.result).to.equal('Yes');
        expect(algorithmResult.createDate).to.equal(mockDate);
        expect(algorithmResult.id).to.equal(mockId);
      }
    });
  });

  it('sets "N/A defaults if no match data is found', async() => {
    cy.stub(Match, 'findMatchBatch').returns([]);
    const buckets = cloneDeep(mockBuckets);
    await getMatchDataForBuckets(buckets);
    buckets.forEach(bucket => {
      if(bucket.key.toLowerCase() !== 'rp vote') {
        const {algorithmResult} = bucket;
        expect(algorithmResult).to.not.be.empty;
        expect(algorithmResult.result).to.equal('N/A');
        expect(algorithmResult.createDate).to.equal(undefined);
        expect(algorithmResult.id).to.equal(bucket.key);
      }
    });
  });
});

describe('updateFinalVote()', () => {
  it('updates votes for the target bucket in the source collection (non-RP)', () => {
    const voteIds = [1,2,3];
    const votePayload = {vote: true, rationale: 'test rationale'};
    const key = 'targetKey';
    let dataUseBuckets = [{key: 'targetKey', votes: [{dataAccess: {finalVotes: [{voteId: 1}, {voteId: 2}, {voteId: 3}]}}]}];
  });
});


