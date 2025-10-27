import { binCollectionToBuckets, Bucket, shouldAbstain } from 'src/utils/BucketUtils'
import { isEmpty, isUndefined } from 'lodash'
import { Match } from 'src/libs/ajax/Match'
import {
  DacTerm,
  DarCollection,
  DataAccessRequest,
  Dataset,
  DatasetTerm,
  DataUseSummary,
  DataUseTerm,
  DuosUser,
  Study,
} from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'

const createUser = {
  displayName: 'Test User',
  emailPreference: true,
  userId: 1,
  createDate: new Date(),
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  email: 'testuser@example.com',
} as DuosUser

const study = {
  studyId: 1,
  name: 'Test Study',
  description: 'A study for testing',
  dataTypes: ['genomic', 'phenotypic'],
  piName: 'Dr. Test',
  publicVisibility: true,
  datasetIds: [1, 2],
  datasets: [] as Dataset[],
  properties: [],
  createDate: new Date().toISOString(),
  createUserId: 1,
} as Study

const time = Date.now()

const dar_collection = {
  id: 1,
  createDate: 1,
  updateDate: 1,
  createUserId: 1,
  darCollectionId: 1,
  darCode: 'DAR-001',
  dars: {
    'dar-reference-id-1': {
      id: 1,
      referenceId: 'dar-reference-id-1',
      collectionId: 1,
      data: {
        projectTitle: 'Test Project',
        piName: 'Test PI Name',
        darCode: 'DAR-001',
        checkNihDataOnly: false,
        rus: '',
        nonTechRus: '',
        diseases: false,
        methods: false,
        aiLlmUse: false,
        controls: false,
        population: false,
        other: false,
        otherText: '',
        forProfit: false,
        oneGender: false,
        gender: '',
        pediatric: false,
        illegalBehavior: false,
        addiction: false,
        sexualDiseases: false,
        stigmatizedDiseases: false,
        vulnerablePopulation: false,
        populationMigration: false,
        psychiatricTraits: false,
        notHealth: false,
        hmb: false,
        status: 'submitted',
        poa: false,
        datasets: [],
        restriction: {},
        validRestriction: true,
        researchPlans: 'Test research plans',
        anvilUse: false,
        cloudUse: false,
        localUse: false,
        cloudProvider: '',
        cloudProviderType: '',
        cloudProviderDescription: '',
        geneticStudiesOnly: false,
        irb: false,
        itDirector: '',
        itDirectorEmail: '',
        signingOfficial: '',
        signingOfficialEmail: '',
        publication: false,
        collaboration: false,
        forensicActivities: false,
        sharingDistribution: false,
        ontologies: [],
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
        dsAcknowledgement: false,
        gsoAcknowledgement: false,
        pubAcknowledgement: false,
        piEmail: 'test@example.com',
        piCountryOfOperation: 'US',
      },
      draft: false,
      progressReport: false,
      expired: false,
      rationale: '',
      rus: {},
      status: 'submitted',
      userId: 1,
      eraCommonsId: 'test-era-commons-id',
      expiresAt: time,
      createDate: time,
      submissionDate: time,
      updateDate: time,
      elections: {
        1: {
          electionId: 1,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 1,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            1: {
              voteId: 1,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            2: {
              voteId: 2,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            3: {
              voteId: 3,
              userId: 1,
              electionId: 1,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        2: {
          electionId: 2,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 1,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            4: {
              voteId: 4,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            5: {
              voteId: 5,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            6: {
              voteId: 6,
              userId: 1,
              electionId: 2,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        3: {
          electionId: 3,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 2,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            11: {
              voteId: 11,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            22: {
              voteId: 22,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            33: {
              voteId: 33,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        4: {
          electionId: 4,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 2,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            44: {
              voteId: 44,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            55: {
              voteId: 55,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            66: {
              voteId: 66,
              userId: 1,
              electionId: 4,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        5: {
          electionId: 5,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 3,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            111: {
              voteId: 111,
              userId: 1,
              electionId: 3,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            222: {
              voteId: 222,
              userId: 1,
              electionId: 5,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            333: {
              voteId: 333,
              userId: 1,
              electionId: 5,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        6: {
          electionId: 6,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 3,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            444: {
              voteId: 444,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            555: {
              voteId: 555,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            666: {
              voteId: 666,
              userId: 1,
              electionId: 6,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        7: {
          electionId: 7,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 4,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            1111: {
              voteId: 1111,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            2222: {
              voteId: 2222,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            3333: {
              voteId: 3333,
              userId: 1,
              electionId: 7,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        8: {
          electionId: 8,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 4,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            4444: {
              voteId: 4444,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            5555: {
              voteId: 5555,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            6666: {
              voteId: 6666,
              userId: 1,
              electionId: 8,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        9: {
          electionId: 9,
          electionType: 'DataAccess',
          referenceId: 'dar-reference-id-1',
          datasetId: 5,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            11111: {
              voteId: 11111,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            22222: {
              voteId: 22222,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            33333: {
              voteId: 33333,
              userId: 1,
              electionId: 9,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
        10: {
          electionId: 10,
          electionType: 'RP',
          referenceId: 'dar-reference-id-1',
          datasetId: 5,
          createDate: time,
          lastUpdate: time,
          status: 'Open',
          displayId: 'DUOS-000001-1',
          dulName: 'Test DUL',
          version: 1,
          archived: false,
          votes: {
            44444: {
              voteId: 44444,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'Chairperson',
              displayName: 'User 1',
              createDate: time,
            },
            55555: {
              voteId: 55555,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'DAC',
              displayName: 'User 1',
              createDate: time,
            },
            66666: {
              voteId: 66666,
              userId: 1,
              electionId: 10,
              rationale: '',
              type: 'Final',
              displayName: 'User 1',
              createDate: time,
            },
          },
        },
      },
      datasetIds: [1, 2, 3, 4, 5],
    } as DataAccessRequest,
  },
  datasets: [
    {
      datasetId: 1,
      name: 'ds 1',
      alias: 1,
      datasetName: 'ds 1',
      datasetIdentifier: 'DUOS-000001',
      dataUse: { generalUse: true },
      dacId: 1,
      createUserId: 1,
      createUser: createUser,
      createDate: new Date(),
      updateDate: new Date(),
      updateUserId: 1,
      submissionDate: new Date(),
      dac: { dacId: 1, name: 'Test DAC' },
      translatedDataUse: '',
      deletable: false,
      properties: [],
      study: study,
      dacApproval: false,
    },
    {
      datasetId: 2,
      name: 'ds 2',
      alias: 2,
      datasetName: 'ds 2',
      datasetIdentifier: 'DUOS-000002',
      dataUse: { generalUse: true },
      dacId: 2,
      createUserId: 1,
      createUser: createUser,
      createDate: new Date(),
      updateDate: new Date(),
      updateUserId: 1,
      submissionDate: new Date(),
      dac: { dacId: 2, name: 'Test DAC' },
      translatedDataUse: '',
      deletable: false,
      properties: [],
      study: study,
      dacApproval: false,
    },
    {
      datasetId: 3,
      name: 'ds 3',
      alias: 3,
      datasetName: 'ds 3',
      datasetIdentifier: 'DUOS-000003',
      dataUse: { generalUse: false, other: 'other restrictions' },
      dacId: 3,
      createUserId: 1,
      createUser: createUser,
      createDate: new Date(),
      updateDate: new Date(),
      updateUserId: 1,
      submissionDate: new Date(),
      dac: { dacId: 3, name: 'Test DAC' },
      translatedDataUse: '',
      deletable: false,
      properties: [],
      study: study,
      dacApproval: false,
    },
    {
      datasetId: 4,
      name: 'ds 4',
      alias: 4,
      datasetName: 'ds 4',
      datasetIdentifier: 'DUOS-000004',
      dataUse: { generalUse: false, secondaryOther: 'secondary other restrictions' },
      dacId: 4,
      createUserId: 1,
      createUser: createUser,
      createDate: new Date(),
      updateDate: new Date(),
      updateUserId: 1,
      submissionDate: new Date(),
      dac: { dacId: 4, name: 'Test DAC' },
      translatedDataUse: '',
      deletable: false,
      properties: [],
      study: study,
      dacApproval: false,
    },
    {
      datasetId: 5,
      name: 'ds 5',
      alias: 5,
      datasetName: 'ds 5',
      datasetIdentifier: 'DUOS-000005',
      dacId: 5,
      createUserId: 1,
      createUser: createUser,
      createDate: new Date(),
      updateDate: new Date(),
      updateUserId: 1,
      translatedDataUse: '',
      deletable: false,
      properties: [],
      study: study,
      dacApproval: false,
      dataUse: {},
    },
  ] as Dataset[],
} as DarCollection

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
    dac: { dacId: 1, dacName: 'Test DAC 1', dacEmail: 'email1' } as DacTerm,
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
    dac: { dacId: 2, dacName: 'Test DAC 2', dacEmail: 'email2' } as DacTerm,
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
    dac: { dacId: 3, dacName: 'Test DAC 3', dacEmail: 'email3' } as DacTerm,
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
    dac: { dacId: 4, dacName: 'Test DAC 4', dacEmail: 'email4' } as DacTerm,
  },
  {
    datasetId: 5,
    datasetName: 'ds 5',
    datasetIdentifier: 'DUOS-000005',
    dacId: 5,
    dac: { dacId: 5, dacName: 'Test DAC5', dacEmail: 'email5' } as DacTerm,
  },
] as DatasetTerm[]

// Helper function to reduce redundancy in bucket election verification
const verifyBucketElectionsAndDatasets = (buckets: Bucket[]) => {
  for (const b of buckets) {
    for (const e of b.elections) {
      cy.wrap(b.datasetIds).should('contain', e.datasetId)
    }
  }
}

describe('BucketUtils', () => {
  it('instantiates a collection into buckets', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    cy.stub(DataSet, 'searchDatasetIndex').returns(dataset_terms)
    cy.wrap(binCollectionToBuckets(dar_collection)).then((b) => {
      const buckets = b as Bucket[]
      cy.wrap(buckets).should('not.be.empty')
      for (const b1 of buckets) {
        cy.wrap(b1.key).should('not.be.empty')
        cy.wrap(b1.votes).should('not.be.empty')
        if (!b1.isRP) {
          cy.wrap(b1.label).should('not.be.empty')
          cy.wrap(b1.datasets).should('not.be.empty')
          cy.wrap(b1.datasetIds).should('not.be.empty')
          if (b1.dataUse) {
            cy.wrap(b1.dataUse).should('not.be.empty')
            cy.wrap(b1.dataUses).should('not.be.empty')
          }
          cy.wrap(b1.elections).should('not.be.empty')
        }
      }
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
      verifyBucketElectionsAndDatasets(buckets)
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
      verifyBucketElectionsAndDatasets(buckets)
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
      for (const b1 of buckets) {
        if (!isEmpty(b1.matchResults)) {
          cy.wrap(b1.algorithmResult?.rationales).should('not.be.empty')
          cy.wrap(b1.algorithmResult?.rationales?.length).should('eq', 5)
          rationaleCheck = true
        }
      }
      cy.wrap(rationaleCheck).should('eq', true)
    })
  })

  it('correctly determines matchable data use objects', () => {
    const dataUses = [
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NCU', description: 'NCU' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NMDS', description: 'NMDS' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NCTRL', description: 'NCTRL' }] } as DataUseSummary,
    ]
    for (const d of dataUses) {
      cy.wrap(shouldAbstain(d)).should('eq', false)
    }
  })

  it('correctly determines unmatchable data use objects', () => {
    const dataUses = [
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'OTHER', description: 'OTHER' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-M', description: 'POP-M' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-F', description: 'POP-M' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'COL', description: 'COL' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'IRB', description: 'IRB' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'GSO', description: 'GSO' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'PUB', description: 'PUB' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'MOR', description: 'MOR' }] } as DataUseSummary,
      { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-PD', description: 'POP-PD' }] } as DataUseSummary,
    ]
    for (const d of dataUses) {
      cy.wrap(shouldAbstain(d)).should('eq', true)
    }
  })

  it('correctly buckets data uses when there are similar data use entries', () => {
    cy.stub(Match, 'findMatchBatch').returns(match_results)
    const collection = {
      id: 1,
      darCollectionId: 1,
      darCode: 'DAR-001',
      createDate: 1,
      updateDate: 1,
      createUserId: 1,
      dars: {
        'dar-reference-id-1': {
          id: 1,
          referenceId: 'dar-reference-id-1',
          collectionId: 1,
          data: {
            projectTitle: 'Test Project',
            checkNihDataOnly: false,
            rus: 'Test research use statement',
            nonTechRus: 'Non-technical research use statement',
            diseases: false,
            methods: false,
            aiLlmUse: false,
            controls: false,
            population: false,
            other: false,
            otherText: '',
            ontologies: [],
            forProfit: false,
            oneGender: false,
            gender: '',
            pediatric: false,
            illegalBehavior: false,
            addiction: false,
            sexualDiseases: false,
            stigmatizedDiseases: false,
            vulnerablePopulation: false,
            populationMigration: false,
            psychiatricTraits: false,
            notHealth: false,
            hmb: false,
            status: 'submitted',
            poa: false,
            datasets: [],
            restriction: {},
            validRestriction: true,
            researchPlans: 'Test research plans',
            anvilUse: false,
            cloudUse: false,
            localUse: false,
            cloudProvider: '',
            cloudProviderType: '',
            cloudProviderDescription: '',
            geneticStudiesOnly: false,
            irb: false,
            itDirector: '',
            itDirectorEmail: '',
            signingOfficial: '',
            signingOfficialEmail: '',
            publication: false,
            collaboration: false,
            forensicActivities: false,
            sharingDistribution: false,
            labCollaborators: [],
            internalCollaborators: [],
            externalCollaborators: [],
            dsAcknowledgement: false,
            gsoAcknowledgement: false,
            pubAcknowledgement: false,
            piName: 'Test PI Name',
            piEmail: 'test@example.com',
            piCountryOfOperation: 'US',
          },
          draft: false,
          progressReport: false,
          expired: false,
          rationale: '',
          rus: {},
          status: 'submitted',
          userId: 1,
          eraCommonsId: 'test-era-commons-id',
          expiresAt: time,
          createDate: time,
          submissionDate: time,
          updateDate: time,
          elections: {
            1: {
              electionId: 1,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 1,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000001-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                1: {
                  voteId: 1,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                2: {
                  voteId: 2,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                3: {
                  voteId: 3,
                  userId: 1,
                  electionId: 1,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            2: {
              electionId: 2,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 1,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000002-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                4: {
                  voteId: 4,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                5: {
                  voteId: 5,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                6: {
                  voteId: 6,
                  userId: 1,
                  electionId: 2,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            3: {
              electionId: 3,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 2,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000003-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                7: {
                  voteId: 7,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                8: {
                  voteId: 8,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                9: {
                  voteId: 9,
                  userId: 1,
                  electionId: 3,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            4: {
              electionId: 4,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 2,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000004-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                10: {
                  voteId: 10,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                11: {
                  voteId: 11,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                12: {
                  voteId: 12,
                  userId: 1,
                  electionId: 4,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            5: {
              electionId: 5,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 3,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000005-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                13: {
                  voteId: 13,
                  userId: 1,
                  electionId: 5,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                14: {
                  voteId: 14,
                  userId: 1,
                  electionId: 5,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                15: {
                  voteId: 15,
                  userId: 1,
                  electionId: 5,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            6: {
              electionId: 6,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 3,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000006-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                16: {
                  voteId: 16,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                17: {
                  voteId: 17,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                18: {
                  voteId: 666,
                  userId: 1,
                  electionId: 6,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            7: {
              electionId: 7,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 4,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000007-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                19: {
                  voteId: 19,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                20: {
                  voteId: 19,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                21: {
                  voteId: 21,
                  userId: 1,
                  electionId: 7,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            8: {
              electionId: 8,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 4,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000008-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                22: {
                  voteId: 22,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                23: {
                  voteId: 5555,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                24: {
                  voteId: 6666,
                  userId: 1,
                  electionId: 8,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            9: {
              electionId: 9,
              electionType: 'DataAccess',
              referenceId: 'dar-reference-id-1',
              datasetId: 5,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000009-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                25: {
                  voteId: 25,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                26: {
                  voteId: 26,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                27: {
                  voteId: 27,
                  userId: 1,
                  electionId: 9,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
            10: {
              electionId: 10,
              electionType: 'RP',
              referenceId: 'dar-reference-id-1',
              datasetId: 5,
              createDate: time,
              lastUpdate: time,
              status: 'Open',
              displayId: 'DUOS-000010-1',
              dulName: 'Test DUL',
              version: 1,
              archived: false,
              votes: {
                28: {
                  voteId: 28,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'Chairperson',
                  displayName: 'User 1',
                  createDate: time,
                },
                29: {
                  voteId: 29,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'DAC',
                  displayName: 'User 1',
                  createDate: time,
                },
                30: {
                  voteId: 30,
                  userId: 1,
                  electionId: 10,
                  rationale: '',
                  type: 'Final',
                  displayName: 'User 1',
                  createDate: time,
                },
              },
            },
          },
          datasetIds: [1, 2, 3, 4, 5],
        } as DataAccessRequest,
      },
      datasets: [
        {
          datasetId: 1,
          name: 'ds 1',
          datasetName: 'ds 1',
          alias: 1,
          datasetIdentifier: 'DUOS-000001',
          dataUse: { hmbResearch: true, other: 'Samples and information may not be sold for profit.' },
          dacId: 1,
          createUserId: 1,
          createUser: createUser,
          createDate: new Date(),
          updateDate: new Date(),
          updateUserId: 1,
          translatedDataUse: '',
          deletable: false,
          properties: [],
          study: study,
          dacApproval: false,
        },
        {
          datasetId: 2,
          name: 'ds 2',
          datasetName: 'ds 2',
          datasetIdentifier: 'DUOS-000002',
          dataUse: { generalUse: true },
          dacId: 2,
          createUserId: 1,
          createUser: createUser,
          createDate: new Date(),
          updateDate: new Date(),
          updateUserId: 1,
          translatedDataUse: '',
          deletable: false,
          properties: [],
          study: study,
          dacApproval: false,
          alias: 2,
        },
        {
          datasetId: 3,
          name: 'ds 3',
          datasetName: 'ds 3',
          datasetIdentifier: 'DUOS-000003',
          dataUse: { hmbResearch: true },
          dacId: 3,
          createUserId: 1,
          createUser: createUser,
          createDate: new Date(),
          updateDate: new Date(),
          updateUserId: 1,
          translatedDataUse: '',
          deletable: false,
          properties: [],
          study: study,
          dacApproval: false,
          alias: 3,
        },
        {
          datasetId: 4,
          name: 'ds 4',
          datasetName: 'ds 4',
          datasetIdentifier: 'DUOS-000004',
          dataUse: { generalUse: true },
          dacId: 4,
          createUserId: 1,
          createUser: createUser,
          createDate: new Date(),
          updateDate: new Date(),
          updateUserId: 1,
          translatedDataUse: '',
          deletable: false,
          properties: [],
          study: study,
          dacApproval: false,
          alias: 4,
        },
        {
          datasetId: 5,
          name: 'ds 5',
          datasetName: 'ds 5',
          datasetIdentifier: 'DUOS-000005',
          dataUse: { hmbResearch: true },
          dacId: 5,
          createUserId: 1,
          createUser: createUser,
          createDate: new Date(),
          updateDate: new Date(),
          updateUserId: 1,
          translatedDataUse: '',
          deletable: false,
          properties: [],
          study: study,
          dacApproval: false,
          alias: 5,
        },
      ] as Dataset[],
    } as DarCollection
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
    ] as DatasetTerm[]
    cy.stub(DataSet, 'searchDatasetIndex').returns(terms)
    cy.wrap(binCollectionToBuckets(collection)).then((b) => {
      const buckets = b as Bucket[]
      cy.wrap(buckets).should('not.be.empty')
      // The provided dar collection should have 1 RP bucket and 3 Data Use buckets
      cy.wrap(buckets.length).should('eq', 4)
      cy.wrap(buckets[0].isRP).should('eq', true)
      // HMB + Other
      cy.wrap(buckets[1].isRP).should('eq', undefined)
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
