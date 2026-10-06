import React from 'react'
import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, describePeriods, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { descriptionStyle, statLabelStyle } from 'src/components/dashboard/dashboardStyles'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

interface Category {
  key: string
  label: string
  color: string
}

const STATUSES: Category[] = [
  { key: 'Open', label: 'Open', color: Theme.palette.secondary },
  { key: 'Closed', label: 'Closed', color: Theme.palette.primary },
  { key: 'Canceled', label: 'Canceled', color: Theme.palette.neutral },
  { key: 'Final', label: 'Final', color: Theme.palette.link },
  { key: 'PendingApproval', label: 'Pending approval', color: Theme.palette.highlighted },
]

const VOTE_TYPES: Category[] = [
  { key: 'DAC', label: 'DAC member', color: Theme.palette.secondary },
  { key: 'FINAL', label: 'Final (chair)', color: Theme.palette.success },
  { key: 'Chairperson', label: 'Chairperson', color: Theme.palette.link },
  { key: 'AGREEMENT', label: 'Agreement', color: Theme.palette.highlighted },
  { key: 'RADAR_APPROVE', label: 'RADAR auto-approval', color: Theme.palette.neutral },
]

// The two charts side by side from the MUI `lg` breakpoint, stacked on narrower screens.
const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
  gap: '2rem',
  alignItems: 'start',
}

/** One stacked series per category that has any count; a value consent adds later gets its own. */
const stackedSeries = (
  categories: Category[],
  buckets: { bucketStart: number, key: string, count: number }[],
  starts: number[],
  stack: string,
) => {
  const counts = new Map<string, number>()
  buckets.forEach(({ bucketStart, key, count }) => {
    const at = `${bucketStart}|${key}`
    counts.set(at, (counts.get(at) ?? 0) + count)
  })
  const present = new Set(buckets.map(({ key }) => key))
  const known = new Set(categories.map(({ key }) => key))
  const extra = [...present].filter(key => !known.has(key))
    .map(key => ({ key, label: key, color: Theme.palette.disabled }))
  return [...categories.filter(({ key }) => present.has(key)), ...extra].map(({ key, label, color }) => ({
    label,
    color,
    stack,
    data: starts.map(start => counts.get(`${start}|${key}`) ?? 0),
  }))
}

interface PeriodChartProps {
  title: string
  emptyText: string
  labels: string[]
  series: ReturnType<typeof stackedSeries>
}

const PeriodChart = ({ title, emptyText, labels, series }: PeriodChartProps) => (
  <Box>
    <Typography component="h3" sx={statLabelStyle}>{title}</Typography>
    {series.length === 0
      ? <Typography sx={{ ...descriptionStyle, mt: '1rem' }}>{emptyText}</Typography>
      : (
          <BarChart
            title={title}
            desc={describePeriods(labels, series)}
            height={320}
            xAxis={[{ scaleType: 'band', data: labels }]}
            series={series}
          />
        )}
  </Box>
)

export const ElectionsVotesSection = ({ range }: { range: DarAnalyticsRange }) => {
  const report = useDarMetricsReport('elections', DarMetrics.getElections, range)
  const shown: DarAnalyticsRange = report.data
    ? { from: report.data.from, to: report.data.to, bucket: report.data.bucket.toLowerCase() as MetricsBucket }
    : range
  const starts = bucketStartsInRange(shown)
  const labels = starts.map(start => formatBucketStart(start, shown.bucket))
  const elections = (report.data?.elections ?? []).map(({ bucketStart, status, count }) => ({ bucketStart, key: status, count }))
  const votes = (report.data?.votes ?? []).map(({ bucketStart, type, count }) => ({ bucketStart, key: type, count }))
  const electionSeries = stackedSeries(STATUSES, elections, starts, 'status')
  const voteSeries = stackedSeries(VOTE_TYPES, votes, starts, 'type')

  return (
    <AnalyticsSection
      title="Elections & Votes"
      description="DAC activity: data access elections opened in the range by their status, and votes cast in the range by type."
      caveats={[
        'An election counts under the status it has now, so a period’s open elections close over time.',
        'A changed vote counts once, in the period it last changed.',
      ]}
      isLoading={report.isPending}
      isRefreshing={report.isPlaceholderData}
      error={report.error}
      isEmpty={(report.data?.electionsOpened ?? 0) === 0 && (report.data?.votesCast ?? 0) === 0}
      emptyText="No elections were opened and no votes were cast in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'Elections opened', value: report.data?.electionsOpened ?? 0 },
          { label: 'Votes cast', value: report.data?.votesCast ?? 0 },
        ]}
      />
      <Box sx={layoutStyle}>
        <PeriodChart
          title="Elections opened per period by status"
          emptyText="No elections were opened in this range."
          labels={labels}
          series={electionSeries}
        />
        <PeriodChart
          title="Votes cast per period by type"
          emptyText="No votes were cast in this range."
          labels={labels}
          series={voteSeries}
        />
      </Box>
    </AnalyticsSection>
  )
}
