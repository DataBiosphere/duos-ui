import { DatasetTerm, StudyTerm, UserTerm } from 'src/types/model'
import { ModelRow } from 'src/types/library'

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

export const makeModelRow = (overrides: Partial<ModelRow> = {}): ModelRow => ({
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
