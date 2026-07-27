import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { makeMockParams } from './columnTestUtils'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { Storage } from 'src/libs/storage'
import { DatasetTerm, DuosUser, LibraryCard } from 'src/types/model'

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

const renderCell = (
  field: string,
  value: unknown,
  row: Partial<DatasetTerm> = {},
  columns = makeDatasetColumns(),
) => {
  const col = columns.find(c => c.field === field)!
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
      'requestLocation',
      'participantCount',
      'dataUse',
      'dac',
      'actions',
    ])
  })
})

describe('datasetColumns — Access Management chip', () => {
  it.each([
    ['controlled', 'via DUOS', '.MuiChip-colorPrimary'],
    ['open', 'Open Access', '.MuiChip-colorSuccess'],
    ['external', 'External to DUOS', '.MuiChip-colorSecondary'],
    ['something-unknown', 'something-unknown', '.MuiChip-colorDefault'],
  ])('renders chip for %s access — correct label, color, and no Bolt icon', (value, label, colorClass) => {
    const { container } = renderCell('accessManagement', value)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector(colorClass)).toBeInTheDocument()
    expect(container.querySelector('svg[data-testid="BoltIcon"]')).not.toBeInTheDocument()
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

describe('datasetColumns — Request Path column', () => {
  beforeEach(() => {
    // A library card is required for the Request Now button to be enabled
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({
      userId: 42,
      libraryCard: {} as LibraryCard,
    } as DuosUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('always shows a "-" for open access datasets, ignoring requestLocation', () => {
    const { container } = renderCell('requestLocation', 'https://example.com', { accessManagement: 'open' })
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('shows an enabled "Request Now" button for controlled (via DUOS) datasets', () => {
    renderCell('requestLocation', null, { accessManagement: 'controlled' })
    expect(screen.getByRole('button', { name: 'Request Now' })).not.toBeDisabled()
  })

  it('disables the "Request Now" button when the user has no library card', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 42 } as DuosUser)
    renderCell('requestLocation', null, { accessManagement: 'controlled' })
    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()
  })

  it('disables the "Request Now" button when datasets are selected elsewhere on the page', () => {
    const columnsWithSelection = makeDatasetColumns({}, new Set(), true)
    renderCell('requestLocation', null, { accessManagement: 'controlled' }, columnsWithSelection)
    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()
  })

  it('shows a link to the requestLocation for external datasets', () => {
    renderCell('requestLocation', 'https://example.com/request', { accessManagement: 'external' })
    const link = screen.getByRole('link', { name: 'https://example.com/request' })
    expect(link).toHaveAttribute('href', 'https://example.com/request')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders the location text without an href when the URL is invalid', () => {
    const { container } = renderCell('requestLocation', 'not-a-valid-url', { accessManagement: 'external' })
    expect(screen.getByText('not-a-valid-url')).toBeInTheDocument()
    expect(container.querySelector('a[href]')).not.toBeInTheDocument()
  })

  it('renders nothing for external datasets without a requestLocation', () => {
    const { container } = renderCell('requestLocation', null, { accessManagement: 'external' })
    expect(container.textContent).toBe('')
  })
})
