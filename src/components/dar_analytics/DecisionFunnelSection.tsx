import React, { useContext } from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DecisionBucketCount, DecisionState, MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, describePeriods, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { coverSameRange, DarMetricsSubjectScope, useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'
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
const STATE_COLUMN: GridColDef<CountRow> = { field: 'label', headerName: 'State', flex: 1, sortable: false }
const DATASETS_COLUMN: GridColDef<CountRow> = { field: 'datasets', headerName: 'Datasets on DARs', type: 'number', flex: 1, sortable: false, valueFormatter: notReported }
const COLUMNS: GridColDef<CountRow>[] = [
  STATE_COLUMN,
  { field: 'dars', headerName: 'DARs', type: 'number', flex: 1, sortable: false, valueFormatter: notReported },
  DATASETS_COLUMN,
]
const DATASET_COLUMNS: GridColDef<CountRow>[] = [STATE_COLUMN, DATASETS_COLUMN]

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
  // A study or dataset page reports only the decisions on its own datasets. A DAR's overall state
  // also reflects datasets on other studies, so it is neither requested nor shown there.
  const datasetOnly = useContext(DarMetricsSubjectScope) !== undefined
  const dars = useDarMetricsReport('decisions', DarMetrics.getDecisions, range, { limit: 1 }, !datasetOnly)
  const datasets = useDarMetricsReport('dataset-decisions', DarMetrics.getDatasetDecisions, range, { limit: 1 })

  const darBuckets = dars.data?.buckets ?? []
  const datasetBuckets = datasets.data?.buckets ?? []
  const darCounts = countByState(darBuckets)
  const datasetCounts = countByState(datasetBuckets)

  const rows: CountRow[] = [
    ...(datasetOnly ? DATASET_STATES : STATES).map(({ state, label, dar, dataset }) => ({
      id: state,
      label,
      dars: dar ? darCounts[state] : null,
      datasets: dataset ? datasetCounts[state] : null,
    })),
    { id: 'TOTAL', label: 'Total', dars: dars.data?.total ?? 0, datasets: datasets.data?.total ?? 0 },
  ]

  // While a new range loads, the previous report stays up, so label it with the range it covers.
  const charted = datasetOnly ? datasets.data : dars.data
  const shown: DarAnalyticsRange = charted
    ? { from: charted.from, to: charted.to, bucket: charted.bucket.toLowerCase() as MetricsBucket }
    : range
  const bucketStarts = bucketStartsInRange(shown)
  const key = (start: number, state: DecisionState) => `${start}|${state}`
  const chartedBuckets: DecisionBucketCount[] = datasetOnly ? datasetBuckets : darBuckets
  const countAt = chartedBuckets.reduce((m, b) => m.set(key(b.bucketStart, b.state), (m.get(key(b.bucketStart, b.state)) ?? 0) + b.count), new Map<string, number>())
  const labels = bucketStarts.map(start => formatBucketStart(start, shown.bucket))
  const series = (datasetOnly ? DATASET_STATES : DAR_STATES).map(({ state, label, color }) => ({
    label,
    color,
    stack: 'state',
    data: bucketStarts.map(start => countAt.get(key(start, state)) ?? 0),
  }))
  const counts = datasetOnly ? datasetCounts : darCounts

  return (
    <AnalyticsSection
      title="Decision funnel"
      description={datasetOnly
        ? 'This study\'s or dataset\'s datasets on DARs submitted in the range, by the DAC decision on '
        + 'each. A reopened decision counts as pending until the DAC decides again.'
        : 'DARs submitted in the range, by their DAC decision. A DAR is decided once every '
          + 'dataset on it is decided or canceled, and a reopened decision counts as pending until the '
          + 'DAC decides again.'}
      isLoading={datasetOnly
        ? datasets.isPending
        : dars.isPending || datasets.isPending || !coverSameRange(dars.data, datasets.data)}
      isRefreshing={datasets.isPlaceholderData || (!datasetOnly && dars.isPlaceholderData)}
      error={(datasetOnly ? undefined : dars.error) ?? datasets.error}
      isEmpty={(datasets.data?.total ?? 0) === 0 && (datasetOnly || (dars.data?.total ?? 0) === 0)}
      emptyText="No DARs were submitted in this range."
    >
      <HeadlineFigures
        figures={[
          datasetOnly
            ? { label: 'Dataset requests', value: datasets.data?.total ?? 0 }
            : { label: 'DARs submitted', value: dars.data?.total ?? 0 },
          { label: 'Approved', value: counts.APPROVED },
          { label: 'Denied', value: counts.DENIED },
          { label: 'Pending', value: counts.PENDING },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          title={datasetOnly ? 'Dataset requests by decision state per period' : 'DARs by decision state per period'}
          desc={describePeriods(labels, series)}
          height={320}
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={series}
        />
        <DataGrid
          aria-label="Decision counts"
          rows={rows}
          columns={datasetOnly ? DATASET_COLUMNS : COLUMNS}
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
