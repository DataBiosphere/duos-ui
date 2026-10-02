import React, { useState } from 'react'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { LineChart } from '@mui/x-charts/LineChart'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { MetricsBucket, TurnaroundBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

type Level = 'dar' | 'dataset'

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: '2rem',
  alignItems: 'start',
}

const days = (value?: number | null) => (value == null ? '–' : value.toFixed(1))

interface TurnaroundRow extends TurnaroundBucket {
  id: number
  label: string
}

const COLUMNS: GridColDef<TurnaroundRow>[] = [
  { field: 'label', headerName: 'Submitted', flex: 1.4, sortable: false },
  { field: 'count', headerName: 'Measured', type: 'number', flex: 1, sortable: false },
  { field: 'meanDays', headerName: 'Mean', flex: 1, align: 'right', headerAlign: 'right', sortable: false, valueFormatter: days },
  { field: 'medianDays', headerName: 'Median', flex: 1, align: 'right', headerAlign: 'right', sortable: false, valueFormatter: days },
  { field: 'modeDays', headerName: 'Mode', flex: 1, align: 'right', headerAlign: 'right', sortable: false, valueFormatter: (value?: number | null) => value ?? '–' },
]

export const TurnaroundSection = ({ range }: { range: DarAnalyticsRange }) => {
  const [level, setLevel] = useState<Level>('dar')
  const report = useDarMetricsReport(
    `${level}-turnaround`,
    level === 'dar' ? DarMetrics.getDecisionTurnaround : DarMetrics.getDatasetDecisionTurnaround,
    range,
    { limit: 1 },
  )
  const data = report.data
  const shown: DarAnalyticsRange = data
    ? { from: data.from, to: data.to, bucket: data.bucket.toLowerCase() as MetricsBucket }
    : range
  const byStart = new Map((data?.buckets ?? []).map(bucket => [bucket.bucketStart, bucket]))
  const starts = bucketStartsInRange(shown)
  const stat = (key: 'meanDays' | 'medianDays') => starts.map(start => byStart.get(start)?.[key] ?? null)
  const rows: TurnaroundRow[] = (data?.buckets ?? []).map(bucket => ({
    ...bucket,
    id: bucket.bucketStart,
    label: formatBucketStart(bucket.bucketStart, shown.bucket),
  }))

  return (
    <AnalyticsSection
      title="DAC turnaround"
      description={level === 'dar'
        ? 'Days from submission to the DAC decision, for DARs submitted in the range. A DAR counts once '
        + 'every dataset on it is decided, measured to the last decision.'
        : 'Days from submission to the DAC decision on each dataset, for DARs submitted in the range.'}
      // Until the new level arrives, the report on screen is the other level's.
      caveats={data && !report.isPlaceholderData
        ? ['Decisions with no usable vote date (votes cast before March 2021, or dated before a backfilled '
          + `submission) are left out of these figures: ${data.unmeasured} in this range.`]
        : []}
      actions={(
        <ToggleButtonGroup
          aria-label="Measure turnaround per"
          size="small"
          exclusive
          value={level}
          onChange={(_e, next: Level | null) => next && setLevel(next)}
          sx={{ mb: '1rem' }}
        >
          <ToggleButton value="dar">Per DAR</ToggleButton>
          <ToggleButton value="dataset">Per dataset</ToggleButton>
        </ToggleButtonGroup>
      )}
      isLoading={report.isLoading}
      isRefreshing={report.isPlaceholderData}
      error={report.error}
      isEmpty={(data?.total ?? 0) === 0}
      emptyText="No DARs submitted in this range have been decided."
    >
      <HeadlineFigures
        figures={[
          { label: 'Decided', value: (data?.total ?? 0) + (data?.unmeasured ?? 0) },
          { label: 'Unmeasured', value: data?.unmeasured ?? 0 },
        ]}
      />
      <Box sx={layoutStyle}>
        <LineChart
          height={320}
          xAxis={[{ scaleType: 'point', data: starts.map(start => formatBucketStart(start, shown.bucket)) }]}
          yAxis={[{ label: 'Days' }]}
          series={[
            { label: 'Median', data: stat('medianDays'), curve: 'linear', showMark: true },
            { label: 'Mean', data: stat('meanDays'), curve: 'linear', showMark: true },
          ]}
        />
        <DataGrid
          aria-label="Turnaround per bucket"
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
