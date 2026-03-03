import { BioSpecimenPreservationMethod, BioSpecimenType, DatasetTerm, Sex, StudyTerm, UserTerm } from 'src/types/model'
import { BiospecimenAsset, ModelAsset } from 'src/types/library'

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
