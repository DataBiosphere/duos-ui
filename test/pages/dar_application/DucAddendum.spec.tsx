import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DucAddendum from 'src/pages/dar_application/DucAddendum'
import type { DatasetTerm, Dataset, DuosUser, StudyTerm, UserTerm } from 'src/types/model'

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndex: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Notifications: {
      ...original.Notifications,
      showError: vi.fn(),
    },
  }
})

import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'

const makeUserTerm = (): UserTerm => ({
  userId: 0,
  displayName: 'user',
  institution: {} as UserTerm['institution'],
})

const makeStudyTerm = (): StudyTerm => ({
  description: 'description',
  studyName: 'study',
  studyId: 0,
  phsId: 'phs000000',
  phenotype: 'phenotype',
  species: 'species',
  piName: 'pi',
  dataSubmitterEmail: 'submitter@example.test',
  dataSubmitterId: 0,
  dataCustodianEmail: [],
  publicVisibility: true,
  dataTypes: [],
})

const makeDatasetTerm = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
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

const makeDataset = ({ datasetId, datasetIdentifier, datasetName, dacId }: { datasetId: number, datasetIdentifier: string, datasetName: string, dacId: number }): Dataset => ({
  name: datasetName,
  datasetName,
  datasetId,
  createUserId: 1,
  createUser: {} as DuosUser,
  createDate: new Date('2026-01-01'),
  dacId,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: {} as Dataset['study'],
  alias: datasetId,
  datasetIdentifier,
  dataUse: {},
})

const mockDatasets: Dataset[] = [
  makeDataset({ datasetId: 1, datasetIdentifier: 'DUOS-1001', datasetName: 'Test Dataset 1', dacId: 1 }),
  makeDataset({ datasetId: 2, datasetIdentifier: 'DUOS-1002', datasetName: 'Test Dataset 2', dacId: 2 }),
]

const renderDucAddendum = async (datasets: Dataset[]) => {
  await act(async () => {
    render(
      <DucAddendum
        datasets={datasets}
        isLoading={false}
        save={vi.fn()}
        doSubmit={vi.fn()}
      />,
    )
  })
}

describe('DucAddendum', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the addendum table with selected datasets', async () => {
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([
      makeDatasetTerm({ datasetId: 1, dacId: 1, dac: { dacId: 1, dacName: 'DAC 0001', dacEmail: 'foo@bar.com' } }),
      makeDatasetTerm({ datasetId: 2, dacId: 2, dac: { dacId: 2, dacName: 'DAC 0002', dacEmail: 'bar@foo.com' } }),
    ])

    await renderDucAddendum(mockDatasets)

    expect(screen.getByText('Addendum')).toBeInTheDocument()
    expect(screen.getByText(/Please review the datasets you requested/)).toBeInTheDocument()

    expect(screen.getByText('Dataset ID')).toBeInTheDocument()
    expect(screen.getByText('Dataset Name')).toBeInTheDocument()
    expect(screen.getByText('DAC')).toBeInTheDocument()
    expect(screen.getByText('Acknowledgment')).toBeInTheDocument()

    expect(screen.getByText('DUOS-1001')).toBeInTheDocument()
    expect(screen.getByText('Test Dataset 1')).toBeInTheDocument()
    expect(screen.getByText('DAC 0001')).toBeInTheDocument()

    expect(screen.getByText('DUOS-1002')).toBeInTheDocument()
    expect(screen.getByText('Test Dataset 2')).toBeInTheDocument()
    expect(screen.getByText('DAC 0002')).toBeInTheDocument()
  })

  it('shows an error when relevant DAC information cannot be loaded', async () => {
    vi.mocked(DataSet.searchDatasetIndex).mockRejectedValue(new Error('DAC information could not be found'))

    await renderDucAddendum([mockDatasets[0]])

    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error loading Dataset Term information for datasets: DAC information could not be found',
    })
  })

  it('shows "N/A" when the DAC information is missing entirely', async () => {
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([
      makeDatasetTerm({ datasetId: 1, dac: undefined }),
    ])

    await renderDucAddendum([mockDatasets[0]])

    expect(screen.getByText('DUOS-1001')).toBeInTheDocument()
    expect(screen.getByText('Test Dataset 1')).toBeInTheDocument()
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })
})
