import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { binCollectionToBuckets, Bucket, shouldAbstain } from 'src/utils/BucketUtils'
import { isUndefined } from 'src/utils/NodashUtil'
import { Match } from 'src/libs/ajax/Match'
import {
  DarCollection,
  DataAccessRequest,
  Dataset,
  DatasetTerm,
  DataUseSummary,
  DataUseTerm,
  DuosUser,
  MatchResult,
  Study,
} from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'

// ─── Fixture factories ────────────────────────────────────────────────────────

const makeVotes = (electionId: number, ...voteIds: number[]) =>
  Object.fromEntries(voteIds.map((voteId, i) => {
    const types = ['Chairperson', 'DAC', 'Final']
    return [voteId, { voteId, userId: 1, electionId, rationale: '', type: types[i % 3], displayName: 'User 1', createDate: 0 }]
  }))

const makeElection = (electionId: number, electionType: string, datasetId: number, referenceId: string, voteIds: number[]) => ({
  electionId,
  electionType,
  referenceId,
  datasetId,
  createDate: 0,
  lastUpdate: 0,
  status: 'Open',
  displayId: `DUOS-${String(datasetId).padStart(6, '0')}-1`,
  dulName: 'Test DUL',
  version: 1,
  archived: false,
  votes: makeVotes(electionId, ...voteIds),
})

const createUser: DuosUser = {
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
}

const study: Study = {
  studyId: 1,
  name: 'Test Study',
  description: 'A study for testing',
  dataTypes: ['genomic', 'phenotypic'],
  piName: 'Dr. Test',
  publicVisibility: true,
  datasetIds: [1, 2],
  datasets: [],
  properties: [],
  createDate: new Date().toISOString(),
  createUserId: 1,
}

const makeDataset = (datasetId: number, dacId: number, dataUse: Dataset['dataUse'] = {} as Dataset['dataUse']): Dataset => ({
  datasetId,
  name: `ds ${datasetId}`,
  alias: datasetId,
  datasetName: `ds ${datasetId}`,
  datasetIdentifier: `DUOS-${String(datasetId).padStart(6, '0')}`,
  dataUse,
  dacId,
  createUserId: 1,
  createUser,
  createDate: new Date(),
  updateDate: new Date(),
  updateUserId: 1,
  translatedDataUse: '',
  deletable: false,
  properties: [],
  study,
  dacApproval: false,
})

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const REF = 'dar-reference-id-1'

const dar_collection: DarCollection = {
  darCollectionId: 1,
  darCode: 'DAR-001',
  createDate: 1,
  updateDate: 1,
  createUserId: 1,
  dars: {
    [REF]: {
      id: 1,
      referenceId: REF,
      collectionId: 1,
      data: {
        projectTitle: 'Test Project', piName: 'Test PI Name', darCode: 'DAR-001',
        checkNihDataOnly: false, rus: '', nonTechRus: '', diseases: false, methods: false,
        aiLlmUse: false, controls: false, population: false, other: false, otherText: '',
        forProfit: false, oneGender: false, gender: '', pediatric: false, illegalBehavior: false,
        addiction: false, sexualDiseases: false, stigmatizedDiseases: false, vulnerablePopulation: false,
        populationMigration: false, psychiatricTraits: false, notHealth: false, hmb: false,
        status: 'submitted', poa: false, datasets: [], restriction: {}, validRestriction: true,
        researchPlans: 'Test research plans', anvilUse: false, cloudUse: false, localUse: false,
        cloudProvider: '', cloudProviderType: '', cloudProviderDescription: '',
        geneticStudiesOnly: false, irb: false, itDirector: '', itDirectorEmail: '',
        signingOfficial: '', signingOfficialEmail: '', publication: false, collaboration: false,
        forensicActivities: false, sharingDistribution: false, ontologies: [],
        labCollaborators: [], internalCollaborators: [], externalCollaborators: [],
        dsAcknowledgement: false, gsoAcknowledgement: false, pubAcknowledgement: false,
        piEmail: 'test@example.com', piCountryOfOperation: 'US',
      },
      draft: false, progressReport: false, expired: false, rationale: '', rus: {},
      status: 'submitted', userId: 1, eraCommonsId: 'test-era-commons-id',
      expiresAt: 0, createDate: 0, submissionDate: 0, updateDate: 0,
      elections: {
        1: makeElection(1, 'DataAccess', 1, REF, [1, 2, 3]),
        2: makeElection(2, 'RP', 1, REF, [4, 5, 6]),
        3: makeElection(3, 'DataAccess', 2, REF, [11, 22, 33]),
        4: makeElection(4, 'RP', 2, REF, [44, 55, 66]),
        5: makeElection(5, 'DataAccess', 3, REF, [111, 222, 333]),
        6: makeElection(6, 'RP', 3, REF, [444, 555, 666]),
        7: makeElection(7, 'DataAccess', 4, REF, [1111, 2222, 3333]),
        8: makeElection(8, 'RP', 4, REF, [4444, 5555, 6666]),
        9: makeElection(9, 'DataAccess', 5, REF, [11111, 22222, 33333]),
        10: makeElection(10, 'RP', 5, REF, [44444, 55555, 66666]),
      },
      datasetIds: [1, 2, 3, 4, 5],
    } as unknown as DataAccessRequest,
  },
  datasets: [
    makeDataset(1, 1, { generalUse: true }),
    makeDataset(2, 2, { generalUse: true }),
    makeDataset(3, 3, { generalUse: false, other: 'other restrictions' }),
    makeDataset(4, 4, { generalUse: false, secondaryOther: 'secondary other restrictions' }),
    makeDataset(5, 5),
  ],
}

