import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import dayjs from 'dayjs'
import { MetricsBucket } from 'src/types/darMetrics'
import { BUCKETS, DarAnalyticsRange, defaultRange, isChartable, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'

const isBucket = (value: string | null): value is MetricsBucket =>
  BUCKETS.some(bucket => bucket.value === value)

/** Tab, range and bucket live in the URL so a view can be linked to and survives a reload. */
export const useMetricsSearchParams = (tabKeys: string[]) => {
  const [searchParams, setSearchParams] = useSearchParams()
  // A functional update gets the params of its own render, so a delayed callback would undo newer edits.
  const latest = useRef(searchParams)
  useEffect(() => {
    latest.current = searchParams
  }, [searchParams])
  const [fallback] = useState(() => defaultRange(dayjs()))

  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const bucket = searchParams.get('bucket')
  const requested: DarAnalyticsRange = {
    ...(isValidRange(from, to) ? { from, to } : { from: fallback.from, to: fallback.to }),
    bucket: isBucket(bucket) ? bucket : fallback.bucket,
  }
  const range = isChartable(requested) ? requested : fallback
  const requestedTab = searchParams.get('tab')
  const tab = requestedTab && tabKeys.includes(requestedTab) ? requestedTab : tabKeys[0]

  const update = (changes: Record<string, string>, replace: boolean) => {
    const next = new URLSearchParams(latest.current)
    Object.entries(changes).forEach(([key, value]) => next.set(key, value))
    latest.current = next
    setSearchParams(next, { replace })
  }

  return {
    tab,
    range,
    setTab: (key: string) => update({ tab: key }, false),
    // Only the fields given; replacing the history entry lets Back leave the page in one step.
    setRange: (change: Partial<DarAnalyticsRange>) =>
      // After a fallback the URL still holds the rejected range, so write the range in use.
      update({ ...(range === requested ? {} : range), ...Object.fromEntries(Object.entries(change).filter(([, value]) => value !== undefined)) }, true),
  }
}
