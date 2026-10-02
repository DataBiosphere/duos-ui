import { useQuery } from '@tanstack/react-query'
import { DarMetricsQuery } from 'src/types/darMetrics'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'

/** Sections that chart only `buckets` pass `limit: 1`, since consent always pages `rows`. */
export const useDarMetricsReport = <T>(
  name: string,
  fetchReport: (query: DarMetricsQuery) => Promise<T>,
  range: DarAnalyticsRange,
  page: Pick<DarMetricsQuery, 'limit' | 'offset'> = {},
) => useQuery({
  queryKey: ['dar-metrics', name, range, page],
  queryFn: () => fetchReport({ ...range, ...page }),
  retry: false,
  // Kept across a range change only; another report's figures would mislabel this one's.
  placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === name ? previous : undefined),
})

/** False while two reports cover different ranges, so a section never mixes them. */
export const coverSameRange = (a?: { from: string, to: string, bucket: string }, b?: typeof a) =>
  !a || !b || (a.from === b.from && a.to === b.to && a.bucket === b.bucket)