const match_results = [
  { id: '1', consent: 'DUOS-000001', purpose: REF, match: true, failed: false, abstain: false, createDate: 'Jan 23, 2023', algorithmVersion: 'v2', rationales: [] },
  { id: '2', consent: 'DUOS-000002', purpose: REF, match: true, failed: false, abstain: false, createDate: 'Jan 23, 2023', algorithmVersion: 'v2', rationales: [] },
] as unknown as MatchResult[]

const dataset_terms = [
  { datasetId: 1, datasetName: 'ds 1', datasetIdentifier: 'DUOS-000001', dataUse: { primary: [{ code: 'GRU', description: 'General Research Use' }] }, dacId: 1, dac: { dacId: 1, dacName: 'Test DAC 1', dacEmail: 'email1' } },
  { datasetId: 2, datasetName: 'ds 2', datasetIdentifier: 'DUOS-000002', dataUse: { primary: [{ code: 'GRU', description: 'General Research Use' }] }, dacId: 2, dac: { dacId: 2, dacName: 'Test DAC 2', dacEmail: 'email2' } },
  { datasetId: 3, datasetName: 'ds 3', datasetIdentifier: 'DUOS-000003', dataUse: { primary: [{ code: 'OTHER', description: 'Other Restrictions' }] }, dacId: 3, dac: { dacId: 3, dacName: 'Test DAC 3', dacEmail: 'email3' } },
  { datasetId: 4, datasetName: 'ds 4', datasetIdentifier: 'DUOS-000004', dataUse: { primary: [], secondary: [{ code: 'OTHER', description: 'Other Restrictions' }] }, dacId: 4, dac: { dacId: 4, dacName: 'Test DAC 4', dacEmail: 'email4' } },
  { datasetId: 5, datasetName: 'ds 5', datasetIdentifier: 'DUOS-000005', dacId: 5, dac: { dacId: 5, dacName: 'Test DAC5', dacEmail: 'email5' } },
] as unknown as DatasetTerm[]

