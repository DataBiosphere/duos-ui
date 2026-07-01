import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SelectableDatasets, { SelectableDatasetsProps } from 'src/pages/dar_application/SelectableDatasets'
import type { DAAObject, Dataset, DuosUser } from 'src/types/model'
import type { DatasetDaaSnapshot } from 'src/libs/ajax/DAR'

vi.mock('react-tooltip', () => ({
  Tooltip: () => null,
}))

vi.mock('@mui/icons-material/Delete', () => ({
  default: (props: { style?: React.CSSProperties }) => React.createElement('span', { 'data-testid': 'DeleteIcon', 'style': props.style }),
}))

vi.mock('@mui/icons-material/RestoreFromTrash', () => ({
  default: (props: { style?: React.CSSProperties }) => React.createElement('span', { 'data-testid': 'RestoreFromTrashIcon', 'style': props.style }),
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

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaas: vi.fn(),
    getDaaFileById: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: {
    getDatasetDaaSnapshots: vi.fn(),
  },
}))

import { DAA } from 'src/libs/ajax/DAA'
import { DAR } from 'src/libs/ajax/DAR'

const makeDataset = ({ datasetId, dacId }: { datasetId: number, dacId: number }): Dataset => ({
  name: 'Some Dataset',
  datasetName: 'Some Dataset',
  datasetId,
  createUserId: 1,
  createUser: {} as DuosUser,
  createDate: new Date('2026-05-01'),
  dacId,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: {} as Dataset['study'],
  alias: datasetId,
  datasetIdentifier: `DUOS-${datasetId}`,
  dataUse: {},
})

const datasets: Dataset[] = [
  makeDataset({ datasetId: 123456, dacId: 1 }),
  makeDataset({ datasetId: 234567, dacId: 2 }),
  makeDataset({ datasetId: 345678, dacId: 3 }),
  makeDataset({ datasetId: 456789, dacId: 4 }),
]

