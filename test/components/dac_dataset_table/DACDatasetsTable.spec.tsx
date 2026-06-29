import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DACDatasetsTable } from 'src/components/dac_dataset_table/DACDatasetsTable'
import { DatasetTerm } from 'src/types/model'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'

vi.mock('react-router-dom', () => {
  const navigate = vi.fn()
  return { useNavigate: () => navigate }
})

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
  },
}))

vi.mock('src/components/dac_dataset_table/DACDatasetApprovalStatus', () => ({
  default: ({ dataset }: { dataset: DatasetTerm }) => {
    if (dataset.dacApproval) return <div>ACCEPTED</div>
    if (!dataset.dacApproval) return <div>REJECTED</div>
    return <div>UNDECIDED</div>
  },
}))

vi.mock('src/utils/DataUseUtils', () => ({
  processDataUseCodes: vi.fn((dataset: DatasetTerm) => {
    const primary = (dataset.dataUse as { primary?: Array<{ code: string, description: string }> })?.primary ?? []
    const codeList = primary.map(p => p.code)
    return { codeList, codesAndDescriptions: primary }
  }),
  createDataUseDisplay: vi.fn((opts: { dataset: DatasetTerm }) => {
    const primary = (opts.dataset.dataUse as { primary?: Array<{ code: string }> })?.primary ?? []
    return <span>{primary.map(p => p.code).join(', ')}</span>
  }),
}))

const makeDataset = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 1,
  createUserId: 1,
  createUserDisplayName: 'Admin',
  datasetIdentifier: 'DUOS-000649',
  deletable: false,
  datasetName: 'Test Dataset',
  participantCount: 10,
  dataLocation: 'AnVIL Workspace',
  url: 'https://example.com',
  dacId: 4,
  dacApproval: null as unknown as boolean,
  accessManagement: 'open',
  approvedUserIds: [],
  piName: 'PI Name',
  dataUse: { primary: [] },
  study: {
    description: 'Test Dataset Submission',
    studyName: 'Test Study',
    studyId: 39,
    phsId: 'PHS ID',
    phenotype: 'Test',
    species: 'Human',
    piName: 'PI',
    dataSubmitterEmail: 'user@broadinstitute.org',
    dataSubmitterId: 3351,
    dataCustodianEmail: ['grushton@broadinstitute.org'],
    publicVisibility: true,
    dataTypes: ['CITE-seq'],
  },
  submitter: { userId: 1, displayName: 'Admin', institution: { id: 150, name: 'Broad Institute' } },
  updateUser: { userId: 1, displayName: 'Admin', institution: { id: 150, name: 'Broad Institute' } },
  dac: { dacId: 4, dacName: 'DAC 0002', dacEmail: 'dac@broad.mit.edu' },
  ...overrides,
})

const defaultColumns = [
  DACDatasetTableColumnOptions.DUOS_ID,
  DACDatasetTableColumnOptions.PHS_ID,
  DACDatasetTableColumnOptions.DATASET_NAME,
  DACDatasetTableColumnOptions.STUDY_NAME,
  DACDatasetTableColumnOptions.DATA_SUBMITTER,
  DACDatasetTableColumnOptions.DATA_CUSTODIAN,
  DACDatasetTableColumnOptions.DATA_USE,
  DACDatasetTableColumnOptions.CERTIFICATION_LINK,
  DACDatasetTableColumnOptions.STATUS,
]

describe('DACDatasetsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders column headers', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[makeDataset()]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    const headers = document.querySelectorAll('.column-header')
    expect(headers.length).toBe(defaultColumns.length)
  })

  it('renders dataset rows with DUOS ID', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[makeDataset()]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    expect(document.querySelector('.row-data-0')?.textContent).toContain('DUOS-000649')
  })

  it('shows HMB data use code', async () => {
    const dataset = makeDataset({
      dataUse: {
        primary: [{ code: 'HMB', description: 'Data is limited for health/medical/biomedical research.' }],
      },
    })
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[dataset]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    expect(screen.getByText('HMB')).toBeInTheDocument()
  })

  it('shows REJECTED for rejected dataset', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[makeDataset({ dacApproval: false })]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
  })

  it('shows ACCEPTED for approved dataset', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[makeDataset({ dacApproval: true })]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
  })

  it('renders loading state', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[]}
          columns={defaultColumns}
          isLoading={true}
        />,
      )
    })
    expect(document.querySelector('.table-loading-placeholder')).toBeInTheDocument()
  })

  it('renders empty table with no datasets', async () => {
    await act(async () => {
      render(
        <DACDatasetsTable
          datasets={[]}
          columns={defaultColumns}
          isLoading={false}
        />,
      )
    })
    expect(document.querySelectorAll('.row-data-0')).toHaveLength(0)
  })
})
