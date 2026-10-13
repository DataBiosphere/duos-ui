import { describe, it, expect } from 'vitest'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { LibraryRow } from 'src/components/data_library/assets'
import { DatasetTerm } from 'src/types/model'

const dataset = (overrides: Partial<DatasetTerm>) => ({
  datasetId: 1,
  datasetIdentifier: 'DUOS-000001',
  datasetName: 'Dataset One',
  accessManagement: 'controlled',
  dacApproval: true,
  ...overrides,
} as unknown as LibraryRow)

describe('datasetAsset — isRowSelectable', () => {
  it('selects a controlled dataset the DAC has approved', () => {
    expect(datasetAsset.isRowSelectable(dataset({}))).toBe(true)
  })

  /**
   * The library never lists a controlled dataset awaiting DAC approval, but the study page and
   * the submissions view ask for all of them. Without this the study page pre-checked a pending
   * dataset on load, so one click put it into a request the same user could not have made from
   * the library at all.
   */
  it('does not select a controlled dataset still awaiting DAC approval', () => {
    expect(datasetAsset.isRowSelectable(dataset({ dacApproval: false }))).toBe(false)
    expect(datasetAsset.isRowSelectable(dataset({ dacApproval: undefined }))).toBe(false)
  })

  it('does not select open or external datasets, which need no request', () => {
    expect(datasetAsset.isRowSelectable(dataset({ accessManagement: 'open' }))).toBe(false)
    expect(datasetAsset.isRowSelectable(dataset({ accessManagement: 'external' }))).toBe(false)
  })
})
