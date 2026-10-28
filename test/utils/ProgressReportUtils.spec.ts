import { describe, it, expect } from 'vitest'
import { progressReportNumber, requestTypeLabel } from 'src/utils/ProgressReportUtils'

// ids are deliberately out of order, as they come from the collection's map
const collectionDars = [{ id: 30 }, { id: 10 }, { id: 20 }]

describe('progressReportNumber', () => {
  it('numbers the initial DAR 0 and each later DAR by its place in id order', () => {
    expect(progressReportNumber({ id: 10 }, collectionDars)).toBe(0)
    expect(progressReportNumber({ id: 20 }, collectionDars)).toBe(1)
    expect(progressReportNumber({ id: 30 }, collectionDars)).toBe(2)
  })
})

describe('requestTypeLabel', () => {
  it('labels a progress report with its number', () => {
    expect(requestTypeLabel({ id: 30 }, collectionDars)).toBe('Progress Report 2')
  })

  it('labels the earliest DAR as the initial DAR', () => {
    expect(requestTypeLabel({ id: 10 }, collectionDars)).toBe('Initial DAR')
  })
})
