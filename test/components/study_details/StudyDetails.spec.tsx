import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import { Storage } from 'src/libs/storage'
import { applyForAccess } from 'src/utils/accessUtils'
import { DuosUser, LibraryCard } from 'src/types/model'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
    getTerraUrl: vi.fn().mockResolvedValue('http://terra.localhost'),
  },
  getApiUrl: vi.fn().mockResolvedValue('http://localhost'),
}))

vi.mock('src/libs/ajax/TerraDataRepo', () => ({
  TerraDataRepo: {
    listSnapshotsByDatasetIds: vi.fn().mockResolvedValue({ filteredTotal: 0, items: [], roleMap: {} }),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndex: vi.fn(),
  },
}))

vi.mock('src/utils/accessUtils', () => ({
  applyForAccess: vi.fn(),
}))

import { DataSet } from 'src/libs/ajax/DataSet'

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    datasetName: 'Some Dataset 1',
    participantCount: 1,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'controlled',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
  {
    datasetId: 123457,
    datasetIdentifier: 'DUOS-123457',
    datasetName: 'Some Dataset 2',
    participantCount: 2,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'external',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
  {
    datasetId: 123458,
    datasetIdentifier: 'DUOS-123458',
    datasetName: 'Some Dataset 3',
    participantCount: 3,
    dacId: 0,
    dacApproval: false,
    accessManagement: 'open',
    approvedUserIds: [],
    createUserId: 0,
    createUserDisplayName: 'user',
    deletable: false,
    dataLocation: '',
    url: '',
    dataUse: { primary: [], secondary: [] },
    submitter: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    updateUser: { userId: 0, displayName: 'user', institution: { id: 0, name: '' } },
    dac: { dacId: 0, dacName: 'DAC', dacEmail: '' },
    piName: '',
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
      dataSubmitterEmail: '',
      dataSubmitterId: 0,
      phsId: '',
      publicVisibility: false,
      dataTypes: [],
    },
  },
]

const mountComponent = () =>
  render(
    <MemoryRouter initialEntries={['/studies/1']}>
      <Routes>
        <Route path="/studies/:studyId" element={<StudyDetails />} />
      </Routes>
    </MemoryRouter>,
  )

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(datasets as never)
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({
    userId: 42,
    libraryCard: {} as LibraryCard,
  } as DuosUser)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Study details test', () => {
  it('shows the appropriate data for fields', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(screen.getByText(`DUOS-S${datasets[0].study.studyId}`)).toBeInTheDocument()
    expect(screen.getAllByText(datasets[0].study.studyName)[0]).toBeInTheDocument()
    expect(screen.getAllByText(datasets[0].study.description)[0]).toBeInTheDocument()
    expect(screen.getByText(datasets.reduce((total, dataset) => total + dataset.participantCount, 0).toString())).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.phenotype)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.species)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.piName)).toBeInTheDocument()
    expect(screen.getByText(datasets[0].study.dataCustodianEmail.join(', '))).toBeInTheDocument()
    expect(screen.getByRole('grid').closest('.MuiDataGrid-root')).toBeInTheDocument()
    expect(document.querySelectorAll('[role=row]')).toHaveLength(datasets.length + 1)
  })

  it('selects controlled datasets, displays LibraryFooter, and applies for access', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)
    const checkbox = container.querySelector('.MuiDataGrid-row[data-id="123456"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    await user.click(checkbox)
    expect(await screen.findByText(/1 dataset selected from 1 study/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(applyForAccess).toHaveBeenCalledWith([123456], expect.any(Function))
  })

  it('does not allow open or externally managed datasets to be selected', async () => {
    const { container } = mountComponent()
    await screen.findByText(datasets[0].datasetName)

    const externalCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123457"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    const openCheckbox = container.querySelector('.MuiDataGrid-row[data-id="123458"] .MuiDataGrid-checkboxInput input') as HTMLInputElement
    expect(externalCheckbox).toBeDisabled()
    expect(openCheckbox).toBeDisabled()
  })

  it('allows navigation back to datalibrary', async () => {
    mountComponent()
    await screen.findByText(datasets[0].datasetName)
    expect(document.getElementById('link_datalibrary')).toHaveAttribute('href', '/datalibrary')
  })

  it('shows the grid empty state and an error instead of remaining in loading state when loading fails', async () => {
    vi.mocked(DataSet.searchDatasetIndex).mockRejectedValueOnce(new Error('search failed'))
    mountComponent()

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load datasets: search failed')
    expect(screen.getByText('No datasets found matching your criteria')).toBeInTheDocument()
    expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument()
  })
})
