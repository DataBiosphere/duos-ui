import { describe, it, expect } from 'vitest'
import { selectedStudyIds, studyIdByDatasetId } from 'src/components/data_library/selectionStudyMap'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { studyAsset } from 'src/components/data_library/assets/studyAsset'
import { LibraryRow } from 'src/components/data_library/assets/definition'

const datasetRow = (datasetId: number, studyId: number) =>
  ({ datasetId, study: { studyId } } as unknown as LibraryRow)

const studyRow = (studyId: number, datasetIds: number[]) =>
  ({ studyId, datasetIds } as unknown as LibraryRow)

describe('studyIdByDatasetId', () => {
  it('maps a dataset row to its study', () => {
    const mapping = studyIdByDatasetId(datasetAsset, [datasetRow(101, 7), datasetRow(102, 8)])
    expect(mapping.get(101)).toBe(7)
    expect(mapping.get(102)).toBe(8)
  })

  it('maps every dataset a study row covers', () => {
    const mapping = studyIdByDatasetId(studyAsset, [studyRow(7, [101, 102])])
    expect(Array.from(mapping.entries())).toEqual([[101, 7], [102, 7]])
  })
})

describe('selectedStudyIds', () => {
  it('counts a study once however many of its datasets are selected', () => {
    const mapping = new Map([[101, 7], [102, 7], [201, 8]])
    expect(selectedStudyIds(mapping, [101, 102, 201])).toEqual([7, 8])
  })

  // The case the page-scoped count got wrong: one study's datasets split across two pages.
  it('keeps a study while any of its datasets stay selected', () => {
    const mapping = new Map([[101, 7], [102, 7]])
    expect(selectedStudyIds(mapping, [102])).toEqual([7])
  })

  it('drops a study once its last dataset is deselected', () => {
    const mapping = new Map([[101, 7], [102, 7]])
    expect(selectedStudyIds(mapping, [])).toEqual([])
  })

  it('ignores datasets it has no mapping for', () => {
    expect(selectedStudyIds(new Map([[101, 7]]), [101, 999])).toEqual([7])
  })
})
