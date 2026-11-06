import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DarMetricsQuery, DarMetricsSubject } from 'src/types/darMetrics'

/** The DACs every report on a page is scoped to; left unset, consent reads every DAC for an admin and a chair's or member's own. */
export const DarMetricsScope = createContext<number[] | undefined>(undefined)

/** The study or dataset every report in a study or dataset page's trends is scoped to; it takes the place of a DAC scope. */
export const DarMetricsSubjectScope = createContext<DarMetricsSubject | undefined>(undefined)

/** Sections that chart only `buckets` pass `limit: 1`, since consent always pages `rows`. */
export const useDarMetricsReport = <T>(
  name: string,
  fetchReport: (query: DarMetricsQuery) => Promise<T>,
  range: Pick<DarMetricsQuery, 'from' | 'to' | 'bucket'>,
  page: Pick<DarMetricsQuery, 'limit' | 'offset'> = {},
  /** False leaves the report unrequested, for a section that shows it only in some scopes. */
  enabled = true,
) => {
  const dacIds = useContext(DarMetricsScope)
  const subject = useContext(DarMetricsSubjectScope)
  return useQuery({
    queryKey: ['dar-metrics', name, range, page, dacIds, subject],
    queryFn: () => fetchReport({ ...range, ...page, ...(subject ? { subject } : { dacIds }) }),
    enabled,
    retry: false,
    // Kept across a range change only; another report's, DAC's or study's figures would mislabel this one's.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[1] === name
        && sameScope(previousQuery.queryKey[4], dacIds)
        && sameScope(previousQuery.queryKey[5], subject)
        ? previous
        : undefined),
  })
}

const sameScope = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** False while two reports cover different ranges, so a section never mixes them. */
export const coverSameRange = (a?: { from: string, to: string, bucket: string }, b?: typeof a) =>
  !a || !b || (a.from === b.from && a.to === b.to && a.bucket === b.bucket)
