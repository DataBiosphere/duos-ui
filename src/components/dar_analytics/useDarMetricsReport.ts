import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DarMetricsQuery } from 'src/types/darMetrics'

/** The DACs every report on a page is scoped to; left unset, consent reads every DAC for an admin and a chair's or member's own. */
export const DarMetricsScope = createContext<number[] | undefined>(undefined)

/** Sections that chart only `buckets` pass `limit: 1`, since consent always pages `rows`. */
export const useDarMetricsReport = <T>(
  name: string,
  fetchReport: (query: DarMetricsQuery) => Promise<T>,
  range: Pick<DarMetricsQuery, 'from' | 'to' | 'bucket'>,
  page: Pick<DarMetricsQuery, 'limit' | 'offset'> = {},
) => {
  const dacIds = useContext(DarMetricsScope)
  return useQuery({
    queryKey: ['dar-metrics', name, range, page, dacIds],
    queryFn: () => fetchReport({ ...range, ...page, dacIds }),
    retry: false,
    // Kept across a range change only; another report's or DAC's figures would mislabel this one's.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[1] === name && sameDacs(previousQuery.queryKey[4], dacIds) ? previous : undefined),
  })
}

const sameDacs = (a: unknown, b: number[] | undefined) => JSON.stringify(a) === JSON.stringify(b)

/** False while two reports cover different ranges, so a section never mixes them. */
export const coverSameRange = (a?: { from: string, to: string, bucket: string }, b?: typeof a) =>
  !a || !b || (a.from === b.from && a.to === b.to && a.bucket === b.bucket)
