import { keepPreviousData, useQuery } from '@tanstack/react-query'
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
  placeholderData: keepPreviousData,
})
