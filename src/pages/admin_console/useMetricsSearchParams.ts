import { useState } from 'react'
import { useSearchParams } from 'react-router'
import dayjs from 'dayjs'
import { MetricsBucket } from 'src/types/darMetrics'
import { BUCKETS, DarAnalyticsRange, defaultRange, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'

const isBucket = (value: string | null): value is MetricsBucket =>
  BUCKETS.some(bucket => bucket.value === value)

/** Tab, range and bucket live in the URL so a view can be linked to and survives a reload. */
export const useMetricsSearchParams = (tabKeys: string[]) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fallback] = useState(() => defaultRange(dayjs()))

  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const bucket = searchParams.get('bucket')
  const range: DarAnalyticsRange = {
    ...(isValidRange(from, to) ? { from, to } : { from: fallback.from, to: fallback.to }),
    bucket: isBucket(bucket) ? bucket : fallback.bucket,
  }
  const requestedTab = searchParams.get('tab')
  const tab = requestedTab && tabKeys.includes(requestedTab) ? requestedTab : tabKeys[0]

  const update = (changes: Record<string, string>, replace: boolean) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(changes).forEach(([key, value]) => next.set(key, value))
      return next
    }, { replace })

  return {
    tab,
    range,
    setTab: (key: string) => update({ tab: key }, false),
    // Range edits replace the history entry, so Back leaves the page rather than undoing each one.
    setRange: (change: Partial<DarAnalyticsRange>) => update({ ...range, ...change }, true),
  }
}
