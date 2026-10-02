import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { defaultRange, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'

describe('defaultRange', () => {
  it('starts two years back on the first day of that quarter and groups by quarter', () => {
    expect(defaultRange(dayjs('2026-08-14'))).toEqual({
      from: '2024-07-01',
      to: '2026-08-14',
      bucket: 'quarter',
    })
  })

  it('keeps a start already on a quarter boundary', () => {
    expect(defaultRange(dayjs('2026-01-01')).from).toBe('2024-01-01')
  })
})

describe('isValidRange', () => {
  it.each([
    ['2026-01-01', '2026-03-31', true],
    ['2026-03-31', '2026-03-31', true],
    ['2026-04-01', '2026-03-31', false],
    ['', '2026-03-31', false],
    ['2026-01-01', '2026-3-31', false],
    ['0002-01-01', '2026-03-31', false],
    ['1900-01-01', '2026-03-31', true],
    ['2026-02-31', '2026-03-31', false],
  ])('from %s to %s is %s', (from, to, expected) => {
    expect(isValidRange(from, to)).toBe(expected)
  })
})
