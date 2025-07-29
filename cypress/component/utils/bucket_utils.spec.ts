import { binCollectionToBuckets, Bucket, shouldAbstain } from 'src/utils/BucketUtils'
import { isEmpty, isUndefined } from 'lodash'
import { Match } from 'src/libs/ajax/Match'
import { DarCollection, DatasetTerm, DataUseTerm } from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'

const dar_collection = {
  darCollectionId: 1,
  darCode: 'DAR-001',
  dars: {
    'dar-reference-id-1': {
      id: 1,
      referenceId: 'dar-reference-id-1',
      collectionId: 1,
      elections: {
        1: {
          electionId: 1,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 1,
          votes: {
            1: {
              voteId: 1,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            2: {
              voteId: 2,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            3: {
              voteId: 3,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        2: {
          electionId: 2,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 1,
          votes: {
            4: {
              voteId: 4,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            5: {
              voteId: 5,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            6: {
              voteId: 6,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        3: {
          electionId: 3,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 2,
          votes: {
            11: {
              voteId: 11,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            22: {
              voteId: 22,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            33: {
              voteId: 33,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        4: {
          electionId: 4,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 2,
          votes: {
            44: {
              voteId: 44,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            55: {
              voteId: 55,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            66: {
              voteId: 66,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        5: {
          electionId: 5,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 3,
          votes: {
            111: {
              voteId: 111,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            222: {
              voteId: 222,
              userId: 1,
              electionId: 5,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            333: {
              voteId: 333,
              userId: 1,
              electionId: 5,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        6: {
          electionId: 6,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 3,
          votes: {
            444: {
              voteId: 444,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            555: {
              voteId: 555,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            666: {
              voteId: 666,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        7: {
          electionId: 7,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 4,
          votes: {
            1111: {
              voteId: 1111,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            2222: {
              voteId: 2222,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            3333: {
              voteId: 3333,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        8: {
          electionId: 8,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 4,
          votes: {
            4444: {
              voteId: 4444,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            5555: {
              voteId: 5555,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            6666: {
              voteId: 6666,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        9: {
          electionId: 9,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 5,
          votes: {
            11111: {
              voteId: 11111,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            22222: {
              voteId: 22222,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            33333: {
              voteId: 33333,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
        10: {
          electionId: 10,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 5,
          votes: {
            44444: {
              voteId: 44444,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
            },
            55555: {
              voteId: 55555,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
            },
            66666: {
              voteId: 66666,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
            },
          },
        },
      },
      datasetIds: [1, 2, 3, 4],
    },
  },
  datasets: [
    {
      datasetId: 1,
      datasetName: 'ds 1',
      datasetIdentifier: 'DUOS-000001',
      dataUse: { generalUse: true },
      dacId: 1,
    },
    {
      datasetId: 2,
      datasetName: 'ds 2',
      datasetIdentifier: 'DUOS-000002',
      dataUse: { generalUse: true },
      dacId: 2,
    },
    {
      datasetId: 3,
      datasetName: 'ds 3',
      datasetIdentifier: 'DUOS-000003',
      dataUse: { generalUse: false, other: 'other restrictions' },
      dacId: 3,
    },
    {
      datasetId: 4,
      datasetName: 'ds 4',
      datasetIdentifier: 'DUOS-000004',
      dataUse: { generalUse: false, secondaryOther: 'secondary other restrictions' },
      dacId: 4,
    },
    {
      datasetId: 5,
      datasetName: 'ds 5',
      datasetIdentifier: 'DUOS-000005',
      dacId: 5,
    },
  ],
} as unknown as DarCollection

const match_results = [
  {
    id: 1,
    consent: 'DUOS-000001',
    purpose: 'dar-reference-id-1',
    match: true,
    failed: false,
    abstain: false,
    createDate: 'Jan 23, 2023',
    algorithmVersion: 'v2',
  },
  {
    id: 2,
    consent: 'DUOS-000002',
    purpose: 'dar-reference-id-1',
    match: true,
    failed: false,
    abstain: false,
    createDate: 'Jan 23, 2023',
    algorithmVersion: 'v2',
  },
]

const dataset_terms = [
  {
    datasetId: 1,
    datasetName: 'ds 1',
    datasetIdentifier: 'DUOS-000001',
    dataUse: {
      primary: [{
        code: 'GRU',
        description: 'General Research Use',
      }],
    },
    dacId: 1,
  },
  {
    datasetId: 2,
    datasetName: 'ds 2',
    datasetIdentifier: 'DUOS-000002',
    dataUse: {
      primary: [{
        code: 'GRU',
        description: 'General Research Use',
      }],
    },
    dacId: 2,
  },
  {
    datasetId: 3,
    datasetName: 'ds 3',
    datasetIdentifier: 'DUOS-000003',
    dataUse: {
      primary: [{
        code: 'OTHER',
        description: 'Other Restrictions',
      }],
    },
    dacId: 3,
  },
  {
    datasetId: 4,
    datasetName: 'ds 4',
    datasetIdentifier: 'DUOS-000004',
    dataUse: {
      secondary: [{
        code: 'OTHER',
        description: 'Other Restrictions',
      }],
    },
    dacId: 4,
  },
  {
    datasetId: 5,
    datasetName: 'ds 5',
    datasetIdentifier: 'DUOS-000005',
    dacId: 5,
  },
] as unknown as DatasetTerm[]

describe('BucketUtils', () => {
  it('instantiates a collection into buckets', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      cy.wrap(buckets).should('not.be.empty')
      buckets.forEach((b) => {
        cy.wrap(b.key).should('not.be.empty')
        cy.wrap(b.votes).should('not.be.empty')
        if (!b.isRP) {
          cy.wrap(b.label).should('not.be.empty')
          cy.wrap(b.datasets).should('not.be.empty')
          cy.wrap(b.datasetIds).should('not.be.empty')
          if (b.dataUse) {
            cy.wrap(b.dataUse).should('not.be.empty')
            cy.wrap(b.dataUses).should('not.be.empty')
          }
          cy.wrap(b.elections).should('not.be.empty')
        }
      })
    })
  })

  it('there should be a bucket with two GRU datasets', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      const gruBucket = buckets.find(b => b.label === 'GRU')
      cy.wrap(gruBucket).should('not.be.empty')
      cy.wrap(gruBucket?.datasets).should('not.be.empty')
      cy.wrap(gruBucket?.datasets.length).should('eq', 2)
    })
  })

  it('there should be a bucket with a primary OTHER dataset', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      const other = buckets.find(b => b.label === 'OTHER')
      cy.wrap(other).should('not.be.empty')
      cy.wrap(other?.datasets).should('not.be.empty')
      cy.wrap(other?.datasets.length).should('eq', 1)
    })
  })

  it('there should be a bucket with a secondary OTHER dataset', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      const secondaryOther = buckets.find(b => b.label === 'OTHER')
      cy.wrap(secondaryOther).should('not.be.empty')
      cy.wrap(secondaryOther?.datasets).should('not.be.empty')
      cy.wrap(secondaryOther?.datasets.length).should('eq', 1)
    })
  })

  it('there should be a bucket with a an undefined data use', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      const missingDataUse = buckets.find(b => !b.isRP && isUndefined(b.dataUse))
      cy.wrap(missingDataUse).should('not.be.empty')
      cy.wrap(missingDataUse?.datasets).should('not.be.empty')
      cy.wrap(missingDataUse?.datasets.length).should('eq', 1)
      cy.wrap(missingDataUse?.dataUse).should('be.undefined')
      cy.wrap(missingDataUse?.dataUses).should('be.empty')
    })
  })

  it('buckets should be filtered to datasets containing one dac id: 1', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms.filter(d => d.dacId === 1))
    cy.wrap(binCollectionToBuckets(dar_collection, [1])).then((b) => {
      const buckets = b as Bucket[]
      const dataAccessBuckets = buckets.filter(b => !b.isRP)
      cy.wrap(dataAccessBuckets).should('exist')
      cy.wrap(dataAccessBuckets.length).should('eq', 1)
      cy.wrap(dataAccessBuckets[0].datasetIds.length).should('eq', 1)
      buckets.forEach((b) => {
        b.elections.forEach((e) => {
          cy.wrap(b.datasetIds).should('contain', e.datasetId)
        })
      })
    })
  })

  it('buckets should be filtered to datasets containing two dac ids: 1 & 5', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms.filter(d => d.dacId === 1 || d.dacId === 5))
    cy.wrap(binCollectionToBuckets(dar_collection, [1, 5])).then((b) => {
      const buckets = b as Bucket[]
      const dataAccessBuckets = buckets.filter(b => !b.isRP)
      cy.wrap(dataAccessBuckets).should('exist')
      cy.wrap(dataAccessBuckets.length).should('eq', 2)
      buckets.forEach((b) => {
        b.elections.forEach((e) => {
          cy.wrap(b.datasetIds).should('contain', e.datasetId)
        })
      })
    })
  })

  it('match failures should be condensed for a bucket with two failing matches', () => {
    const failing_matches = [
      {
        id: 1,
        consent: 'DUOS-000001',
        purpose: 'dar-reference-id-1',
        match: false,
        failed: false,
        abstain: true,
        createDate: 'Jan 23, 2023',
        algorithmVersion: 'v2',
        rationales: ['1', '2', '3'],
      },
      {
        id: 2,
        consent: 'DUOS-000002',
        purpose: 'dar-reference-id-1',
        match: false,
        failed: false,
        abstain: true,
        createDate: 'Jan 23, 2023',
        algorithmVersion: 'v2',
        rationales: ['1', '2', '3', '4', '5'],
      },
    ]
    cy.stub(Match, 'findMatchBatch').returns(failing_matches)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      cy.wrap(buckets).should('not.be.empty')
      let rationaleCheck = false
      buckets.forEach((b) => {
        if (!isEmpty(b.matchResults)) {
          cy.wrap(b.algorithmResult?.rationales).should('not.be.empty')
          cy.wrap(b.algorithmResult?.rationales?.length).should('eq', 5)
          rationaleCheck = true
        }
      })
      cy.wrap(rationaleCheck).should('eq', true)
    })
  })

  it('correctly determines matchable data use objects', () => {
    const dataUses = [
      { generalUse: true, recontactMay: true },
      { generalUse: true, recontactMust: true },
      { generalUse: true, genomicSummaryResults: true },
    ]
    dataUses.forEach((d) => {
      cy.wrap(shouldAbstain(d)).should('eq', false)
    })
  })

  it('correctly determines unmatchable data use objects', () => {
    const dataUses = [
      { generalUse: true, addiction: true },
      { generalUse: true, collaboratorRequired: true },
      { generalUse: true, ethicsApprovalRequired: true },
      { generalUse: true, gender: 'F' },
      { generalUse: true, gender: 'M' },
      { generalUse: true, geographicalRestrictions: 'true' },
      { generalUse: true, illegalBehavior: true },
      { generalUse: true, manualReview: true },
      { generalUse: true, nonBiomedical: true },
      { generalUse: true, other: 'true' },
      { generalUse: true, pediatric: true },
      { generalUse: true, psychologicalTraits: true },
      { generalUse: true, publicationResults: true },
      { generalUse: true, secondaryOther: 'true' },
      { generalUse: true, sexualDiseases: true },
      { generalUse: true, stigmatizeDiseases: true },
      { generalUse: true, vulnerablePopulations: true },
    ]
    dataUses.forEach((d) => {
      cy.wrap(shouldAbstain(d)).should('eq', true)
    })
  })

  it('correctly buckets data uses when there are similar data use entries', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    const collection = {
      darCollectionId: 1,
      darCode: 'DAR-001',
      dars: {
        'dar-reference-id-1': {
          id: 1,
          referenceId: 'dar-reference-id-1',
          collectionId: 1,
          elections: {
            1: {
              electionId: 1,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 1,
              votes: {
                1: {
                  voteId: 1,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                2: {
                  voteId: 2,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                3: {
                  voteId: 3,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            2: {
              electionId: 2,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 1,
              votes: {
                4: {
                  voteId: 4,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                5: {
                  voteId: 5,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                6: {
                  voteId: 6,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            3: {
              electionId: 3,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 2,
              votes: {
                11: {
                  voteId: 11,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                22: {
                  voteId: 22,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                33: {
                  voteId: 33,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            4: {
              electionId: 4,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 2,
              votes: {
                44: {
                  voteId: 44,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                55: {
                  voteId: 55,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                66: {
                  voteId: 66,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            5: {
              electionId: 5,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 3,
              votes: {
                111: {
                  voteId: 111,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                222: {
                  voteId: 222,
                  userId: 1,
                  electionId: 5,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                333: {
                  voteId: 333,
                  userId: 1,
                  electionId: 5,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            6: {
              electionId: 6,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 3,
              votes: {
                444: {
                  voteId: 444,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                555: {
                  voteId: 555,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                666: {
                  voteId: 666,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            7: {
              electionId: 7,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 4,
              votes: {
                1111: {
                  voteId: 1111,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                2222: {
                  voteId: 2222,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                3333: {
                  voteId: 3333,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            8: {
              electionId: 8,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 4,
              votes: {
                4444: {
                  voteId: 4444,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                5555: {
                  voteId: 5555,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                6666: {
                  voteId: 6666,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            9: {
              electionId: 9,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 5,
              votes: {
                11111: {
                  voteId: 11111,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                22222: {
                  voteId: 22222,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                33333: {
                  voteId: 33333,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
            10: {
              electionId: 10,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 5,
              votes: {
                44444: {
                  voteId: 44444,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                },
                55555: {
                  voteId: 55555,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                },
                66666: {
                  voteId: 66666,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                },
              },
            },
          },
          datasetIds: [1, 2, 3, 4, 5],
        },
      },
      datasets: [
        {
          datasetId: 1,
          datasetName: 'ds 1',
          datasetIdentifier: 'DUOS-000001',
          dataUse: { hmbResearch: true, other: 'Samples and information may not be sold for profit.' },
          dacId: 1,
        },
        {
          datasetId: 2,
          datasetName: 'ds 2',
          datasetIdentifier: 'DUOS-000002',
          dataUse: { generalUse: true },
          dacId: 2,
        },
        {
          datasetId: 3,
          datasetName: 'ds 3',
          datasetIdentifier: 'DUOS-000003',
          dataUse: { hmbResearch: true },
          dacId: 3,
        },
        {
          datasetId: 4,
          datasetName: 'ds 4',
          datasetIdentifier: 'DUOS-000004',
          dataUse: { generalUse: true },
          dacId: 4,
        },
        {
          datasetId: 5,
          datasetName: 'ds 5',
          datasetIdentifier: 'DUOS-000005',
          dataUse: { hmbResearch: true },
          dacId: 5,
        },
      ],
    } as unknown as DarCollection
    const terms = [
      {
        datasetId: 1,
        datasetName: 'ds 1',
        datasetIdentifier: 'DUOS-000001',
        dataUse: {
          primary: [{
            code: 'HMB',
            description: 'Health, Medical and Biomedical Research',
          }, {
            code: 'OTHER',
            description: 'Samples and information may not be sold for profit.',
          },
          ],
        },
        dacId: 1,
      },
      {
        datasetId: 2,
        datasetName: 'ds 2',
        datasetIdentifier: 'DUOS-000002',
        dataUse: {
          primary: [{
            code: 'GRU',
            description: 'General Research Use',
          }],
        },
        dacId: 2,
      },
      {
        datasetId: 3,
        datasetName: 'ds 3',
        datasetIdentifier: 'DUOS-000003',
        dataUse: {
          primary: [{
            code: 'HMB',
            description: 'Health, Medical and Biomedical Research',
          }],
        },
        dacId: 3,
      },
      {
        datasetId: 4,
        datasetName: 'ds 4',
        datasetIdentifier: 'DUOS-000004',
        dataUse: {
          primary: [{
            code: 'GRU',
            description: 'General Research Use',
          }],
        },
        dacId: 4,
      },
      {
        datasetId: 5,
        datasetName: 'ds 5',
        datasetIdentifier: 'DUOS-000005',
        dataUse: {
          primary: [{
            code: 'HMB',
            description: 'Health, Medical and Biomedical Research',
          }],
        },
        dacId: 5,
      },
    ] as unknown as DatasetTerm[]
    cy.stub(DataSet, 'searchDatasetIndex').returns(terms)
    cy.wrap(binCollectionToBuckets(collection)).then((b) => {
      const buckets = b as Bucket[]
      cy.wrap(buckets).should('not.be.empty')
      // The provided dar collection should have 1 RP bucket and 3 Data Use buckets
      cy.wrap(buckets.length).should('eq', 4)
      cy.wrap(buckets[0].isRP).should('eq', true)
      // HMB + Other
      cy.wrap(buckets[1].isRP).should('eq', undefined)
      console.log(buckets[1].dataUse)
      cy.wrap(buckets[1].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'HMB')).should('exist')
      cy.wrap(buckets[1].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'OTHER')).should('exist')
      // General Use
      cy.wrap(buckets[2].isRP).should('eq', undefined)
      cy.wrap(buckets[2].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'GRU')).should('exist')
      // HMB
      cy.wrap(buckets[3].isRP).should('eq', undefined)
      cy.wrap(buckets[3].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'HMB')).should('exist')
      cy.wrap(buckets[3].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'OTHER')).should('not.exist')
    })
  })
})
