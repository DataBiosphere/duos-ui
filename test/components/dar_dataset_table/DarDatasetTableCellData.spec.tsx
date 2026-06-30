import { describe, it, expect } from 'vitest'
import {
  dataUseGroupCellData,
  numberOfDatasetsCellData,
  datasetsCellData,
} from 'src/components/dar_dataset_table/DarDatasetTableCellData'
import { Dataset } from 'src/types/model'

describe('DarDatasetTableCellData', () => {
  describe('dataUseGroupCellData', () => {
    it('returns the label as display data', () => {
      const result = dataUseGroupCellData({ dataUseGroup: 'bucket-1', label: 'GRU' })
      expect(result.data).toBe('GRU')
      expect(result.id).toBe('bucket-1')
      expect(result.label).toBe('GRU')
    })

    it('uses the default label when none is provided', () => {
      const result = dataUseGroupCellData({ dataUseGroup: 'bucket-1' })
      expect(result.label).toBe('data-use')
      expect(result.data).toBe('data-use')
    })

    it('applies bold font weight styling', () => {
      const result = dataUseGroupCellData({ dataUseGroup: 'bucket-1' })
      expect(result.style?.fontWeight).toBe('bold')
    })
  })

  describe('numberOfDatasetsCellData', () => {
    it('returns the count of datasets as a string', () => {
      const datasets = [
        { datasetIdentifier: 'DUOS-000001' },
        { datasetIdentifier: 'DUOS-000002' },
      ] as Dataset[]
      const result = numberOfDatasetsCellData({ dataUseGroup: 'bucket-1', datasets })
      expect(result.data).toBe('2')
    })

    it('returns zero for an empty datasets array', () => {
      const result = numberOfDatasetsCellData({ dataUseGroup: 'bucket-1', datasets: [] })
      expect(result.data).toBe('0')
    })

    it('returns zero when datasets is not provided', () => {
      const result = numberOfDatasetsCellData({ dataUseGroup: 'bucket-1' })
      expect(result.data).toBe('0')
    })
  })

  describe('datasetsCellData', () => {
    it('joins dataset identifiers with a comma separator', () => {
      const datasets = [
        { datasetIdentifier: 'DUOS-000001' },
        { datasetIdentifier: 'DUOS-000002' },
      ] as Dataset[]
      const result = datasetsCellData({ dataUseGroup: 'bucket-1', datasets })
      expect(result.data).toBe('DUOS-000001, DUOS-000002')
    })

    it('returns an empty string for an empty datasets array', () => {
      const result = datasetsCellData({ dataUseGroup: 'bucket-1', datasets: [] })
      expect(result.data).toBe('')
    })

    it('returns an empty string when datasets is not provided', () => {
      const result = datasetsCellData({ dataUseGroup: 'bucket-1' })
      expect(result.data).toBe('')
    })

    it('uses the correct id from dataUseGroup', () => {
      const result = datasetsCellData({ dataUseGroup: 'my-bucket-key' })
      expect(result.id).toBe('my-bucket-key')
    })
  })
})
