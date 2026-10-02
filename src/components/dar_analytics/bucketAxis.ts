import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { MetricsBucket } from 'src/types/darMetrics'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'

dayjs.extend(utc)

// Postgres date_trunc semantics: weeks start on Monday, quarters in January, April, July and October.
const truncate = (date: Dayjs, bucket: MetricsBucket): Dayjs => {
  const day = date.startOf('day')
  switch (bucket) {
    case 'quarter':
      return day.month(Math.floor(day.month() / 3) * 3).startOf('month')
    case 'month':
      return day.startOf('month')
    case 'week':
      return day.subtract((day.day() + 6) % 7, 'day')
    default:
      return day
  }
}

const STEP: Record<MetricsBucket, [number, 'day' | 'month']> = {
  day: [1, 'day'],
  week: [7, 'day'],
  month: [1, 'month'],
  quarter: [3, 'month'],
}

/** Every bucket start in the range, since consent sends only the buckets that have rows. */
export const bucketStartsInRange = ({ from, to, bucket }: DarAnalyticsRange): number[] => {
  const end = dayjs.utc(to)
  const [amount, unit] = STEP[bucket]
  const starts: number[] = []
  for (let start = truncate(dayjs.utc(from), bucket); !start.isAfter(end); start = start.add(amount, unit)) {
    starts.push(start.valueOf())
  }
  return starts
}

// Consent's servers run in UTC, so a bucket starts at UTC midnight; read as local time it would fall in
// the previous bucket west of Greenwich.
export const formatBucketStart = (bucketStart: number, bucket: MetricsBucket): string => {
  const start = dayjs.utc(bucketStart)
  switch (bucket) {
    case 'quarter':
      return `${start.year()} Q${Math.floor(start.month() / 3) + 1}`
    case 'month':
      return start.format('MMM YYYY')
    case 'week':
      return `Week of ${start.format('MMM D, YYYY')}`
    default:
      return start.format('MMM D, YYYY')
  }
}

const valuesAt = (series: { label: string, data: (number | null)[] }[], i: number) => series.map(s => `${s.label} ${s.data[i] ?? 'none'}`).join(', ')
/** A per-period chart as text, for assistive technology: `Q1: Approved 4, Denied 1; Q2: …`. */
export const describePeriods = (labels: string[], series: Parameters<typeof valuesAt>[0]) =>
  labels.map((label, i) => `${label}: ${valuesAt(series, i)}`).join('; ')
