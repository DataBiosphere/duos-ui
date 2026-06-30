import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { DarDatasetTable } from 'src/components/dar_dataset_table/DarDatasetTable'
import { DarCollection } from 'src/types/model'

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
  id: 211,
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
} as unknown as DarCollection

describe('DarDatasetTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders column headers for data use group, dataset count, and datasets', async () => {
    await act(async () => {
      render(
        <DarDatasetTable
          collection={darCollection}
          isLoading={false}
          isUnfilteredView={true}
        />,
      )
    })

    const columnHeaders = document.querySelectorAll('.column-header')
    expect(columnHeaders).toHaveLength(3)
  })

  it('displays data use codes derived from dataset dataUse', async () => {
    await act(async () => {
      render(
        <DarDatasetTable
          collection={darCollection}
          isLoading={false}
          isUnfilteredView={true}
        />,
      )
    })

    expect(document.querySelector('.row-data-0')?.textContent).toContain('GRU')
    expect(document.querySelector('.row-data-0')?.textContent).toContain('NPU')
  })

  it('displays the dataset identifier in the datasets column', async () => {
    await act(async () => {
      render(
        <DarDatasetTable
          collection={darCollection}
          isLoading={false}
          isUnfilteredView={true}
        />,
      )
    })

    expect(document.querySelector('.row-data-0')?.textContent).toContain('DUOS-000850')
  })
})
