import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { MetricsBucket } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, byStart, describePeriods, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { coverSameRange, useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

export const DatasetsStudiesSection = ({ range }: { range: DarAnalyticsRange }) => {
  const datasets = useDarMetricsReport('datasets', DarMetrics.getDatasets, range)
  const studies = useDarMetricsReport('studies', DarMetrics.getStudies, range)
  const shown: DarAnalyticsRange = datasets.data
    ? { from: datasets.data.from, to: datasets.data.to, bucket: datasets.data.bucket.toLowerCase() as MetricsBucket }
    : range
  const datasetsAt = byStart(datasets.data?.buckets)
  const studiesAt = byStart(studies.data?.buckets)
  const starts = bucketStartsInRange(shown)

  const labels = starts.map(start => formatBucketStart(start, shown.bucket))
  const series = [
    { label: 'Datasets created', data: starts.map(start => datasetsAt.get(start)?.count ?? 0) },
    { label: 'DAC approved', data: starts.map(start => datasetsAt.get(start)?.dacApproved ?? 0) },
    { label: 'Studies created', data: starts.map(start => studiesAt.get(start)?.count ?? 0) },
  ]

  return (
    <AnalyticsSection
      title="Datasets & Studies"
      description="Datasets and studies created in the range, and how many of those datasets their DAC has approved."
      caveats={[
        'DAC approval is as it stands now, so a period’s approved count can rise as DACs approve later.',
        'A legacy dataset with no create date isn’t counted.',
      ]}
      isLoading={datasets.isPending || studies.isPending || !coverSameRange(datasets.data, studies.data)}
      isRefreshing={datasets.isPlaceholderData || studies.isPlaceholderData}
      error={datasets.error ?? studies.error}
      isEmpty={(datasets.data?.total ?? 0) === 0 && (studies.data?.total ?? 0) === 0}
      emptyText="No datasets or studies were created in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'Datasets created', value: datasets.data?.total ?? 0 },
          { label: 'DAC approved', value: datasets.data?.dacApproved ?? 0 },
          { label: 'Studies created', value: studies.data?.total ?? 0 },
        ]}
      />
      <BarChart
        title="Datasets and studies created per period"
        desc={describePeriods(labels, series)}
        height={320}
        xAxis={[{ scaleType: 'band', data: labels }]}
        series={series}
      />
    </AnalyticsSection>
  )
}
