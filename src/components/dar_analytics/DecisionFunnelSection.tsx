import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DecisionBucketCount, DecisionState, MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'

interface StateRow {
  state: DecisionState
  label: string
  color: string
  /** False where consent never reports the state at that level. */
  dar: boolean
  dataset: boolean
}

const CANCELED_GREY = '#7a8691'

const STATES: StateRow[] = [
  { state: 'PENDING', label: 'Pending', color: Theme.palette.secondary, dar: true, dataset: true },
  { state: 'NO_ELECTION', label: 'No election yet', color: Theme.palette.link, dar: false, dataset: true },
  { state: 'APPROVED', label: 'Approved', color: Theme.palette.success, dar: true, dataset: true },
  { state: 'DENIED', label: 'Denied', color: Theme.palette.error, dar: true, dataset: true },
  { state: 'MIXED', label: 'Mixed', color: Theme.palette.highlighted, dar: true, dataset: false },
  { state: 'CANCELED', label: 'Canceled', color: CANCELED_GREY, dar: true, dataset: true },
]

const DAR_STATES = STATES.filter(row => row.dar)

interface CountRow {
  id: string
  label: string
  dars: number | string
  datasets: number | string
}

// Chart beside the table from the MUI `lg` breakpoint, stacked below it.
const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: '2rem',
  alignItems: 'start',
}

const COLUMNS: GridColDef<CountRow>[] = [
  { field: 'label', headerName: 'State', flex: 1, sortable: false },
  { field: 'dars', headerName: 'DARs', type: 'number', flex: 1, sortable: false },
  { field: 'datasets', headerName: 'Datasets on DARs', type: 'number', flex: 1, sortable: false },
]

/** Buckets come split by how each decision was made, so the same state can appear more than once. */
const countByState = (buckets: DecisionBucketCount[]): Record<DecisionState, number> => {
  const counts = Object.fromEntries(STATES.map(({ state }) => [state, 0])) as Record<DecisionState, number>
  buckets.forEach(({ state, count }) => {
    counts[state] += count
  })
  return counts
}

interface DecisionFunnelSectionProps {
  range: DarAnalyticsRange
}

export const DecisionFunnelSection = ({ range }: DecisionFunnelSectionProps) => {
  const dars = useDarMetricsReport('decisions', DarMetrics.getDecisions, range, { limit: 1 })
  const datasets = useDarMetricsReport('dataset-decisions', DarMetrics.getDatasetDecisions, range, { limit: 1 })

  const darBuckets = dars.data?.buckets ?? []
  const darCounts = countByState(darBuckets)
  const datasetCounts = countByState(datasets.data?.buckets ?? [])

  const rows: CountRow[] = [
    ...STATES.map(({ state, label, dar, dataset }) => ({
      id: state,
      label,
      dars: dar ? darCounts[state] : '–',
      datasets: dataset ? datasetCounts[state] : '–',
    })),
    { id: 'TOTAL', label: 'Total', dars: dars.data?.total ?? 0, datasets: datasets.data?.total ?? 0 },
  ]

  // While a new range loads, the previous report stays up, so label it with the range it covers.
  const shown: DarAnalyticsRange = dars.data
    ? { from: dars.data.from, to: dars.data.to, bucket: dars.data.bucket.toLowerCase() as MetricsBucket }
    : range
  const bucketStarts = bucketStartsInRange(shown)
  const key = (start: number, state: DecisionState) => `${start}|${state}`
  const countAt = darBuckets.reduce((m, b) => m.set(key(b.bucketStart, b.state), (m.get(key(b.bucketStart, b.state)) ?? 0) + b.count), new Map<string, number>())
  const series = DAR_STATES.map(({ state, label, color }) => ({
    label,
    color,
    stack: 'state',
    data: bucketStarts.map(start => countAt.get(key(start, state)) ?? 0),
  }))

  return (
    <AnalyticsSection
      title="Decision funnel"
      description={'DARs submitted in the range, by their DAC decision. A DAR is decided once every '
        + 'dataset on it is decided or canceled, and a reopened decision counts as pending until the '
        + 'DAC decides again.'}
      // One report on the new range and one on the old would mix ranges across columns.
      isLoading={dars.isLoading || datasets.isLoading || dars.isPlaceholderData !== datasets.isPlaceholderData}
      isRefreshing={dars.isPlaceholderData || datasets.isPlaceholderData}
      error={dars.error ?? datasets.error}
      isEmpty={(dars.data?.total ?? 0) === 0 && (datasets.data?.total ?? 0) === 0}
      emptyText="No DARs were submitted in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'DARs submitted', value: dars.data?.total ?? 0 },
          { label: 'Approved', value: darCounts.APPROVED },
          { label: 'Denied', value: darCounts.DENIED },
          { label: 'Pending', value: darCounts.PENDING },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          height={320}
          xAxis={[{ scaleType: 'band', data: bucketStarts.map(start => formatBucketStart(start, shown.bucket)) }]}
          series={series}
        />
        <DataGrid
          aria-label="Decision counts"
          rows={rows}
          columns={COLUMNS}
          autoHeight
          hideFooter
          disableColumnMenu
          disableRowSelectionOnClick
          disableVirtualization
        />
      </Box>
    </AnalyticsSection>
  )
}