const similar_data_use_collection: DarCollection = {
  darCollectionId: 1,
  darCode: 'DAR-001',
  createDate: 1,
  updateDate: 1,
  createUserId: 1,
  dars: {
    [REF]: {
      id: 1,
      referenceId: REF,
      collectionId: 1,
      data: {
        projectTitle: 'Test Project', checkNihDataOnly: false,
        rus: 'Test research use statement', nonTechRus: 'Non-technical research use statement',
        diseases: false, methods: false, aiLlmUse: false, controls: false, population: false,
        other: false, otherText: '', ontologies: [], forProfit: false, oneGender: false,
        gender: '', pediatric: false, illegalBehavior: false, addiction: false,
        sexualDiseases: false, stigmatizedDiseases: false, vulnerablePopulation: false,
        populationMigration: false, psychiatricTraits: false, notHealth: false, hmb: false,
        status: 'submitted', poa: false, datasets: [], restriction: {}, validRestriction: true,
        researchPlans: 'Test research plans', anvilUse: false, cloudUse: false, localUse: false,
        cloudProvider: '', cloudProviderType: '', cloudProviderDescription: '',
        geneticStudiesOnly: false, irb: false, itDirector: '', itDirectorEmail: '',
        signingOfficial: '', signingOfficialEmail: '', publication: false, collaboration: false,
        forensicActivities: false, sharingDistribution: false, labCollaborators: [],
        internalCollaborators: [], externalCollaborators: [], dsAcknowledgement: false,
        gsoAcknowledgement: false, pubAcknowledgement: false, piName: 'Test PI Name',
        piEmail: 'test@example.com', piCountryOfOperation: 'US',
      },
      draft: false, progressReport: false, expired: false, rationale: '', rus: {},
      status: 'submitted', userId: 1, eraCommonsId: 'test-era-commons-id',
      expiresAt: 0, createDate: 0, submissionDate: 0, updateDate: 0,
      elections: {
        1: makeElection(1, 'DataAccess', 1, REF, [1, 2, 3]),
        2: makeElection(2, 'RP', 1, REF, [4, 5, 6]),
        3: makeElection(3, 'DataAccess', 2, REF, [7, 8, 9]),
        4: makeElection(4, 'RP', 2, REF, [10, 11, 12]),
        5: makeElection(5, 'DataAccess', 3, REF, [13, 14, 15]),
        6: makeElection(6, 'RP', 3, REF, [16, 17, 18]),
        7: makeElection(7, 'DataAccess', 4, REF, [19, 20, 21]),
        8: makeElection(8, 'RP', 4, REF, [22, 23, 24]),
        9: makeElection(9, 'DataAccess', 5, REF, [25, 26, 27]),
        10: makeElection(10, 'RP', 5, REF, [28, 29, 30]),
      },
      datasetIds: [1, 2, 3, 4, 5],
    } as unknown as DataAccessRequest,
  },
  datasets: [
    makeDataset(1, 1, { hmbResearch: true, other: 'Samples and information may not be sold for profit.' }),
    makeDataset(2, 2, { generalUse: true }),
    makeDataset(3, 3, { hmbResearch: true }),
    makeDataset(4, 4, { generalUse: true }),
    makeDataset(5, 5, { hmbResearch: true }),
  ],
}

const similar_data_use_terms = [
  { datasetId: 1, datasetName: 'ds 1', datasetIdentifier: 'DUOS-000001', dataUse: { primary: [{ code: 'HMB', description: 'Health, Medical and Biomedical Research' }, { code: 'OTHER', description: 'Samples and information may not be sold for profit.' }] }, dacId: 1 },
  { datasetId: 2, datasetName: 'ds 2', datasetIdentifier: 'DUOS-000002', dataUse: { primary: [{ code: 'GRU', description: 'General Research Use' }] }, dacId: 2 },
  { datasetId: 3, datasetName: 'ds 3', datasetIdentifier: 'DUOS-000003', dataUse: { primary: [{ code: 'HMB', description: 'Health, Medical and Biomedical Research' }] }, dacId: 3 },
  { datasetId: 4, datasetName: 'ds 4', datasetIdentifier: 'DUOS-000004', dataUse: { primary: [{ code: 'GRU', description: 'General Research Use' }] }, dacId: 4 },
  { datasetId: 5, datasetName: 'ds 5', datasetIdentifier: 'DUOS-000005', dataUse: { primary: [{ code: 'HMB', description: 'Health, Medical and Biomedical Research' }] }, dacId: 5 },
] as unknown as DatasetTerm[]

// ─── shouldAbstain cases ──────────────────────────────────────────────────────

const matchableCases: DataUseSummary[] = [
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NCU', description: 'NCU' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NMDS', description: 'NMDS' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'NCTRL', description: 'NCTRL' }] },
]

