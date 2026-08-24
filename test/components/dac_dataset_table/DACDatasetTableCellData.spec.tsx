import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import {
  dataUseCellData,
  type CellDataParams,
} from 'src/components/dac_dataset_table/DACDatasetTableCellData'
import { styles } from 'src/components/dac_dataset_table/DACDatasetConstants'
import { DatasetTerm } from 'src/types/model'

vi.mock('src/utils/DataUseUtils', () => ({
  processDataUseCodes: vi.fn(() => ({
    codeList: ['HMB'],
    // Mirrors the real DataUseCode shape (shortCode/type included) — vi.mock factories
    // are not type-checked against the module, so this has to be kept in step by hand.
    codesAndDescriptions: [{ code: 'HMB', shortCode: 'HMB', description: 'Health/Medical/Biomedical', type: 'primary' }],
  })),
  createDataUseDisplay: vi.fn(() => <span>HMB</span>),
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
})
