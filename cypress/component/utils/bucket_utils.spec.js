/* eslint-disable no-undef */

import {binCollectionToBuckets} from '../../../src/utils/BucketUtils';
import {forEach} from 'lodash/fp';
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
        }
      },
      'datasetIds': [1]
    }
  }
  ,
  'datasets': [
    {
      'dataSetId': 1,
      'datasetName': 'ds 1',
      'datasetIdentifier': 'DUOS-000001',
      'dataUse': {'generalUse': true}
    }
  ],
};

describe('BucketUtils', () => {
  it('instantiates a collection into buckets', async () => {
    cy.stub(Match, 'findMatchBatch').returns([{
      'id': 1,
      'consent': 'DUOS-000001',
      'purpose': 'dar-reference-id-1',
      'match': true,
      'failed': false,
      'createDate': 'Jan 23, 2023',
      'algorithmVersion': 'v2'
    }
    ]);
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
        expect(b.matchResults).to.not.be.empty;
      }
    })(buckets);
  });
});
