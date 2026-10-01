import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { AccessEndReason, MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

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
  { field: 'renewals', headerName: 'Renewals', type: 'number', flex: 1, sortable: false },
]

export const ExpirationRenewalSection = ({ range }: { range: DarAnalyticsRange }) => {
  const expirations = useDarMetricsReport('expirations', DarMetrics.getExpirations, range, { limit: 1 })
  const renewals = useDarMetricsReport('renewals', DarMetrics.getRenewals, range, { limit: 1 })
  const data = expirations.data
  const shown: DarAnalyticsRange = data
    ? { from: data.from, to: data.to, bucket: data.bucket.toLowerCase() as MetricsBucket }
    : range
  const ended = (start: number, reason: AccessEndReason) => (data?.buckets ?? [])
    .filter(bucket => bucket.bucketStart === start && bucket.reason === reason)
    .reduce((sum, bucket) => sum + bucket.count, 0)
  const renewed = (start: number) => (renewals.data?.buckets ?? [])
    .filter(bucket => bucket.bucketStart === start)
    .reduce((sum, bucket) => sum + bucket.renewalCount, 0)
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
      isLoading={expirations.isLoading || renewals.isLoading}
      isRefreshing={expirations.isPlaceholderData || renewals.isPlaceholderData}
      error={expirations.error ?? renewals.error}
      isEmpty={(data?.total ?? 0) === 0 && (renewals.data?.total ?? 0) === 0}
      emptyText="No access ended and nothing was renewed in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'Expired', value: total('expired') },
          { label: 'Closed out', value: total('closedOut') },
          { label: 'Renewals', value: total('renewals') },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          height={320}
          xAxis={[{ scaleType: 'band', data: rows.map(row => row.label) }]}
          series={[
            { label: 'Expired', data: rows.map(row => row.expired) },
            { label: 'Closed out', data: rows.map(row => row.closedOut) },
            { label: 'Renewals', data: rows.map(row => row.renewals) },
          ]}
        />
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
