import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { defaultRange, isChartable, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'

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

describe('isChartable', () => {
  it.each([
    ['2024-01-01', '2026-09-26', 'day', true],
    ['2024-01-01', '2026-09-27', 'day', false],
    ['2007-01-01', '2026-02-23', 'week', true],
    ['2007-01-01', '2026-02-24', 'week', false],
    ['1950-01-01', '2026-08-02', 'month', true],
    ['1950-01-01', '2026-08-03', 'month', false],
    ['1900-01-01', '2146-03-02', 'quarter', true],
    ['1900-01-01', '2146-03-03', 'quarter', false],
    ['2026-03-01', '2026-03-01', 'day', true],
  ] as const)('%s to %s by %s is %s', (from, to, bucket, expected) => {
    expect(isChartable({ from, to, bucket })).toBe(expected)
  })
})
