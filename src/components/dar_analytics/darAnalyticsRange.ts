import dayjs, { Dayjs } from 'dayjs'
import { MetricsBucket } from 'src/types/darMetrics'

export interface DarAnalyticsRange {
  from: string
  to: string
  bucket: MetricsBucket
}

export const DATE_FORMAT = 'YYYY-MM-DD'

export const BUCKETS: { value: MetricsBucket, label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
]

/** The last two years to `today`, starting on a quarter so the first bucket is whole. */
export const defaultRange = (today: Dayjs): DarAnalyticsRange => {
  const start = today.subtract(2, 'year')
  const quarterStartMonth = Math.floor(start.month() / 3) * 3
  return {
    from: start.month(quarterStartMonth).startOf('month').format(DATE_FORMAT),
    to: today.format(DATE_FORMAT),
    bucket: 'quarter',
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Consent rejects years outside 1900 to 9999, and Day.js would roll 2026-02-31 into March.
const isValidDate = (date: string): boolean =>
  ISO_DATE.test(date) && dayjs(date).format(DATE_FORMAT) === date && Number(date.slice(0, 4)) >= 1900

export const isValidRange = (from: string, to: string): boolean =>
  isValidDate(from) && isValidDate(to) && !dayjs(to).isBefore(dayjs(from))
