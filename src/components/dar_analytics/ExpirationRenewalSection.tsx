import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { AccessEndReason, MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { coverSameRange, useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

// Access ending is neutral, renewal is the good outcome.
const ENDED_GREY = '#7a8691'

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: '2rem',
  alignItems: 'start',
}

interface PeriodRow {
  id: number
  label: string
  expired: number
  closedOut: number
  renewals: number
}

const COLUMNS: GridColDef<PeriodRow>[] = [
  { field: 'label', headerName: 'Period', flex: 1.4, sortable: false },
  { field: 'expired', headerName: 'Expired', type: 'number', flex: 1, sortable: false },
  { field: 'closedOut', headerName: 'Closed out', type: 'number', flex: 1, sortable: false },
  { field: 'renewals', headerName: 'Datasets renewed', type: 'number', flex: 1, sortable: false },
]

export const ExpirationRenewalSection = ({ range }: { range: DarAnalyticsRange }) => {
  const expirations = useDarMetricsReport('expirations', DarMetrics.getExpirations, range, { limit: 1 })
  const renewals = useDarMetricsReport('renewals', DarMetrics.getRenewals, range, { limit: 1 })
  const data = expirations.data
  const shown: DarAnalyticsRange = data
    ? { from: data.from, to: data.to, bucket: data.bucket.toLowerCase() as MetricsBucket }
    : range
  const endedAt = (data?.buckets ?? []).reduce(
    (m, b) => m.set(`${b.bucketStart}|${b.reason}`, (m.get(`${b.bucketStart}|${b.reason}`) ?? 0) + b.count),
    new Map<string, number>(),
  )
  const renewedAt = new Map((renewals.data?.buckets ?? []).map(b => [b.bucketStart, b.renewalCount]))
  const ended = (start: number, reason: AccessEndReason) => endedAt.get(`${start}|${reason}`) ?? 0
  const renewed = (start: number) => renewedAt.get(start) ?? 0
  const rows: PeriodRow[] = bucketStartsInRange(shown).map(start => ({
    id: start,
    label: formatBucketStart(start, shown.bucket),
    expired: ended(start, 'EXPIRED'),
    closedOut: ended(start, 'CLOSED_OUT'),
    renewals: renewed(start),
  }))
  const total = (key: 'expired' | 'closedOut' | 'renewals') => rows.reduce((sum, row) => sum + row[key], 0)

  return (
    <AnalyticsSection
      title="Expiration and renewal"
      description={'DAR collections whose access ended in the range, dated by when it ended, and datasets '
        + 'renewed by approved progress reports submitted in the range. Access runs 365 days from the '
        + 'newest approval on a dataset; a closeout ends it early.'}
      isLoading={expirations.isPending || renewals.isPending || !coverSameRange(expirations.data, renewals.data)}
      isRefreshing={expirations.isPlaceholderData || renewals.isPlaceholderData}
      error={expirations.error ?? renewals.error}
      isEmpty={(data?.total ?? 0) === 0 && (renewals.data?.total ?? 0) === 0}
      emptyText="No access ended and nothing was renewed in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'Expired', value: total('expired') },
          { label: 'Closed out', value: total('closedOut') },
          { label: 'Datasets renewed', value: total('renewals') },
        ]}
      />
      <Box sx={layoutStyle}>
        <Box role="img" aria-label="Collections expired and closed out, and datasets renewed, per period; the table gives the counts">
          <BarChart
            height={320}
            xAxis={[{ scaleType: 'band', data: rows.map(row => row.label) }]}
            series={[
              { label: 'Expired', data: rows.map(row => row.expired), color: ENDED_GREY },
              { label: 'Closed out', data: rows.map(row => row.closedOut), color: Theme.palette.highlighted },
              { label: 'Datasets renewed', data: rows.map(row => row.renewals), color: Theme.palette.success },
            ]}
          />
        </Box>
        <DataGrid
          aria-label="Expiration and renewal per period"
          rows={rows}
          columns={COLUMNS}
          autoHeight
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10]}
          disableColumnMenu
          disableRowSelectionOnClick
          disableVirtualization
        />
      </Box>
    </AnalyticsSection>
  )
}
