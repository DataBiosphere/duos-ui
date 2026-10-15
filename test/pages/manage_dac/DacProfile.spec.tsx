import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import DacProfile from 'src/pages/manage_dac/DacProfile'
import { DAC } from 'src/libs/ajax/DAC'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'
import type { DacObject, Dataset, DatasetTerm, DataUseSummary, DuosUser, Study } from 'src/types/model'

vi.mock('src/libs/ajax/DAC')
vi.mock('src/libs/ajax/DataSet')
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
vi.mock('src/pages/manage_dac/EditDac', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="edit-dac-stub">
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
}))
vi.mock('src/components/dac_bot/DACBotComponent', () => ({
  DACBotComponent: () => <div data-testid="dac-bot-stub" />,
}))

const existingDac: DacObject = {
  dacId: 1,
  name: 'Test DAC',
  description: 'Test DAC description',
  email: 'test@example.org',
  chairpersons: [],
  members: [],
}

const makeStudy = (datasetId: number): Study => ({
  studyId: datasetId + 1000,
  name: `Study ${datasetId}`,
  description: 'Study description',
  dataTypes: [],
  piName: 'Test PI',
  publicVisibility: true,
  datasetIds: [datasetId],
  properties: [],
  createDate: '2026-05-01',
  createUserId: 1,
})

const makeDataset = ({
  datasetId,
  name,
  dacApproval,
}: {
  datasetId: number
  name: string
  dacApproval: boolean
}): Dataset => ({
  name,
  datasetId,
  createUserId: 1,
  createUser: {} as DuosUser,
  createDate: new Date('2026-05-01'),
  dacId: 1,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: makeStudy(datasetId),
  alias: datasetId,
  datasetIdentifier: `DUOS-${String(datasetId).padStart(6, '0')}`,
  dataUse: {},
  dacApproval,
})

const indexTerm = (datasetId: number, dataUse: DataUseSummary) => ({ datasetId, dataUse }) as DatasetTerm

const renderDacProfile = async (dacId: number | string = 1) => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[`/manage_dac/${dacId}`]}>
        <Routes>
          <Route path="/manage_dac/:dacId" element={<DacProfile />} />
          <Route path="/manage_dac" element={<div>Manage DAC</div>} />
        </Routes>
      </MemoryRouter>,
    )
  })
}

describe('DacProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([])
  })

  it('shows the DAC name after loading', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([])

    await renderDacProfile()

    expect(screen.getByText('Test DAC')).toBeTruthy()
  })

  it('shows an error notification when the DAC fails to load', async () => {
    vi.mocked(DAC.get).mockRejectedValue(new Error('Network error'))
    vi.mocked(DAC.datasets).mockRejectedValue(new Error('Network error'))

    await renderDacProfile()

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Failed to load DAC profile.' })
    })
  })

  it('shows only approved datasets', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset({ datasetId: 1, name: 'Approved Dataset', dacApproval: true }),
      makeDataset({ datasetId: 2, name: 'Unapproved Dataset', dacApproval: false }),
    ])

    await renderDacProfile()

    expect(screen.getByText('1 dataset')).toBeTruthy()
    expect(screen.queryByText('Unapproved Dataset')).toBeNull()
  })

  it('shows data use limitations from the search index, as the Data Library does', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset({ datasetId: 1, name: 'Approved Dataset', dacApproval: true }),
    ])
    vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue([
      indexTerm(1, {
        primary: [{ code: 'GRU', description: 'Use is permitted for any research purpose' }],
        secondary: [{ code: 'POP-F', description: 'Female population only' }, { code: 'MOR', description: 'Publication moratorium' }],
      }),
    ])

    await renderDacProfile()

    expect(await screen.findByText('GRU-MOR-POP-F')).toBeTruthy()
    expect(vi.mocked(DataSet.searchDatasetIndex)).toHaveBeenCalledWith(
      expect.objectContaining({ query: { terms: { dacId: [1] } } }),
      { signal: expect.any(AbortSignal) },
    )
  })

  it('still lists datasets when the search index fails', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset({ datasetId: 1, name: 'Approved Dataset', dacApproval: true }),
    ])
    vi.mocked(DataSet.searchDatasetIndex).mockRejectedValue(new Error('Index down'))

    await renderDacProfile()

    expect(await screen.findByText('Approved Dataset')).toBeTruthy()
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Failed to load data use limitations.' })
  })

  it('renders the profile while data use is still loading', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset({ datasetId: 1, name: 'Approved Dataset', dacApproval: true }),
    ])
    vi.mocked(DataSet.searchDatasetIndex).mockReturnValue(new Promise(() => {}))

    await renderDacProfile()

    expect(await screen.findByText('Approved Dataset')).toBeTruthy()
    expect(screen.getByTestId('edit-dac-stub')).toBeTruthy()
  })

  it('does not report a data use failure after the page is left', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([])
    let failIndex: (reason: Error) => void = () => {}
    vi.mocked(DataSet.searchDatasetIndex).mockReturnValue(new Promise((_resolve, reject) => {
      failIndex = reject
    }))

    let unmount: () => void = () => {}
    await act(async () => {
      ({ unmount } = render(
        <MemoryRouter initialEntries={['/manage_dac/1']}>
          <Routes>
            <Route path="/manage_dac/:dacId" element={<DacProfile />} />
          </Routes>
        </MemoryRouter>,
      ))
    })
    unmount()
    await act(async () => failIndex(new Error('aborted')))

    expect(Notifications.showError).not.toHaveBeenCalled()
  })

  it('shows "No datasets" message when there are no approved datasets', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([
      makeDataset({ datasetId: 2, name: 'Unapproved Dataset', dacApproval: false }),
    ])

    await renderDacProfile()

    const datasetsSection = screen.getByRole('region', { name: 'Datasets Managed by this DAC' })
    expect(datasetsSection.textContent).toContain('No datasets are associated with this DAC.')
  })

  it.each([
    'Rule Automation for DARs (RADAR)',
    'Datasets Managed by this DAC',
  ])('renders the %s section as its own card', async (title) => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([])

    await renderDacProfile()

    const section = screen.getByRole('region', { name: title })
    expect(section.contains(screen.getByRole('heading', { name: title }))).toBe(true)
  })

  it('does not show a spinner and makes no API calls for an invalid dacId', async () => {
    await renderDacProfile('abc')

    expect(screen.queryByAltText('spinner')).toBeNull()
    expect(DAC.get).not.toHaveBeenCalled()
    expect(DAC.datasets).not.toHaveBeenCalled()
  })

  it('links back to the manage DAC page', async () => {
    vi.mocked(DAC.get).mockResolvedValue(existingDac)
    vi.mocked(DAC.datasets).mockResolvedValue([])

    await renderDacProfile()

    const backLink = screen.getByLabelText('Back to Manage DAC')
    expect(backLink.tagName.toLowerCase()).toBe('a')
  })

  it('reloads DAC data when the edit form closes', async () => {
    const updatedDac: DacObject = { ...existingDac, name: 'Updated DAC Name' }
    vi.mocked(DAC.get)
      .mockResolvedValueOnce(existingDac)
      .mockResolvedValueOnce(updatedDac)
    vi.mocked(DAC.datasets).mockResolvedValue([])

    await renderDacProfile()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    })

    expect(await screen.findByText('Updated DAC Name')).toBeTruthy()
    expect(vi.mocked(DAC.get)).toHaveBeenCalledTimes(2)
  })
})
