import { describe, it, expect } from 'vitest'
import { nextProgressReportNumber, progressReportNumber, requestTypeLabel } from 'src/utils/ProgressReportUtils'

const original = (id: number) => ({ id, progressReport: false })
const report = (id: number) => ({ id, progressReport: true })

// ids are deliberately out of order, as they come from the collection's map
const collectionDars = [report(30), original(10), report(20)]

// A pre-2022 collection holds one original DAR per dataset, all without a parent
const siblingOriginals = [original(10), original(11), report(12), report(13)]

describe('progressReportNumber', () => {
  it('numbers each progress report by its place among the reports, in id order', () => {
    expect(progressReportNumber(report(20), collectionDars)).toBe(1)
    expect(progressReportNumber(report(30), collectionDars)).toBe(2)
  })

  it('does not count sibling originals as reports', () => {
    expect(progressReportNumber(report(12), siblingOriginals)).toBe(1)
    expect(progressReportNumber(report(13), siblingOriginals)).toBe(2)
  })

  it('gives an original DAR no number', () => {
    expect(progressReportNumber(original(11), siblingOriginals)).toBe(0)
  })
})

describe('nextProgressReportNumber', () => {
  it('counts only progress reports', () => {
    expect(nextProgressReportNumber(collectionDars)).toBe(3)
    expect(nextProgressReportNumber(siblingOriginals)).toBe(3)
  })
})

describe('requestTypeLabel', () => {
  it('labels a progress report with its number', () => {
    expect(requestTypeLabel(report(30), collectionDars)).toBe('Progress Report 2')
  })

  it('labels every original DAR as an initial DAR', () => {
    expect(requestTypeLabel(original(10), siblingOriginals)).toBe('Initial DAR')
    expect(requestTypeLabel(original(11), siblingOriginals)).toBe('Initial DAR')
  })
})
