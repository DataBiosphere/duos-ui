import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DarMetricsQuery, DarMetricsTarget } from 'src/types/darMetrics'

/** The DACs every report on a page is scoped to; left unset, consent reads every DAC for an admin and a chair's or member's own. */
export const DarMetricsScope = createContext<number[] | undefined>(undefined)

/** The study or dataset every report on a page covers; left unset, the reports are scoped by DAC. */
export const DarMetricsTargetContext = createContext<DarMetricsTarget | undefined>(undefined)

export const useDarMetricsTarget = () => useContext(DarMetricsTargetContext)

/** What a target's reports count, to finish a phrase such as "requests for". */
export const describeTarget = ({ kind }: DarMetricsTarget) =>
  (kind === 'study' ? 'this study\'s datasets' : 'this dataset')

/**
 * Sections that chart only `buckets` pass `limit: 1`, since consent always pages `rows`. A section
 * turns off a report it doesn't show with `enabled`; that report is never requested and stays
 * pending.
 */
export const useDarMetricsReport = <T>(
  name: string,
  fetchReport: (query: DarMetricsQuery) => Promise<T>,
  range: Pick<DarMetricsQuery, 'from' | 'to' | 'bucket'>,
  page: Pick<DarMetricsQuery, 'limit' | 'offset'> = {},
  enabled = true,
) => {
  const dacIds = useContext(DarMetricsScope)
  const target = useDarMetricsTarget()
  return useQuery({
    queryKey: ['dar-metrics', name, range, page, dacIds, target],
    queryFn: () => fetchReport({ ...range, ...page, dacIds, target }),
    enabled,
    retry: false,
    // Kept across a range change only; another report's, DAC's, study's or dataset's figures would
    // mislabel this one's.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[1] === name
        && sameScope(previousQuery.queryKey[4], dacIds)
        && sameScope(previousQuery.queryKey[5], target)
        ? previous
        : undefined),
  })
}

const sameScope = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** False while two reports cover different ranges, so a section never mixes them. */
export const coverSameRange = (a?: { from: string, to: string, bucket: string }, b?: typeof a) =>
  !a || !b || (a.from === b.from && a.to === b.to && a.bucket === b.bucket)
