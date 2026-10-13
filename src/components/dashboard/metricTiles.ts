import { useMemo } from 'react'
import dayjs from 'dayjs'
import { QueryKey, useQuery } from '@tanstack/react-query'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { DATE_FORMAT } from 'src/components/dar_analytics/darAnalyticsRange'
import { DashboardMetrics } from 'src/libs/ajax/Dashboard'

type Summary = { metrics?: DashboardMetrics }
type Tile<S extends Summary> = ConsoleDashboardTileMeta<S>

const roundDays = (days?: number | null) => (days == null ? null : Math.round(days * 10) / 10)

// The tiles report the last 90 days, so each opens its tab on that window. A tile for a tab the
// Metrics page doesn't have yet would quietly open the first tab, so it's left out instead.
const metricTiles = <S extends Summary>(route: string, tabs: { key: string }[], from: string, to: string): Tile<S>[] => {
  const window = `from=${from}&to=${to}&bucket=week`
  const metricTile = (tab: string, tile: Omit<Tile<S>, 'link'>): Tile<S>[] =>
    tabs.some(({ key }) => key === tab) ? [{ ...tile, link: `${route}?tab=${tab}&${window}` }] : []
  return [
    ...metricTile('decisions', {
      label: 'Decisions',
      icon: FactCheckOutlinedIcon,
      description: 'DAC decisions on DARs submitted in the last 90 days.',
      stats: [
        { label: 'Submitted', value: s => s.metrics?.decisions?.submitted },
        { label: 'Approved', value: s => s.metrics?.decisions?.approved },
        { label: 'Denied', value: s => s.metrics?.decisions?.denied },
        { label: 'Pending', value: s => s.metrics?.decisions?.pending },
      ],
    }),
    ...metricTile('turnaround', {
      label: 'DAC Turnaround',
      icon: TimerOutlinedIcon,
      description: 'Days from submission to DAC decision, last 90 days.',
      stats: [
        { label: 'Median Days', value: s => roundDays(s.metrics?.turnaround?.medianDays) },
        { label: 'Mode Days', value: s => s.metrics?.turnaround?.modeDays },
        { label: 'Decided', value: s => s.metrics?.turnaround?.decided },
      ],
    }),
    ...metricTile('so-approvals', {
      label: 'SO Approvals',
      icon: VerifiedUserOutlinedIcon,
      description: 'Where submissions from the last 90 days stand with their Signing Official.',
      stats: [
        { label: 'Approved', value: s => s.metrics?.soApprovals?.approved },
        { label: 'Pending', value: s => s.metrics?.soApprovals?.pending },
        { label: 'Skipped', value: s => s.metrics?.soApprovals?.skipped },
      ],
    }),
    ...metricTile('volume', {
      label: 'Volume',
      icon: BarChartOutlinedIcon,
      description: 'DARs submitted in the last 90 days, and by whom.',
      stats: [
        { label: 'DARs', value: s => s.metrics?.volume?.dars },
        { label: 'Researchers', value: s => s.metrics?.volume?.researchers },
        { label: 'Institutions', value: s => s.metrics?.volume?.institutions },
      ],
    }),
    ...metricTile('expiration', {
      label: 'Expiration & Renewal',
      icon: EventBusyOutlinedIcon,
      description: 'Access that ended, and datasets renewed, in the last 90 days.',
      stats: [
        { label: 'Expired', value: s => s.metrics?.expiration?.expired },
        { label: 'Closed Out', value: s => s.metrics?.expiration?.closedOut },
        { label: 'Renewals', value: s => s.metrics?.expiration?.renewals },
      ],
    }),
  ]
}

/**
 * A tile per Metrics tab with the summary's 90-day figures. Reads the summary ConsoleDashboard
 * fetches, so each link opens the window behind its counts; the browser's date stands in whenever
 * those counts are hidden, as during a refetch.
 */
export const useMetricTiles = <S extends Summary>(
  queryKey: QueryKey,
  queryFn: () => Promise<S>,
  route: string,
  tabs: { key: string }[],
): Tile<S>[] => {
  const { data, isFetching, isError } = useQuery({ queryKey, queryFn, enabled: false })
  const shown = isFetching || isError ? undefined : data
  const from = shown?.metrics?.from ?? dayjs().subtract(89, 'day').format(DATE_FORMAT)
  const to = shown?.metrics?.to ?? dayjs().format(DATE_FORMAT)
  return useMemo(() => metricTiles<S>(route, tabs, from, to), [route, tabs, from, to])
}
