import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { makeRenderCellHelper } from '../data_library/columns/columnTestUtils'
import { makeDACDatasetGridColumns } from 'src/components/dac_dataset_table/datasetGridColumns'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'
import { DatasetTerm } from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { getNIHInstitutionalCertification: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: { showError: vi.fn() },
}))

vi.mock('src/components/dac_dataset_table/DACDatasetApprovalStatus', () => ({
  default: ({ dataset }: { dataset: DatasetTerm }) => <div>Status for {dataset.datasetId}</div>,
}))

const makeRow = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 1,
  createUserId: 0,
  createUserDisplayName: 'user',
  datasetIdentifier: 'DUOS-000001',
  deletable: true,
  datasetName: 'Test Dataset',
  participantCount: 1,
  dataUse: { primary: [] },
  dataLocation: 'somewhere',
  url: 'url',
  dacId: 0,
  dacApproval: true,
  accessManagement: 'open',
  approvedUserIds: [],
  study: { studyId: 10, studyName: 'Test Study', description: '', phsId: 'phs000001', phenotype: '', species: '', piName: '', dataSubmitterEmail: '', dataSubmitterId: 0, dataCustodianEmail: ['custodian@test.org'], publicVisibility: false, dataTypes: [] },
  submitter: { userId: 0, displayName: 'Submitter Name', institution: { id: 0, name: '' } },
  updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
  dac: { dacId: 0, dacName: 'Test DAC', dacEmail: '' },
  piName: 'pi name',
  ...overrides,
})

const renderCell = makeRenderCellHelper<DatasetTerm>(makeDACDatasetGridColumns, makeRow)

describe('datasetGridColumns — column selection and order', () => {
  it('returns every column, in declaration order, by default', () => {
    const fields = makeDACDatasetGridColumns().map(c => c.field)
    expect(fields).toEqual([
      'datasetIdentifier',
      'phsId',
      'datasetName',
      'studyName',
      'dataSubmitter',
      'dataCustodian',
      'dataUse',
      'hasInstitutionCertification',
      'dacApproval',
    ])
  })

  it('returns only the requested columns, in the requested order', () => {
    const fields = makeDACDatasetGridColumns([
      DACDatasetTableColumnOptions.STATUS,
      DACDatasetTableColumnOptions.DUOS_ID,
    ]).map(c => c.field)
    expect(fields).toEqual(['dacApproval', 'datasetIdentifier'])
  })

  it('drops unrecognized column keys instead of emitting undefined entries', () => {
    const columns = makeDACDatasetGridColumns([DACDatasetTableColumnOptions.DUOS_ID, 'notAColumn'])
    expect(columns.map(c => c.field)).toEqual(['datasetIdentifier'])
  })
})

describe('datasetGridColumns — valueGetters', () => {
  const getValue = (field: string, row: DatasetTerm) => {
    const col = makeDACDatasetGridColumns().find(c => c.field === field)!
    return (col.valueGetter as (...args: unknown[]) => unknown)(undefined, row, col, {})
  }

  it('phsId reads study.phsId', () => {
    expect(getValue('phsId', makeRow())).toBe('phs000001')
  })

  it('dataSubmitter reads submitter.displayName', () => {
    expect(getValue('dataSubmitter', makeRow())).toBe('Submitter Name')
  })

  it('dataCustodian joins study.dataCustodianEmail', () => {
    const row = makeRow({ study: { ...makeRow().study, dataCustodianEmail: ['a@test.org', 'b@test.org'] } })
    expect(getValue('dataCustodian', row)).toBe('a@test.org, b@test.org')
  })

  it('dataUse resolves to the hyphenated code list so filtering sees text, not the raw object', () => {
    const row = makeRow({ dataUse: { primary: [{ code: 'HMB', description: 'd1' }, { code: 'GRU', description: 'd2' }] } } as Partial<DatasetTerm>)
    expect(getValue('dataUse', row)).toBe('HMB-GRU')
  })
})

describe('datasetGridColumns — Data Use chip', () => {
  const chipLabels = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('.MuiChip-label')).map(el => el.textContent)

  it('reuses the Data Library chip: one chip carrying every code, primaries first', () => {
    const { container } = renderCell('dataUse', undefined, {
      dataUse: {
        primary: [{ code: 'HMB', description: 'Health/Medical/Biomedical' }],
        secondary: [
          { code: 'PUB', description: 'Publication Required' },
          { code: 'GSO', description: 'Genetic Studies Only' },
        ],
      },
    })
    expect(chipLabels(container)).toEqual(['HMB-GSO-PUB'])
  })

  it('renders nothing when there are no data use codes', () => {
    const { container } = renderCell('dataUse', undefined, { dataUse: { primary: [] } })
    expect(container.textContent).toBe('')
  })
})

describe('datasetGridColumns — NIH Institutional Certification', () => {
  it('renders a download button when the dataset has a certification', () => {
    renderCell('hasInstitutionCertification', undefined, { hasInstitutionCertification: true })
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders nothing when the dataset has no certification', () => {
    const { container } = renderCell('hasInstitutionCertification', undefined, { hasInstitutionCertification: false })
    expect(container.textContent).toBe('')
  })

  it('surfaces the error returned by Consent when the download fails', async () => {
    vi.mocked(DataSet.getNIHInstitutionalCertification).mockRejectedValueOnce(new Error('Dataset not found'))
    renderCell('hasInstitutionCertification', undefined, { hasInstitutionCertification: true })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error downloading the NIH Institutional Certification for DUOS-000001: Dataset not found',
    }))
  })
})

describe('datasetGridColumns — Status', () => {
  it('renders the DACDatasetApprovalStatus component for the row', () => {
    renderCell('dacApproval', undefined, { datasetId: 42 })
    expect(screen.getByText('Status for 42')).toBeInTheDocument()
  })
})
