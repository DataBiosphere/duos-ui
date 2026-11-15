import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DecisionBucketCount, DecisionState, MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, describePeriods, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import {
  coverSameRange, describeTarget, useDarMetricsReport, useDarMetricsTarget,
} from 'src/components/dar_analytics/useDarMetricsReport'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'

interface StateRow {
  state: DecisionState
  label: string
  color: string
  /** False where consent never reports the state at that level. */
  dar: boolean
  dataset: boolean
}

const STATES: StateRow[] = [
  { state: 'PENDING', label: 'Pending', color: Theme.palette.secondary, dar: true, dataset: true },
  { state: 'NO_ELECTION', label: 'No election yet', color: Theme.palette.link, dar: false, dataset: true },
  { state: 'APPROVED', label: 'Approved', color: Theme.palette.success, dar: true, dataset: true },
  { state: 'DENIED', label: 'Denied', color: Theme.palette.error, dar: true, dataset: true },
  { state: 'MIXED', label: 'Mixed', color: Theme.palette.highlighted, dar: true, dataset: false },
  { state: 'CANCELED', label: 'Canceled', color: Theme.palette.neutral, dar: true, dataset: true },
]

const DAR_STATES = STATES.filter(row => row.dar)
const DATASET_STATES = STATES.filter(row => row.dataset)

interface CountRow {
  id: string
  label: string
  dars: number | null
  datasets: number | null
}

// Chart beside the table from the MUI `lg` breakpoint, above it on narrower screens.
const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: '2rem',
  alignItems: 'start',
}

const notReported = (value: number | null) => value ?? '–'
const COLUMNS: GridColDef<CountRow>[] = [
  { field: 'label', headerName: 'State', flex: 1, sortable: false },
  { field: 'dars', headerName: 'DARs', type: 'number', flex: 1, sortable: false, valueFormatter: notReported },
  { field: 'datasets', headerName: 'Datasets on DARs', type: 'number', flex: 1, sortable: false, valueFormatter: notReported },
]
const DATASET_COLUMNS = COLUMNS.filter(({ field }) => field !== 'dars')

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
  // A DAR's overall decision also reflects its datasets in other studies, so for one study or
  // dataset the section reports the decision on each of that study's or dataset's own datasets and
  // never asks for the per-DAR report, which consent doesn't serve there.
  const target = useDarMetricsTarget()
  const perDar = target === undefined
  const dars = useDarMetricsReport('decisions', DarMetrics.getDecisions, range, { limit: 1 }, perDar)
  const datasets = useDarMetricsReport('dataset-decisions', DarMetrics.getDatasetDecisions, range, { limit: 1 })
  const charted = perDar ? dars : datasets

  const chartedBuckets: DecisionBucketCount[] = charted.data?.buckets ?? []
  const darCounts = countByState(dars.data?.buckets ?? [])
  const datasetCounts = countByState(datasets.data?.buckets ?? [])
  const chartedCounts = perDar ? darCounts : datasetCounts

  const rows: CountRow[] = [
    ...(perDar ? STATES : DATASET_STATES).map(({ state, label, dar, dataset }) => ({
      id: state,
      label,
      dars: dar ? darCounts[state] : null,
      datasets: dataset ? datasetCounts[state] : null,
    })),
    { id: 'TOTAL', label: 'Total', dars: dars.data?.total ?? 0, datasets: datasets.data?.total ?? 0 },
  ]

  // While a new range loads, the previous report stays up, so label it with the range it covers.
  const shown: DarAnalyticsRange = charted.data
    ? { from: charted.data.from, to: charted.data.to, bucket: charted.data.bucket.toLowerCase() as MetricsBucket }
    : range
  const bucketStarts = bucketStartsInRange(shown)
  const key = (start: number, state: DecisionState) => `${start}|${state}`
  const countAt = chartedBuckets.reduce((m, b) => m.set(key(b.bucketStart, b.state), (m.get(key(b.bucketStart, b.state)) ?? 0) + b.count), new Map<string, number>())
  const labels = bucketStarts.map(start => formatBucketStart(start, shown.bucket))
  const series = (perDar ? DAR_STATES : DATASET_STATES).map(({ state, label, color }) => ({
    label,
    color,
    stack: 'state',
    data: bucketStarts.map(start => countAt.get(key(start, state)) ?? 0),
  }))
  const counted = perDar ? 'DARs' : 'Dataset requests'

  return (
    <AnalyticsSection
      title="Decision funnel"
      description={target
        ? `Requests for ${describeTarget(target)} on DARs submitted in the range, by the DAC's decision `
        + 'on each dataset. A reopened decision counts as pending until the DAC decides again.'
        : 'DARs submitted in the range, by their DAC decision. A DAR is decided once every '
          + 'dataset on it is decided or canceled, and a reopened decision counts as pending until the '
          + 'DAC decides again.'}
      isLoading={perDar
        ? dars.isPending || datasets.isPending || !coverSameRange(dars.data, datasets.data)
        : datasets.isPending}
      isRefreshing={charted.isPlaceholderData || datasets.isPlaceholderData}
      error={perDar ? dars.error ?? datasets.error : datasets.error}
      isEmpty={(charted.data?.total ?? 0) === 0 && (datasets.data?.total ?? 0) === 0}
      emptyText="No DARs were submitted in this range."
    >
      <HeadlineFigures
        figures={[
          { label: perDar ? 'DARs submitted' : 'Dataset requests', value: charted.data?.total ?? 0 },
          { label: 'Approved', value: chartedCounts.APPROVED },
          { label: 'Denied', value: chartedCounts.DENIED },
          { label: 'Pending', value: chartedCounts.PENDING },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          title={`${counted} by decision state per period`}
          desc={describePeriods(labels, series)}
          height={320}
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={series}
        />
        <DataGrid
          aria-label="Decision counts"
          rows={rows}
          columns={perDar ? COLUMNS : DATASET_COLUMNS}
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
