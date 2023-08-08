/* eslint-disable no-undef */
import {binCollectionToBuckets, isEqualDataUse, shouldAbstain} from '../../../src/utils/BucketUtils';
import {filter, find, forEach, isEmpty, isUndefined} from 'lodash/fp';
import {Match} from '../../../src/libs/ajax';

const dar_collection = {
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
              'userId': 1,
              'electionId': 1,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '2': {
              'voteId': 2,
              'userId': 1,
              'electionId': 1,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '3': {
              'voteId': 3,
              'userId': 1,
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
              'userId': 1,
              'electionId': 2,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '5': {
              'voteId': 5,
              'userId': 1,
              'electionId': 2,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '6': {
              'voteId': 6,
              'userId': 1,
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
              'userId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '22': {
              'voteId': 22,
              'userId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '33': {
              'voteId': 33,
              'userId': 1,
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
              'userId': 1,
              'electionId': 4,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '55': {
              'voteId': 55,
              'userId': 1,
              'electionId': 4,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '66': {
              'voteId': 66,
              'userId': 1,
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
              'userId': 1,
              'electionId': 3,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '222': {
              'voteId': 222,
              'userId': 1,
              'electionId': 5,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '333': {
              'voteId': 333,
              'userId': 1,
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
              'userId': 1,
              'electionId': 6,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '555': {
              'voteId': 555,
              'userId': 1,
              'electionId': 6,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '666': {
              'voteId': 666,
              'userId': 1,
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
              'userId': 1,
              'electionId': 7,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '2222': {
              'voteId': 2222,
              'userId': 1,
              'electionId': 7,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '3333': {
              'voteId': 3333,
              'userId': 1,
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
              'userId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '5555': {
              'voteId': 5555,
              'userId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '6666': {
              'voteId': 6666,
              'userId': 1,
              'electionId': 8,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '9': {
          'electionId': 9,
          'electionType': 'DataAccess',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 5,
          'votes': {
            '11111': {
              'voteId': 11111,
              'userId': 1,
              'electionId': 9,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '22222': {
              'voteId': 22222,
              'userId': 1,
              'electionId': 9,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '33333': {
              'voteId': 33333,
              'userId': 1,
              'electionId': 9,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        },
        '10': {
          'electionId': 10,
          'electionType': 'RP',
          'referenceId': 'dar-reference-id-1',
          'dataSetId': 5,
          'votes': {
            '44444': {
              'voteId': 44444,
              'userId': 1,
              'electionId': 10,
              'rationale': '',
              'type': 'Chairperson',
              'displayName': 'User 1'
            },
            '55555': {
              'voteId': 55555,
              'userId': 1,
              'electionId': 10,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'User 1'
            },
            '66666': {
              'voteId': 66666,
              'userId': 1,
              'electionId': 10,
              'rationale': '',
              'type': 'Final',
              'displayName': 'User 1'
            }
          }
        }
      },
      'datasetIds': [1, 2, 3, 4]
    }
  },
  'datasets': [
    {
      'dataSetId': 1,
      'datasetName': 'ds 1',
      'datasetIdentifier': 'DUOS-000001',
      'dataUse': {'generalUse': true},
      'dacId': 1
    },
    {
      'dataSetId': 2,
      'datasetName': 'ds 2',
      'datasetIdentifier': 'DUOS-000002',
      'dataUse': {'generalUse': true},
      'dacId': 2
    },
    {
      'dataSetId': 3,
      'datasetName': 'ds 3',
      'datasetIdentifier': 'DUOS-000003',
      'dataUse': {'generalUse': false, 'other': 'other restrictions'},
      'dacId': 3
    },
    {
      'dataSetId': 4,
      'datasetName': 'ds 4',
      'datasetIdentifier': 'DUOS-000004',
      'dataUse': {'generalUse': false, 'secondaryOther': 'secondary other restrictions'},
      'dacId': 4
    },
    {
      'dataSetId': 5,
      'datasetName': 'ds 5',
      'datasetIdentifier': 'DUOS-000005',
      'dacId': 5
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
    'abstain': false,
    'createDate': 'Jan 23, 2023',
    'algorithmVersion': 'v2'
  },
  {
    'id': 2,
    'consent': 'DUOS-000002',
    'purpose': 'dar-reference-id-1',
    'match': true,
    'failed': false,
    'abstain': false,
    'createDate': 'Jan 23, 2023',
    'algorithmVersion': 'v2'
  }
];

describe('BucketUtils', () => {
  it('instantiates a collection into buckets', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection);
    expect(buckets).to.not.be.empty;
    forEach(b => {
      expect(b.key).to.not.be.empty;
      expect(b.votes).to.not.be.empty;
      if (!b.isRP) {
        expect(b.label).to.not.be.empty;
        expect(b.datasets).to.not.be.empty;
        expect(b.datasetIds).to.not.be.empty;
        if (b.dataUse) {
          expect(b.dataUse).to.not.be.empty;
          expect(b.dataUses).to.not.be.empty;
        }
        expect(b.elections).to.not.be.empty;
      }
    })(buckets);
  });

  it('there should be a bucket with two GRU datasets', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection);
    const gruBucket = find(b => b.label === 'GRU')(buckets);
    expect(gruBucket).to.not.be.empty;
    expect(gruBucket.datasets).to.not.be.empty;
    expect(gruBucket.datasets.length).to.eq(2);
  });

  it('there should be a bucket with a primary OTHER dataset', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection);
    const other = find(b => b.label === 'OTH1')(buckets);
    expect(other).to.not.be.empty;
    expect(other.datasets).to.not.be.empty;
    expect(other.datasets.length).to.eq(1);
  });

  it('there should be a bucket with a secondary OTHER dataset', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection);
    const secondaryOther = find(b => b.label === 'OTH2')(buckets);
    expect(secondaryOther).to.not.be.empty;
    expect(secondaryOther.datasets).to.not.be.empty;
    expect(secondaryOther.datasets.length).to.eq(1);
  });

  it('there should be a bucket with a an undefined data use', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection);
    const missingDataUse = find(b => !b.isRP && isUndefined(b.dataUse))(buckets);
    expect(missingDataUse).to.not.be.empty;
    expect(missingDataUse.datasets).to.not.be.empty;
    expect(missingDataUse.datasets.length).to.eq(1);
    expect(missingDataUse.dataUse).to.be.undefined;
    expect(missingDataUse.dataUses).to.be.empty;
  });

  it('buckets should be filtered to datasets containing one dac id: 1', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection, [1]);
    const dataAccessBuckets = filter(b => !b.isRP)(buckets);
    expect(dataAccessBuckets).to.exist;
    expect(dataAccessBuckets.length).to.eq(1);
    expect(dataAccessBuckets[0].datasetIds.length).to.eq(1);
    forEach(b => {
      forEach(e => {
        expect(b.datasetIds).to.contain(e.dataSetId);
      })(b.elections);
    })(buckets);
  });

  it('buckets should be filtered to datasets containing two dac ids: 1 & 5', async () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results);
    const buckets = await binCollectionToBuckets(dar_collection, [1, 5]);
    const dataAccessBuckets = filter(b => !b.isRP)(buckets);
    expect(dataAccessBuckets).to.exist;
    expect(dataAccessBuckets.length).to.eq(2);
    forEach(b => {
      forEach(e => {
        expect(b.datasetIds).to.contain(e.dataSetId);
      })(b.elections);
    })(buckets);
  });

  it('match failures should be condensed for a bucket with two failing matches', async () => {
    const failing_matches = [
      {
        'id': 1,
        'consent': 'DUOS-000001',
        'purpose': 'dar-reference-id-1',
        'match': false,
        'failed': false,
        'abstain': true,
        'createDate': 'Jan 23, 2023',
        'algorithmVersion': 'v2',
        'rationales': ['1', '2', '3']
      },
      {
        'id': 2,
        'consent': 'DUOS-000002',
        'purpose': 'dar-reference-id-1',
        'match': false,
        'failed': false,
        'abstain': true,
        'createDate': 'Jan 23, 2023',
        'algorithmVersion': 'v2',
        'rationales': ['1', '2', '3', '4', '5']
      }
    ];
    cy.stub(Match, 'findMatchBatch').returns(failing_matches);
    const buckets = await binCollectionToBuckets(dar_collection);
    expect(buckets).to.not.be.empty;
    let rationaleCheck = false;
    forEach(b => {
      if (!isEmpty(b.matchResults)) {
        expect(b.algorithmResult.rationales).to.not.be.empty;
        expect(b.algorithmResult.rationales.length).to.eq(5, 'Rationales should be length 5');
        rationaleCheck = true;
      }
    })(buckets);
    expect(rationaleCheck).to.eq(true, 'Rationale checks should have occurred');
  });

  it('marks three unequal data uses as unequal', async () => {
    const dataUses = [
      {'generalUse': true},
      {'generalUse': false, 'hmbResearch': true, 'other': 'other restrictions'},
      {'generalUse': false, 'hmbResearch': true, 'secondaryOther': 'secondary other restrictions'}
    ];
    expect(isEqualDataUse(dataUses[0], dataUses[1])).to.eq(false);
    expect(isEqualDataUse(dataUses[0], dataUses[2])).to.eq(false);
    expect(isEqualDataUse(dataUses[1], dataUses[2])).to.eq(false);
  });

  it('marks three mixed, unequal data uses as unequal', async () => {
    const dataUses = [
      {'generalUse': true, 'collaborationInvestigators': true},
      {'generalUse': false, 'hmbResearch': true, 'publicationMoratorium': 'date'},
      {'generalUse': false, 'hmbResearch': false, 'stigmatizeDiseases': true}
    ];
    expect(isEqualDataUse(dataUses[0], dataUses[1])).to.eq(false);
    expect(isEqualDataUse(dataUses[0], dataUses[2])).to.eq(false);
    expect(isEqualDataUse(dataUses[1], dataUses[2])).to.eq(false);
  });

  it('marks three equal data uses as equal', async () => {
    const dataUses = [
      {'generalUse': true},
      {'generalUse': true},
      {'generalUse': true}
    ];
    expect(isEqualDataUse(dataUses[0], dataUses[1])).to.eq(true);
    expect(isEqualDataUse(dataUses[0], dataUses[2])).to.eq(true);
    expect(isEqualDataUse(dataUses[1], dataUses[2])).to.eq(true);
  });

  it('marks three mixed, equal data uses as equal', async () => {
    const dataUses = [
      {'generalUse': true, 'recontactMay': true},
      {'generalUse': true, 'recontactMust': true},
      {'generalUse': true, 'recontactingDataSubjects': true}
    ];
    expect(isEqualDataUse(dataUses[0], dataUses[1])).to.eq(true);
    expect(isEqualDataUse(dataUses[0], dataUses[2])).to.eq(true);
    expect(isEqualDataUse(dataUses[1], dataUses[2])).to.eq(true);
  });

  it('correctly determines matchable data use objects', async () => {
    const dataUses = [
      {'generalUse': true, 'recontactMay': true},
      {'generalUse': true, 'recontactMust': true},
      {'generalUse': true, 'genomicSummaryResults': true}
    ];
    forEach(d => {
      expect(shouldAbstain(d)).to.eq(false);
    })(dataUses);
  });

  it('correctly determines unmatchable data use objects', async () => {
    const dataUses = [
      {'generalUse': true, 'addiction': true},
      {'generalUse': true, 'collaboratorRequired': true},
      {'generalUse': true, 'ethicsApprovalRequired': true},
      {'generalUse': true, 'gender': 'F'},
      {'generalUse': true, 'gender': 'M'},
      {'generalUse': true, 'geographicalRestrictions': 'true'},
      {'generalUse': true, 'illegalBehavior': true},
      {'generalUse': true, 'manualReview': true},
      {'generalUse': true, 'nonBiomedical': true},
      {'generalUse': true, 'other': 'true'},
      {'generalUse': true, 'otherRestrictions': true},
      {'generalUse': true, 'pediatric': true},
      {'generalUse': true, 'psychologicalTraits': true},
      {'generalUse': true, 'publicationResults': true},
      {'generalUse': true, 'secondaryOther': 'true'},
      {'generalUse': true, 'sexualDiseases': true},
      {'generalUse': true, 'stigmatizeDiseases': true},
      {'generalUse': true, 'vulnerablePopulations': true}
    ];
    forEach(d => {
      expect(shouldAbstain(d)).to.eq(true);
    })(dataUses);
  });
});
