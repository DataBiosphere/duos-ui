import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { InstitutionDarCount, MetricsBucket } from 'src/types/darMetrics'
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

interface InstitutionRow extends InstitutionDarCount {
  id: string
}

const COLUMNS: GridColDef<InstitutionRow>[] = [
  { field: 'institutionName', headerName: 'Institution', flex: 2, sortable: false, valueFormatter: (value?: string | null) => value ?? 'No institution' },
  { field: 'darCount', headerName: 'DARs', type: 'number', flex: 1, sortable: false },
  { field: 'researcherCount', headerName: 'Researchers', type: 'number', flex: 1, sortable: false },
]

export const VolumeSection = ({ range }: { range: DarAnalyticsRange }) => {
  const report = useDarMetricsReport('volume', DarMetrics.getVolume, range, { limit: 1 })
  const data = report.data
  const shown: DarAnalyticsRange = data
    ? { from: data.from, to: data.to, bucket: data.bucket.toLowerCase() as MetricsBucket }
    : range
  const byStart = new Map((data?.buckets ?? []).map(bucket => [bucket.bucketStart, bucket]))
  const starts = bucketStartsInRange(shown)
  const institutions = data?.institutions ?? []
  const rows: InstitutionRow[] = institutions.map((institution, index) => ({
    ...institution,
    id: `${institution.institutionId ?? 'none'}-${institution.institutionName ?? ''}-${index}`,
  }))

  return (
    <AnalyticsSection
      title="Volume"
      description={'Original DARs submitted in the range, who submitted them and from where. Progress '
        + 'reports, closeouts, drafts, and canceled or archived DARs are left out.'}
      caveats={[
        'A DAR shows the institution recorded when it was submitted. DARs submitted before DUOS recorded '
        + 'one show the researcher\'s current institution instead, so a researcher who has moved takes '
        + 'those DARs with them.',
      ]}
      isLoading={report.isPending}
      isRefreshing={report.isPlaceholderData}
      error={report.error}
      isEmpty={(data?.total ?? 0) === 0}
      emptyText="No DARs were submitted in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'DARs submitted', value: data?.total ?? 0 },
          { label: 'Researchers', value: data?.researchers.length ?? 0 },
          { label: 'Institutions', value: institutions.filter(i => i.institutionName != null).length },
          {
            label: 'Datasets requested',
            value: (data?.buckets ?? []).reduce((sum, bucket) => sum + bucket.datasetCount, 0),
          },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          height={320}
          xAxis={[{ scaleType: 'band', data: starts.map(start => formatBucketStart(start, shown.bucket)) }]}
          series={[{ label: 'DARs submitted', data: starts.map(start => byStart.get(start)?.darCount ?? 0) }]}
        />
        <DataGrid
          aria-label="DARs by institution"
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
