import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { DatasetUpdateForm } from 'src/pages/DatasetUpdateForm'
import { Dataset } from 'src/types/model'

const mockDataset = { datasetId: 7, datasetName: 'Test DS', dacId: 1, dataUse: {}, properties: [] } as unknown as Dataset

vi.mock('react-router', () => ({
  useParams: () => ({ datasetId: '7' }),
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { getDataSetsByDatasetId: vi.fn() },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return { ...actual, Notifications: { showError: vi.fn(), showSuccess: vi.fn() } }
})

vi.mock('src/components/data_update/DatasetUpdate', () => ({
  default: () => <div data-testid="dataset-update" />,
  DatasetUpdate: () => <div data-testid="dataset-update" />,
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) => (
    <div data-testid="table-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'

describe('DatasetUpdateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page with header and form after successful load', async () => {
    vi.mocked(DataSet.getDataSetsByDatasetId).mockResolvedValue(mockDataset)

    await act(async () => {
      render(<DatasetUpdateForm />)
    })

    expect(screen.getByTestId('table-header')).toBeTruthy()
    expect(screen.getByText('Dataset Update Form')).toBeTruthy()
    expect(screen.getByText('This is an easy way to update a dataset in DUOS!')).toBeTruthy()
    expect(screen.getByTestId('dataset-update')).toBeTruthy()
  })

  it('calls getDataSetsByDatasetId with the numeric datasetId from route params', async () => {
    vi.mocked(DataSet.getDataSetsByDatasetId).mockResolvedValue(mockDataset)

    await act(async () => {
      render(<DatasetUpdateForm />)
    })

    expect(vi.mocked(DataSet.getDataSetsByDatasetId)).toHaveBeenCalledWith(7)
  })

  it('does not render the form when dataset fetch fails', async () => {
    vi.mocked(DataSet.getDataSetsByDatasetId).mockRejectedValue(new Error('Not found'))

    await act(async () => {
      render(<DatasetUpdateForm />)
    })

    expect(screen.queryByTestId('dataset-update')).toBeNull()
  })

  it('shows an error notification when dataset fetch fails', async () => {
    vi.mocked(DataSet.getDataSetsByDatasetId).mockRejectedValue(new Error('Not found'))

    await act(async () => {
      render(<DatasetUpdateForm />)
    })

    expect(vi.mocked(Notifications.showError)).toHaveBeenCalledWith({ text: 'Failed to load dataset' })
  })
})