const makeDaa = ({ daaId, dacId, fileName }: { daaId: number, dacId: number, fileName: string }): DAAObject => ({
  daaId,
  createUserId: 1,
  createDate: new Date().toISOString(),
  updateUserId: 1,
  updateDate: new Date().toISOString(),
  initialDacId: dacId,
  file: { fileStorageObjectId: 1, entityId: 'entity-1', fileName, category: 'irbCollaborationLetter', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
  dacs: [{ dacId }],
})

const currentDaa = makeDaa({ daaId: 101, dacId: 1, fileName: 'mapped-daa-101.pdf' })

const summaryId = (id: number) => `#DUOS-${id}_summary`
const summaryText = (container: HTMLElement, id: number) => container.querySelector(summaryId(id))?.textContent

const renderSelectableDatasets = async (props: Partial<SelectableDatasetsProps> = {}) => {
  let container: HTMLElement
  await act(async () => {
    ({ container } = render(
      <SelectableDatasets
        datasets={datasets}
        setSelectedDatasets={vi.fn()}
        disabled={false}
        referenceId="ref-1"
        {...props}
      />,
    ))
  })
  return container!
}

const click = async (element: Element | null) => {
  await act(async () => {
    fireEvent.click(element!)
  })
}

const clickSummary = (container: HTMLElement, id: number) => click(container.querySelector(summaryId(id)))

const markForRemoval = async (container: HTMLElement, ids: number[]) => {
  for (const id of ids) {
    await clickSummary(container, id)
  }
}

describe('SelectableDatasets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('not read-only', () => {
    it('shows the DAA file name link for rows with a matching DAC and hides it otherwise', async () => {
      vi.mocked(DAA.getDaas).mockResolvedValue([
        makeDaa({ daaId: 101, dacId: 1, fileName: 'daa-101.pdf' }),
        makeDaa({ daaId: 303, dacId: 3, fileName: 'daa-303.pdf' }),
      ])

      const container = await renderSelectableDatasets()

      expect(summaryText(container, 123456)).toContain('daa-101.pdf')
      expect(summaryText(container, 345678)).toContain('daa-303.pdf')
      expect(summaryText(container, 234567)).not.toContain('daa')
      expect(summaryText(container, 456789)).not.toContain('daa')
    })

    it('does not mark a dataset for removal when its download link is clicked', async () => {
      vi.mocked(DAA.getDaas).mockResolvedValue([currentDaa])
      await renderSelectableDatasets()

      await click(screen.getByRole('button', { name: /mapped-daa-101\.pdf/i }))

      expect(DAA.getDaaFileById).toHaveBeenCalledWith(101, 'mapped-daa-101.pdf')
      expect(document.getElementById('restore_dataset_123456')).toBeNull()
    })

    it('marks 2 datasets for removal', async () => {
      vi.mocked(DAA.getDaas).mockResolvedValue([])
      const container = await renderSelectableDatasets()

      await markForRemoval(container, [123456, 345678])

      expect(document.getElementById('restore_dataset_123456')).not.toBeNull()
      expect(document.getElementById('restore_dataset_345678')).not.toBeNull()
    })

    it('unmarks one of the previously marked for removal datasets', async () => {
      vi.mocked(DAA.getDaas).mockResolvedValue([])
      const container = await renderSelectableDatasets()

      await markForRemoval(container, [123456, 345678])
      await click(document.getElementById('restore_dataset_345678'))

      expect(document.getElementById('remove_dataset_345678')).not.toBeNull()
    })

    it('cannot delete the last dataset', async () => {
      vi.mocked(DAA.getDaas).mockResolvedValue([])
      const container = await renderSelectableDatasets()

      await markForRemoval(container, [123456, 345678])
      await click(document.getElementById('restore_dataset_345678'))
      expect(document.getElementById('remove_dataset_345678')).not.toBeNull()

      await click(document.getElementById('remove_dataset_345678'))
      await clickSummary(container, 234567)

      expect(document.getElementById('restore_dataset_123456')).not.toBeNull()
      expect(document.getElementById('restore_dataset_345678')).not.toBeNull()
      expect(document.getElementById('restore_dataset_234567')).not.toBeNull()
      expect(document.getElementById('remove_dataset_456789')).not.toBeNull()

      const lastDeleteIcon = container.querySelector(`${summaryId(456789)} [data-testid="DeleteIcon"]`)
      expect(lastDeleteIcon).toHaveStyle({ opacity: 0.5 })
    })
  })

  describe('read-only', () => {
    beforeEach(() => {
      vi.mocked(DAA.getDaas).mockResolvedValue([currentDaa])
    })

    it('uses the historical snapshot mapping for DAA links, preferring the current DAA file name', async () => {
      vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([
        { datasetId: 123456, daaId: 101, daaFileName: 'historical-daa-101.pdf' },
      ])

      const container = await renderSelectableDatasets({ disabled: true })

      expect(summaryText(container, 123456)).toContain('mapped-daa-101.pdf')
      expect(summaryText(container, 234567)).not.toContain('historical-daa-101.pdf')
    })

    it('uses the historical snapshot mapping by datasetIdentifier when datasetId is absent', async () => {
      vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([
        { datasetIdentifier: 'DUOS-123456', daaId: 101, daaFileName: 'identifier-mapped-daa.pdf' },
      ])

      const container = await renderSelectableDatasets({ disabled: true })

      expect(summaryText(container, 123456)).toContain('mapped-daa-101.pdf')
    })

    it('uses the historical snapshot mapping when snapshots are returned as a datasetId-keyed object map', async () => {
      // The snapshot endpoint can return a datasetId-keyed map instead of an array
      vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue({
        123456: { daaId: 101, capturedAt: 1778006370183 },
      } as unknown as DatasetDaaSnapshot[])

      const container = await renderSelectableDatasets({ disabled: true })

      expect(summaryText(container, 123456)).toContain('mapped-daa-101.pdf')
    })

    it('shows fallback text when the snapshot lookup returns 404', async () => {
      vi.mocked(DAR.getDatasetDaaSnapshots).mockRejectedValue({ response: { status: 404 } })

      const container = await renderSelectableDatasets({ disabled: true })

      const message = 'The DUOS Library Card Agreements in effect at the time this request was made govern the use of this data.'
      expect(summaryText(container, 123456)).toContain(message)
      expect(summaryText(container, 234567)).toContain(message)
    })

    it('cannot click on any dataset', async () => {
      vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([])

      const container = await renderSelectableDatasets({ disabled: true })

      for (const ds of datasets) {
        expect(container.querySelector<HTMLElement>(summaryId(ds.datasetId))!.style.cursor).not.toBe('pointer')
      }

      for (const ds of datasets) {
        await clickSummary(container, ds.datasetId)
      }

      for (const ds of datasets) {
        expect(document.getElementById(`restore_dataset_${ds.datasetId}`)).toBeNull()
        expect(container.querySelector(`${summaryId(ds.datasetId)} [data-testid="DeleteIcon"]`)).toBeNull()
      }
    })
  })
})
