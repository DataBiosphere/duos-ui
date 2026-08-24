import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DACDatasetsTable } from 'src/components/dac_dataset_table/DACDatasetsTable'
import { Storage } from 'src/libs/storage'
import { DatasetTerm } from 'src/types/model'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { getNIHInstitutionalCertification: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('src/components/dac_dataset_table/DACDatasetApprovalStatus', () => ({
  default: ({ dataset }: { dataset: DatasetTerm }) => {
    if (dataset.dacApproval === true) return <div>ACCEPTED</div>
    if (dataset.dacApproval === false) return <div>REJECTED</div>
    return <div>UNDECIDED</div>
  },
}))

vi.mock('src/utils/DataUseUtils', () => ({
  processDataUseCodes: vi.fn((dataset: DatasetTerm) => {
    const primary = (dataset.dataUse as { primary?: Array<{ code: string, description: string }> })?.primary ?? []
    return { codeList: primary.map(p => p.code), codesAndDescriptions: primary }
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
    phsId: 'phs000649',
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

const mountTable = (props: Partial<React.ComponentProps<typeof DACDatasetsTable>> = {}) =>
  render(
    <div style={{ width: 1200 }}>
      <DACDatasetsTable datasets={[]} columns={defaultColumns} isLoading={false} {...props} />
    </div>,
  )

describe('DACDatasetsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a column header for each provided column', () => {
    mountTable({ datasets: [makeDataset()] })
    expect(screen.getByText('DUOS ID')).toBeInTheDocument()
    expect(screen.getByText('PHS ID')).toBeInTheDocument()
    expect(screen.getByText('Dataset Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders dataset rows with DUOS ID', () => {
    const { container } = mountTable({ datasets: [makeDataset()] })
    const row = container.querySelector('.MuiDataGrid-row[data-id="1"]')!
    expect(within(row as HTMLElement).getByText('DUOS-000649')).toBeInTheDocument()
  })

  it('shows HMB data use code', () => {
    const dataset = makeDataset({
      dataUse: {
        primary: [{ code: 'HMB', description: 'Data is limited for health/medical/biomedical research.' }],
      },
    })
    mountTable({ datasets: [dataset] })
    expect(screen.getByText('HMB')).toBeInTheDocument()
  })

  it('shows REJECTED for rejected dataset', () => {
    mountTable({ datasets: [makeDataset({ dacApproval: false })] })
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
  })

  it('shows ACCEPTED for approved dataset', () => {
    mountTable({ datasets: [makeDataset({ dacApproval: true })] })
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    mountTable({ datasets: [], isLoading: true })
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })

  it('renders empty table with no datasets', () => {
    const { container } = mountTable({ datasets: [] })
    expect(container.querySelectorAll('.MuiDataGrid-row')).toHaveLength(0)
  })

  it('persists sort changes to user settings when a column header is clicked', async () => {
    const user = userEvent.setup()
    mountTable({ datasets: [makeDataset()] })
    await user.click(screen.getByText('DUOS ID'))
    expect(Storage.setCurrentUserSettings).toHaveBeenCalledWith(
      'storageDACDatasetSort',
      expect.arrayContaining([expect.objectContaining({ field: 'datasetIdentifier' })]),
    )
  })
})
