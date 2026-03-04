import { BioSpecimenPreservationMethod, BioSpecimenType, ClinicalTrialInterventionType, ClinicalTrialPhase, ClinicalTrialStatus, DatasetTerm, Sex, StudyTerm, UserTerm } from 'src/types/model'
import { ClinicalTrialAsset, BiospecimenAsset, ModelAsset, PresentationAsset, PublicationAsset } from 'src/types/library'

export const makeUserTerm = (overrides: Partial<UserTerm> = {}): UserTerm => ({
  userId: 0,
  displayName: 'some name',
  institution: {
    id: 0,
    name: 'some name',
  },
  ...overrides,
})

export const makeStudyTerm = (overrides: Partial<StudyTerm> = {}): StudyTerm => ({
  description: 'description',
  studyName: 'name',
  studyId: 0,
  phsId: 'phsid',
  phenotype: 'phenotype',
  species: 'species',
  piName: 'pi name',
  dataSubmitterEmail: 'data submitter email',
  dataSubmitterId: 0,
  dataCustodianEmail: ['data custodian email'],
  publicVisibility: false,
  dataTypes: ['data type'],
  ...overrides,
})

export const makeDatasetTerm = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 0,
  createUserId: 0,
  createUserDisplayName: 'user',
  datasetIdentifier: 'DUOS-123456',
  deletable: true,
  datasetName: 'dataset',
  participantCount: 1,
  dataUse: {
    primary: [{ code: 'foo', description: 'bar' }],
    secondary: [{ code: 'foo', description: 'bar' }],
  },
  dataLocation: 'somewhere',
  url: 'some url',
  dacId: 0,
  dacApproval: true,
  accessManagement: 'access',
  approvedUserIds: [0],
  study: makeStudyTerm(),
  submitter: makeUserTerm(),
  updateUser: makeUserTerm(),
  dac: {
    dacId: 0,
    dacName: 'some name',
    dacEmail: 'some email',
  },
  piName: 'pi name',
  ...overrides,
})

export const makeModelRow = (overrides: Partial<ModelAsset> = {}): ModelAsset => ({
  modelId: 'model-1',
  studyId: 42,
  studyName: 'Test Study',
  name: 'My Model',
  description: 'A test model',
  url: 'https://example.com/model',
  format: 'ONNX',
  license: 'MIT',
  trainedOnDatasets: [],
  maintainer: { name: 'Jane Doe', email: 'jane@example.com' },
  tags: ['genomics', 'classification'],
  ...overrides,
})

export const makeClinicalTrialRow = (overrides: Partial<ClinicalTrialAsset> = {}): ClinicalTrialAsset => ({
  clinicalTrialId: 'NCT00000001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'A Phase II Trial',
  registry: 'ClinicalTrials.gov',
  identifier: 'NCT00000001',
  status: ClinicalTrialStatus.RECRUITING,
  sponsor: 'NHGRI',
  startDate: '2024-01-01',
  interventionType: ClinicalTrialInterventionType.BIOLOGICAL,
  description: 'A test clinical trial',
  phase: ClinicalTrialPhase.PHASE2,
  url: 'https://clinicaltrials.gov/study/NCT00000001',
  tags: ['immunotherapy'],
  ...overrides,
})

export const makeBiospecimenRow = (overrides: Partial<BiospecimenAsset> = {}): BiospecimenAsset => ({
  biospecimenId: 'BS-001',
  studyId: 1,
  studyName: 'Test Study',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  sex: Sex.FEMALE,
  age: 45,
  organization: 'Test Biobank',
  ...overrides,
})

export const makePublicationRow = (overrides: Partial<PublicationAsset> = {}): PublicationAsset => ({
  publicationId: 'pub-001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'A Novel Approach to Genomics',
  pubmedId: '12345678',
  publishedDate: '2024-01-15',
  authors: [{ name: 'Alice Smith' }, { name: 'Bob Jones' }],
  authorNames: ['Alice Smith', 'Bob Jones'],
  bibliographicCitation: 'Smith A, Jones B. A Novel Approach. 2024.',
  datasetCitation: 'DUOS-123456',
  citation: true,
  journal: 'Nature Genetics',
  doi: '10.1038/ng.1234',
  url: 'https://doi.org/10.1038/ng.1234',
  access: 'open',
  tags: ['genomics', 'GWAS'],
  ...overrides,
})

export const makePresentationRow = (overrides: Partial<PresentationAsset> = {}): PresentationAsset => ({
  presentationId: 'pres-001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'Genomics Data Sharing in the Modern Era',
  date: '2024-03-15',
  url: 'https://example.com/presentation',
  authors: 'Alice Smith, Bob Jones',
  datasetCitation: 'DUOS-123456',
  citation: true,
  presenter: { name: 'Alice Smith', email: 'alice@example.com' },
  event: 'ASHG 2024',
  location: 'Denver, CO',
  format: 'Oral',
  access: 'open',
  tags: ['genomics', 'data-sharing'],
  ...overrides,
})
