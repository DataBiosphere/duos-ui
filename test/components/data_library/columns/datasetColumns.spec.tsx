import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeMockParams } from './columnTestUtils'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { DatasetTerm } from 'src/types/model'

const makeRow = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 1,
  createUserId: 0,
  createUserDisplayName: 'user',
  datasetIdentifier: 'DUOS-123456',
  deletable: true,
  datasetName: 'dataset',
  participantCount: 1,
  dataUse: { primary: [{ code: 'foo', description: 'bar' }], secondary: [] },
  dataLocation: 'somewhere',
  url: 'some url',
  dacId: 0,
  dacApproval: true,
  accessManagement: 'controlled',
  approvedUserIds: [],
  study: { studyId: 10, studyName: 'Test Study', description: '', phsId: '', phenotype: '', species: '', piName: '', dataSubmitterEmail: '', dataSubmitterId: 0, dataCustodianEmail: [], publicVisibility: false, dataTypes: [] },
  submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
  updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
  dac: { dacId: 0, dacName: 'Test DAC', dacEmail: '' },
  piName: 'pi name',
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<DatasetTerm> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = (field: string, value: unknown, row: Partial<DatasetTerm> = {}) => {
  const col = makeDatasetColumns().find(c => c.field === field)!
  return render(
    <MemoryRouter>
      {col.renderCell!(mockParams(value, row)) as React.ReactElement}
    </MemoryRouter>,
  )
}

describe('datasetColumns — column order', () => {
  it('returns columns in the expected order', () => {
    const fields = makeDatasetColumns().map(c => c.field)
    expect(fields).toEqual([
      'datasetName',
      'studyName',
      'datasetIdentifier',
      'accessManagement',
      'participantCount',
      'dataUse',
      'dac',
      'requestLocation',
      'actions',
    ])
  })
})

describe('datasetColumns — Access Management chip', () => {
  it('renders "Controlled" chip with primary color for controlled access', () => {
    const { container } = renderCell('accessManagement', 'controlled')
    expect(screen.getByText('Controlled')).toBeInTheDocument()
    expect(container.querySelector('.MuiChip-colorPrimary')).toBeInTheDocument()
  })

  it('renders "Open" chip with success color for open access', () => {
    const { container } = renderCell('accessManagement', 'open')
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(container.querySelector('.MuiChip-colorSuccess')).toBeInTheDocument()
  })

  it('renders "External" chip with secondary color for external access', () => {
    const { container } = renderCell('accessManagement', 'external')
    expect(screen.getByText('External')).toBeInTheDocument()
    expect(container.querySelector('.MuiChip-colorSecondary')).toBeInTheDocument()
  })

  it('renders "Unknown" chip with default color for unknown access', () => {
    const { container } = renderCell('accessManagement', 'something-unknown')
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(container.querySelector('.MuiChip-colorDefault')).toBeInTheDocument()
  })

  it('shows Bolt icon for radar enabled datasets', () => {
    const radarEnabledDatasetIds = new Set([1])
    const col = makeDatasetColumns({}, radarEnabledDatasetIds).find(c => c.field === 'accessManagement')!
    const { container } = render(
      <MemoryRouter>
        {col.renderCell!(mockParams('controlled', { datasetId: 1 })) as React.ReactElement}
      </MemoryRouter>,
    )
    expect(container.querySelector('svg[data-testid="BoltIcon"]')).toBeInTheDocument()
  })
})
