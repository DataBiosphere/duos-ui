import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { DarDatasetTable } from 'src/components/dar_dataset_table/DarDatasetTable'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn().mockReturnValue({ roles: [] }),
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Match', () => ({
  Match: {
    findMatchBatch: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndex: vi.fn().mockResolvedValue([{
      datasetId: 2352,
      name: 'Group 5',
      datasetName: 'Group 5',
      createDate: 'Feb 13, 2024',
      createUserId: 5147,
      updateDate: 1707858294844,
      updateUserId: 5146,
      alias: 850,
      datasetIdentifier: 'DUOS-000850',
      dataUse: {
        primary: [{
          code: 'GRU',
          description: 'General Research Use',
        }],
        secondary: [{
          code: 'NPU',
          description: 'Non-Profit Use',
        }],
      },
      dacId: 8,
    }]),
  },
}))

const darCollection = {
  darCollectionId: 211,
  darCode: 'DAR-259',
  createDate: 1730825497654,
  createUserId: 3351,
  dars: {
    '011467b7-5544-499f-9210-3c2035810639': {
      id: 1764,
      referenceId: '011467b7-5544-499f-9210-3c2035810639',
      collectionId: 211,
      data: {
        referenceId: '011467b7-5544-499f-9210-3c2035810639',
        datasetIds: [2352],
      },
      draft: false,
      userId: 3351,
      datasetIds: [2352],
      elections: {},
    },
  },
  datasets: [
    {
      datasetId: 2352,
      name: 'Group 5',
      datasetName: 'Group 5',
      createDate: 'Feb 13, 2024',
      createUserId: 5147,
      updateDate: 1707858294844,
      updateUserId: 5146,
      alias: 850,
      datasetIdentifier: 'DUOS-000850',
      dataUse: {
        generalUse: true,
        nonProfitUse: true,
      },
      dacId: 8,
    },
  ],
}

describe('DarDatasetTable - Tests', function () {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a single row of the data', async function () {
    await act(async () => {
      render(
        <DarDatasetTable
          summary={darCollection}
          collection={darCollection}
          isLoading={false}
          isUnfilteredView={true}
        />,
      )
    })

    // There should be columns for: data use group; # of datasets; and datasets
    const columnHeaders = document.querySelectorAll('.column-header')
    expect(columnHeaders).toHaveLength(3)

    // The data use on the requested dataset in darCollection is:
    // "dataUse": { "generalUse": true, "nonProfitUse": true }
    // So we need to ensure those codes are displayed
    expect(document.querySelector('.row-data-0').textContent).toContain('GRU')
    expect(document.querySelector('.row-data-0').textContent).toContain('NPU')

    // Ensure that the dataset identifier is displayed
    expect(document.querySelector('.row-data-0').textContent).toContain(darCollection.datasets[0].datasetIdentifier)
  })
})
