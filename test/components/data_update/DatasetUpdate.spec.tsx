import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { DatasetUpdate } from 'src/components/data_update/DatasetUpdate'
import { Dataset, DacObject } from 'src/types/model'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: {
    get: vi.fn(),
    list: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: {
    getAutoCompleteOT: vi.fn(),
    searchOntologyIdList: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    updateDatasetV3: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    },
  }
})

import { DAC } from 'src/libs/ajax/DAC'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'

const mockDac: DacObject = { dacId: 1, name: 'Test DAC' }
const mockDacs: DacObject[] = [mockDac, { dacId: 2, name: 'Other DAC' }]

const mockDataset = {
  datasetId: 42,
  datasetName: 'My Study Dataset',
  dacId: 1,
  dataUse: { generalUse: true },
  properties: [
    { propertyName: 'Dataset Name', propertyValue: 'My Study Dataset' },
    { propertyName: 'Description', propertyValue: 'A test dataset' },
    { propertyName: 'Data Depositor', propertyValue: 'Jane Doe' },
    { propertyName: 'Principal Investigator(PI)', propertyValue: 'Dr. Smith' },
  ],
  study: { piName: 'Dr. Smith' },
} as unknown as Dataset

const renderComponent = async (): Promise<ReturnType<typeof render>> => {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<DatasetUpdate dataset={mockDataset} />)
  })
  return result!
}

describe('DatasetUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DAC.get).mockResolvedValue(mockDac)
    vi.mocked(DAC.list).mockResolvedValue(mockDacs)
  })

  it('renders the three main sections', async () => {
    await renderComponent()
    expect(screen.getByText('1. Dataset Information')).toBeTruthy()
    expect(screen.getByText('2. Data Use Terms')).toBeTruthy()
    expect(screen.getByText('3. NIH Certification')).toBeTruthy()
  })

  it('renders all editable dataset information fields', async () => {
    await renderComponent()
    expect(screen.getByText(/Dataset Name/)).toBeTruthy()
    expect(screen.getByText(/Dataset Description/)).toBeTruthy()
    expect(screen.getByText(/Data Custodian/)).toBeTruthy()
    expect(screen.getByText(/Principal Investigator \(PI\)/)).toBeTruthy()
    expect(screen.getByText(/Dataset Repository URL/)).toBeTruthy()
    expect(screen.getByText(/Data Type/)).toBeTruthy()
    expect(screen.getByText(/Species/)).toBeTruthy()
    expect(screen.getByText(/# of Participants/)).toBeTruthy()
  })

  it('renders the submit button', async () => {
    await renderComponent()
    expect(screen.getByRole('button', { name: /submit/i })).toBeTruthy()
  })

  it('calls DAC.get and DAC.list on mount to prefill form', async () => {
    await renderComponent()
    expect(vi.mocked(DAC.get)).toHaveBeenCalledWith(mockDataset.dacId)
    expect(vi.mocked(DAC.list)).toHaveBeenCalled()
  })

  it('calls updateDatasetV3 with dataset id when submit is clicked', async () => {
    vi.mocked(DataSet.updateDatasetV3).mockResolvedValue({} as Dataset)
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    })

    expect(vi.mocked(DataSet.updateDatasetV3)).toHaveBeenCalledWith(
      mockDataset.datasetId,
      expect.any(FormData),
    )
  })

  it('shows success notification and navigates after successful submit', async () => {
    vi.mocked(DataSet.updateDatasetV3).mockResolvedValue({} as Dataset)
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    })

    expect(vi.mocked(Notifications.showSuccess)).toHaveBeenCalledWith({
      text: 'Update submitted successfully!',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/datalibrary')
  })

  it('shows error notification when submit fails', async () => {
    vi.mocked(DataSet.updateDatasetV3).mockRejectedValue(new Error('Network error'))
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    })

    expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith({
      text: 'Some errors occurred, the dataset was not updated.',
    })
  })

  it('renders readonly data use term fields', async () => {
    await renderComponent()
    expect(screen.getByText('Primary Data Use Terms*')).toBeTruthy()
    expect(screen.getByText('Secondary Data Use Terms')).toBeTruthy()
    expect(screen.getByText('NIH Institutional Certification')).toBeTruthy()
  })

  it('normalizes diseaseRestrictions from dataUse', async () => {
    const { DAR } = await import('src/libs/ajax/DAR')
    vi.mocked(DAR.searchOntologyIdList).mockResolvedValue([
      { id: 'HP:001', label: 'Diabetes', definition: '', synonyms: [] },
    ])

    const datasetWithDiseases = {
      ...mockDataset,
      dataUse: { diseaseRestrictions: ['HP:001'] },
    } as unknown as Dataset

    await act(async () => {
      render(<DatasetUpdate dataset={datasetWithDiseases} />)
    })

    expect(vi.mocked(DAR.searchOntologyIdList)).toHaveBeenCalledWith(['HP:001'])
  })
})
