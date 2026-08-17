import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import {
  duosIdCellData,
  nihCertificationLinkData,
  duosPhsIdCellData,
  dataSubmitterCellData,
  datasetNameCellData,
  studyNameCellData,
  dataCustodianCellData,
  dataUseCellData,
  statusCellData,
  consoleTypes,
  type CellDataParams,
} from 'src/components/dac_dataset_table/DACDatasetTableCellData'
import { styles } from 'src/components/dac_dataset_table/DACDatasetConstants'
import { DatasetTerm } from 'src/types/model'

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { getNIHInstitutionalCertification: vi.fn() },
}))

vi.mock('src/utils/DataUseUtils', () => ({
  processDataUseCodes: vi.fn(() => ({
    codeList: ['HMB'],
    // Mirrors the real DataUseCode shape (shortCode/type included) — vi.mock factories
    // are not type-checked against the module, so this has to be kept in step by hand.
    codesAndDescriptions: [{ code: 'HMB', shortCode: 'HMB', description: 'Health/Medical/Biomedical', type: 'primary' }],
  })),
  createDataUseDisplay: vi.fn(() => <span>HMB</span>),
}))

vi.mock('src/components/dac_dataset_table/DACDatasetApprovalStatus', () => ({
  default: () => <div>Status</div>,
}))

const makeDataset = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 1,
  createUserId: 1,
  createUserDisplayName: 'Admin',
  datasetIdentifier: 'DUOS-000001',
  deletable: false,
  datasetName: 'Test Dataset',
  participantCount: 10,
  dataLocation: 'AnVIL Workspace',
  url: 'https://example.com',
  dacId: 4,
  dacApproval: false,
  accessManagement: 'open',
  approvedUserIds: [],
  piName: 'PI Name',
  dataUse: { primary: [] },
  study: {
    description: 'Study desc',
    studyName: 'Test Study',
    studyId: 39,
    phsId: 'phs000001',
    phenotype: 'phenotype',
    species: 'human',
    piName: 'PI Name',
    dataSubmitterEmail: 'user@test.org',
    dataSubmitterId: 3351,
    dataCustodianEmail: ['custodian@test.org', 'custodian2@test.org'],
    publicVisibility: true,
    dataTypes: ['WGS'],
  },
  submitter: { userId: 1, displayName: 'Admin', institution: { id: 1, name: 'MIT' } },
  updateUser: { userId: 1, displayName: 'Admin', institution: { id: 1, name: 'MIT' } },
  dac: { dacId: 4, dacName: 'DAC 0002', dacEmail: 'dac@test.org' },
  ...overrides,
})

const makeParams = (overrides: Partial<CellDataParams> = {}): CellDataParams => ({
  dataset: makeDataset(),
  ...overrides,
})

describe('DACDatasetTableCellData', () => {
  describe('consoleTypes', () => {
    it('has CHAIR constant', () => {
      expect(consoleTypes.CHAIR).toBe('chair')
    })
  })

  describe('duosIdCellData', () => {
    it('returns dataset identifier as data and value', () => {
      const result = duosIdCellData(makeParams())
      expect(result.value).toBe('DUOS-000001')
      expect(result.id).toBe('identifier-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.duosId })
    })

    it('uses custom label when provided', () => {
      const result = duosIdCellData(makeParams({ label: 'custom-label' }))
      expect(result.label).toBe('custom-label')
    })

    it('defaults label to duosIdCellData', () => {
      const result = duosIdCellData(makeParams())
      expect(result.label).toBe('duosIdCellData')
    })
  })

  describe('nihCertificationLinkData', () => {
    it('returns empty div when no institution certification', () => {
      const result = nihCertificationLinkData(makeParams({ dataset: makeDataset({ hasInstitutionCertification: false }) }))
      expect(result.value).toBe(false)
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.certificationLink })
    })

    it('returns button when institution certification exists', () => {
      const result = nihCertificationLinkData(makeParams({ dataset: makeDataset({ hasInstitutionCertification: true }) }))
      expect(result.value).toBe(true)
      expect(result.id).toBe('identifier-cell-data-1-file')
    })
  })

  describe('duosPhsIdCellData', () => {
    it('returns study phsId', () => {
      const result = duosPhsIdCellData(makeParams())
      expect(result.value).toBe('phs000001')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.phsId })
    })

    it('returns empty string when study phsId is missing', () => {
      const ds = makeDataset()
      ds.study = { ...ds.study, phsId: undefined as unknown as string }
      const result = duosPhsIdCellData(makeParams({ dataset: ds }))
      expect(result.value).toBe('')
    })
  })

  describe('dataSubmitterCellData', () => {
    it('returns submitter display name', () => {
      const result = dataSubmitterCellData(makeParams())
      expect(result.value).toBe('Admin')
      expect(result.id).toBe('data-submitter-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.dataSubmitter })
    })

    it('returns empty string when submitter is missing', () => {
      const ds = makeDataset()
      ds.submitter = { ...ds.submitter, displayName: undefined as unknown as string }
      const result = dataSubmitterCellData(makeParams({ dataset: ds }))
      expect(result.value).toBe('')
    })
  })

  describe('datasetNameCellData', () => {
    it('returns dataset name', () => {
      const result = datasetNameCellData(makeParams())
      expect(result.value).toBe('Test Dataset')
      expect(result.id).toBe('name-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.datasetName })
    })
  })

  describe('studyNameCellData', () => {
    it('returns study name', () => {
      const result = studyNameCellData(makeParams())
      expect(result.value).toBe('Test Study')
      expect(result.id).toBe('name-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.studyName })
    })

    it('returns empty string when study name is missing', () => {
      const ds = makeDataset()
      ds.study = { ...ds.study, studyName: undefined as unknown as string }
      const result = studyNameCellData(makeParams({ dataset: ds }))
      expect(result.value).toBe('')
    })
  })

  describe('dataCustodianCellData', () => {
    it('joins dataCustodianEmail array with comma', () => {
      const result = dataCustodianCellData(makeParams())
      expect(result.value).toBe('custodian@test.org, custodian2@test.org')
      expect(result.id).toBe('custodian-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.dataCustodian })
    })

    it('returns empty string when dataCustodianEmail is empty', () => {
      const ds = makeDataset()
      ds.study = { ...ds.study, dataCustodianEmail: [] }
      const result = dataCustodianCellData(makeParams({ dataset: ds }))
      expect(result.value).toBe('')
    })
  })

  describe('dataUseCellData', () => {
    it('returns data use display', () => {
      const result = dataUseCellData(makeParams())
      expect(result.id).toBe('data-use-cell-data-1')
      expect(result.value).toBe('HMB')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.dataUse })
    })

    it('uses custom cellWidth when provided', () => {
      const result = dataUseCellData(makeParams({ cellWidth: '20%' }))
      expect(result.cellStyle).toEqual({ width: '20%' })
    })
  })

  describe('statusCellData', () => {
    it('returns status cell with DACDatasetApprovalStatus component', () => {
      const result = statusCellData(makeParams())
      expect(result.id).toBe('status-cell-data-1')
      expect(result.cellStyle).toEqual({ width: styles.cellWidths.status })
      expect(React.isValidElement(result.data)).toBe(true)
    })
  })
})