const unmatchableCases: DataUseSummary[] = [
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'OTHER', description: 'OTHER' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-M', description: 'POP-M' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-F', description: 'POP-F' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'COL', description: 'COL' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'IRB', description: 'IRB' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'GSO', description: 'GSO' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'PUB', description: 'PUB' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'MOR', description: 'MOR' }] },
  { primary: [{ code: 'GRU', description: 'GRU' }], secondary: [{ code: 'POP-PD', description: 'POP-PD' }] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const verifyBucketElectionsAndDatasets = (buckets: Bucket[]) => {
  for (const b of buckets) {
    for (const e of b.elections) {
      expect(b.datasetIds).toContain(e.datasetId)
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BucketUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('instantiates a collection into buckets', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)

    expect(buckets).not.toHaveLength(0)
    for (const b of buckets) {
      expect(b.key).not.toBe('')
      expect(b.votes).not.toHaveLength(0)
      expect(b.label).not.toBe('')
      expect(b.datasets).not.toHaveLength(0)
      expect(b.datasetIds).not.toHaveLength(0)
      if (b.dataUse) {
        expect(b.dataUse).not.toStrictEqual({})
        expect(b.dataUses).not.toHaveLength(0)
      }
      expect(b.elections).not.toHaveLength(0)
    }
  })

  it('there should be a bucket with two GRU datasets', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)
    const gruBucket = buckets.find(b => b.label === 'GRU')

    expect(gruBucket).toBeDefined()
    expect(gruBucket?.datasets).not.toHaveLength(0)
    expect(gruBucket?.datasets).toHaveLength(2)
  })

  it('there should be a bucket with a primary OTHER dataset', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)
    const other = buckets.find(b => b.label === 'OTHER')

    expect(other).toBeDefined()
    expect(other?.datasets).not.toHaveLength(0)
    expect(other?.datasets).toHaveLength(1)
  })

  it('there should be a bucket with a secondary OTHER dataset', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)
    const secondaryOther = buckets.find(b => b.label === 'OTHER')

    expect(secondaryOther).toBeDefined()
    expect(secondaryOther?.datasets).not.toHaveLength(0)
    expect(secondaryOther?.datasets).toHaveLength(1)
  })

  it('there should be a bucket with an undefined data use', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)
    const missingDataUse = buckets.find(b => isUndefined(b.dataUse))

    expect(missingDataUse).toBeDefined()
    expect(missingDataUse?.datasets).not.toHaveLength(0)
    expect(missingDataUse?.datasets).toHaveLength(1)
    expect(missingDataUse?.dataUse).toBeUndefined()
    expect(missingDataUse?.dataUses).toHaveLength(0)
  })

  it('buckets should be filtered to datasets containing one dac id: 1', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms.filter(d => d.dacId === 1))

    const buckets = await binCollectionToBuckets(dar_collection, [1])

    expect(buckets).toHaveLength(1)
    expect(buckets[0].datasetIds).toHaveLength(1)
    verifyBucketElectionsAndDatasets(buckets)
  })

  it('buckets should be filtered to datasets containing two dac ids: 1 & 5', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms.filter(d => d.dacId === 1 || d.dacId === 5))

    const buckets = await binCollectionToBuckets(dar_collection, [1, 5])

    expect(buckets).toHaveLength(2)
    verifyBucketElectionsAndDatasets(buckets)
  })

  it('match failures should be condensed for a bucket with two failing matches', async () => {
    const failing_matches = [
      { id: '1', consent: 'DUOS-000001', purpose: REF, match: false, failed: false, abstain: true, createDate: 'Jan 23, 2023', algorithmVersion: 'v2', rationales: ['1', '2', '3'] },
      { id: '2', consent: 'DUOS-000002', purpose: REF, match: false, failed: false, abstain: true, createDate: 'Jan 23, 2023', algorithmVersion: 'v2', rationales: ['1', '2', '3', '4', '5'] },
    ] as unknown as MatchResult[]
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(failing_matches)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(dataset_terms)

    const buckets = await binCollectionToBuckets(dar_collection)

    expect(buckets).not.toHaveLength(0)
    let rationaleCheck = false
    for (const b of buckets) {
      if (b.matchResults && b.matchResults.length > 0) {
        expect(b.algorithmResult?.rationales).not.toHaveLength(0)
        expect(b.algorithmResult?.rationales).toHaveLength(5)
        rationaleCheck = true
      }
    }
    expect(rationaleCheck).toBe(true)
  })

  it.each(matchableCases)('correctly determines matchable data use: %j', (dataUse) => {
    expect(shouldAbstain(dataUse)).toBe(false)
  })

  it.each(unmatchableCases)('correctly determines unmatchable data use: %j', (dataUse) => {
    expect(shouldAbstain(dataUse)).toBe(true)
  })

  it('correctly buckets data uses when there are similar data use entries', async () => {
    vi.spyOn(Match, 'findMatchBatch').mockResolvedValue(match_results)
    vi.spyOn(DataSet, 'searchDatasetIndex').mockResolvedValue(similar_data_use_terms)

    const buckets = await binCollectionToBuckets(similar_data_use_collection)

    expect(buckets).not.toHaveLength(0)
    // Three distinct data-use patterns → three buckets
    expect(buckets).toHaveLength(3)
    // HMB + Other
    expect(buckets[0].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'HMB')).toBeDefined()
    expect(buckets[0].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'OTHER')).toBeDefined()
    // General Use
    expect(buckets[1].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'GRU')).toBeDefined()
    // HMB only
    expect(buckets[2].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'HMB')).toBeDefined()
    expect(buckets[2].dataUse?.primary?.find((t: DataUseTerm) => t.code === 'OTHER')).toBeUndefined()
  })
})
