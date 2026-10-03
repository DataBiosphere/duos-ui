import { describe, expect, it } from 'vitest'
import { bucketStartsInRange, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'

describe('formatBucketStart', () => {
  const julyFirstUtc = Date.parse('2026-07-01T00:00:00Z')

  it.each([
    ['quarter', '2026 Q3'],
    ['month', 'Jul 2026'],
    ['week', 'Week of Jul 1, 2026'],
    ['day', 'Jul 1, 2026'],
  ] as const)('labels a %s bucket by its UTC start', (bucket, label) => {
    expect(formatBucketStart(julyFirstUtc, bucket)).toBe(label)
  })
})

describe('bucketStartsInRange', () => {
  const utc = (date: string) => Date.parse(`${date}T00:00:00Z`)

  it('lists every quarter the range touches, including ones with no DARs', () => {
    expect(bucketStartsInRange({ from: '2024-11-15', to: '2025-07-02', bucket: 'quarter' })).toEqual([
      utc('2024-10-01'), utc('2025-01-01'), utc('2025-04-01'), utc('2025-07-01'),
    ])
  })

  it('starts weeks on Monday, as Postgres does', () => {
    // 2026-09-06 is a Sunday.
    expect(bucketStartsInRange({ from: '2026-09-06', to: '2026-09-14', bucket: 'week' })).toEqual([
      utc('2026-08-31'), utc('2026-09-07'), utc('2026-09-14'),
    ])
  })

  it('lists months and days inclusively', () => {
    expect(bucketStartsInRange({ from: '2026-01-31', to: '2026-03-01', bucket: 'month' })).toEqual([
      utc('2026-01-01'), utc('2026-02-01'), utc('2026-03-01'),
    ])
    expect(bucketStartsInRange({ from: '2026-02-27', to: '2026-03-01', bucket: 'day' })).toEqual([
      utc('2026-02-27'), utc('2026-02-28'), utc('2026-03-01'),
    ])
  })
})
