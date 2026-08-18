import React, { useEffect } from 'react'
import { QueryKey, useQuery } from '@tanstack/react-query'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { DuosUser } from 'src/types/model'
import { ConsoleDashboardTile } from './ConsoleDashboardGrid'

/**
 * Reads one stat off the summary payload. The response is only ever asserted to match its
 * interface, so an accessor must tolerate a missing group (`s => s.dataLibrary?.studies`)
 * rather than throwing mid-render; anything that is not a number renders the placeholder.
 */
export interface ConsoleDashboardStatMeta<S> {
  label: string
  value: (summary: S) => number | null | undefined
}

export interface ConsoleDashboardTileMeta<S> {
  label: string
  link: string
  icon: React.ComponentType
  description: string
  stats: ConsoleDashboardStatMeta<S>[]
  /** Omitted means "always render". */
  isRenderedForUser?: (user: DuosUser) => boolean
}

/**
 * `predicate?.(user) ?? true` would render an entry whose predicate returned `undefined` - the
 * exact case of a stored user missing the role flag the predicate reads. Only an explicit `true`
 * may reveal a role-gated entry.
 */
export const isRenderedForUser = (
  predicate: ((user: DuosUser) => boolean) | undefined,
  user: DuosUser,
): boolean => predicate == null || predicate(user) === true

const readStat = <S>(stat: ConsoleDashboardStatMeta<S>, summary: S): number | null => {
  const value = stat.value(summary)
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * The shared data plumbing behind every console dashboard: one summary request, one error
 * notification per failure, and tiles whose counts blank out rather than mixing stale and fresh
 * numbers. All role consoles use it so a change to the loading or error policy can only be made once.
 */
export function useConsoleDashboardSummary<S>(
  queryKey: QueryKey,
  queryFn: () => Promise<S>,
  tileMeta: ConsoleDashboardTileMeta<S>[],
): { tiles: ConsoleDashboardTile[], isLoading: boolean } {
  const { data, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn,
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    // A failed query stays in the cache, so `isError` is true again the moment the dashboard
    // remounts. `refetchOnMount: 'always'` means a fresh request is already in flight on that
    // first render, and waiting for it keeps the toast tied to a failure the user just hit.
    if (isError && !isFetching) {
      Notifications.showError({
        text: `Error: Unable to load dashboard statistics: ${extractError(error)}`,
      })
    }
  }, [isError, isFetching, error])

  // Hide cached counts while a refetch is in flight so stale and fresh numbers never mix.
  const summary = isFetching || isError ? undefined : data
  const tiles = tileMeta.map(tile => ({
    label: tile.label,
    link: tile.link,
    icon: tile.icon,
    description: tile.description,
    stats: tile.stats.map(stat => ({
      label: stat.label,
      value: summary === undefined ? null : readStat(stat, summary),
    })),
  }))

  return { tiles, isLoading: isFetching }
}
