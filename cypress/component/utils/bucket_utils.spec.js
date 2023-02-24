/* eslint-disable no-undef */
import {binCollectionToBuckets} from '../../../src/utils/BucketUtils';
import {forEach, find} from 'lodash/fp';
import {Match} from '../../../src/libs/ajax';

const sample_collection = {
  'darCollectionId': 1,
  'darCode': 'DAR-001',
  'dars': {
    'dar-reference-id-1': {
      'id': 1,
      'referenceId': 'dar-reference-id-1',
      'collectionId': 1,
      'elections': {
        '1': {
          'electionId': 1,
          'electionType': 'DataAccess',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 1,
          'votes': {
            '1': {
              'voteId': 1,
              'dacUserId': 1,
              'electionId': 1,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '2': {
              'voteId': 2,
              'dacUserId': 1,
              'electionId': 1,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '3': {
              'voteId': 3,
              'dacUserId': 1,
              'electionId': 1,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '2': {
          'electionId': 2,
          'electionType': 'RP',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 1,
          'votes': {
            '4': {
              'voteId': 4,
              'dacUserId': 1,
              'electionId': 2,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '5': {
              'voteId': 5,
              'dacUserId': 1,
              'electionId': 2,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '6': {
              'voteId': 6,
              'dacUserId': 1,
              'electionId': 2,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '3': {
          'electionId': 3,
          'electionType': 'DataAccess',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 2,
          'votes': {
            '11': {
              'voteId': 11,
              'dacUserId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '22': {
              'voteId': 22,
              'dacUserId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '33': {
              'voteId': 33,
              'dacUserId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '4': {
          'electionId': 4,
          'electionType': 'RP',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 2,
          'votes': {
            '44': {
              'voteId': 44,
              'dacUserId': 1,
              'electionId': 4,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '55': {
              'voteId': 55,
              'dacUserId': 1,
              'electionId': 4,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '66': {
              'voteId': 66,
              'dacUserId': 1,
              'electionId': 4,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '5': {
          'electionId': 5,
          'electionType': 'DataAccess',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 3,
          'votes': {
            '111': {
              'voteId': 111,
              'dacUserId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '222': {
              'voteId': 222,
              'dacUserId': 1,
              'electionId': 5,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '333': {
              'voteId': 333,
              'dacUserId': 1,
              'electionId': 5,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '6': {
          'electionId': 6,
          'electionType': 'RP',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 3,
          'votes': {
            '444': {
              'voteId': 444,
              'dacUserId': 1,
              'electionId': 6,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '555': {
              'voteId': 555,
              'dacUserId': 1,
              'electionId': 6,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '666': {
              'voteId': 666,
              'dacUserId': 1,
              'electionId': 6,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '7': {
          'electionId': 7,
          'electionType': 'DataAccess',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 4,
          'votes': {
            '1111': {
              'voteId': 1111,
              'dacUserId': 1,
              'electionId': 7,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '2222': {
              'voteId': 2222,
              'dacUserId': 1,
              'electionId': 7,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '3333': {
              'voteId': 3333,
              'dacUserId': 1,
              'electionId': 7,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '8': {
          'electionId': 8,
          'electionType': 'RP',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 4,
          'votes': {
            '4444': {
              'voteId': 4444,
              'dacUserId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '5555': {
              'voteId': 5555,
              'dacUserId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '6666': {
              'voteId': 6666,
              'dacUserId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        }
      },
      'datasetIds': [1,2,3,4]
    }
  },
  'datasets': [
    {
      'dataSetId': 1,
      'datasetName': 'ds 1',
      'datasetIdentifier': 'DUOS-000001',
      'dataUse': {'generalUse': true}
    },
    {
      'dataSetId': 2,
      'datasetName': 'ds 2',
      'datasetIdentifier': 'DUOS-000002',
      'dataUse': {'generalUse': true}
    },
    {
      'dataSetId': 3,
      'datasetName': 'ds 3',
      'datasetIdentifier': 'DUOS-000003',
      'dataUse': {'generalUse': false, 'other': 'other restrictions'}
    },
    {
      'dataSetId': 4,
      'datasetName': 'ds 4',
      'datasetIdentifier': 'DUOS-000004',
      'dataUse': {'generalUse': false, 'secondaryOther': 'secondary other restrictions'}
    }
  ],
};

const match_results = [
  {
    'id': 1,
    'consent': 'DUOS-000001',
    'purpose': 'dar-reference-id-1',
    'match': true,
    'failed': false,
    'createDate': 'Jan 23, 2023',
    'algorithmVersion': 'v2'
  },
  {
    'id': 2,
    'consent': 'DUOS-000002',
    'purpose': 'dar-reference-id-1',
    'match': true,
    'failed': false,
    'createDate': 'Jan 23, 2023',
    'algorithmVersion': 'v2'
  }
];

beforeEach(() => {
  cy.stub(Match, 'findMatchBatch').returns(match_results);
});

describe('BucketUtils', () => {
  it('instantiates a collection into buckets', async () => {
    const buckets = await binCollectionToBuckets(sample_collection);
    expect(buckets).to.not.be.empty;
    forEach(b => {
      expect(b.key).to.not.be.empty;
      expect(b.votes).to.not.be.empty;
      if (!b.isRP) {
        expect(b.label).to.not.be.empty;
        expect(b.datasets).to.not.be.empty;
        expect(b.datasetIds).to.not.be.empty;
        expect(b.dataUse).to.not.be.empty;
        expect(b.dataUses).to.not.be.empty;
        expect(b.elections).to.not.be.empty;
      }
    })(buckets);
  });

  it('there should be a bucket with two GRU datasets', async () => {
    const buckets = await binCollectionToBuckets(sample_collection);
    const gruBucket = find(b => b.label === 'GRU')(buckets);
    expect(gruBucket).to.not.be.empty;
    expect(gruBucket.datasets).to.not.be.empty;
    expect(gruBucket.datasets.length).to.eq(2);
  });

  it('there should be a bucket with an primary OTHER dataset', async () => {
    const buckets = await binCollectionToBuckets(sample_collection);
    const other = find(b => b.label === 'OTH1')(buckets);
    expect(other).to.not.be.empty;
    expect(other.datasets).to.not.be.empty;
    expect(other.datasets.length).to.eq(1);
  });

  it('there should be a bucket with a secondary OTHER dataset', async () => {
    const buckets = await binCollectionToBuckets(sample_collection);
    const secondaryOther = find(b => b.label === 'OTH2')(buckets);
    expect(secondaryOther).to.not.be.empty;
    expect(secondaryOther.datasets).to.not.be.empty;
    expect(secondaryOther.datasets.length).to.eq(1);
  });

});
