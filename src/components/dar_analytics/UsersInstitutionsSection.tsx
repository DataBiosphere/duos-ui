import React from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { MetricsBucket, RoleUserCount } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { bucketStartsInRange, byStart, describePeriods, formatBucketStart } from 'src/components/dar_analytics/bucketAxis'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { coverSameRange, useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: '2rem',
  alignItems: 'start',
}

interface RoleRow extends RoleUserCount {
  id: string
}

const COLUMNS: GridColDef<RoleRow>[] = [
  { field: 'role', headerName: 'Role', flex: 2, sortable: false },
  { field: 'userCount', headerName: 'Users', type: 'number', flex: 1, sortable: false },
]

export const UsersInstitutionsSection = ({ range }: { range: DarAnalyticsRange }) => {
  const users = useDarMetricsReport('users', DarMetrics.getUsers, range)
  const institutions = useDarMetricsReport('institutions', DarMetrics.getInstitutions, range)
  const shown: DarAnalyticsRange = users.data
    ? { from: users.data.from, to: users.data.to, bucket: users.data.bucket.toLowerCase() as MetricsBucket }
    : range
  const usersAt = byStart(users.data?.buckets)
  const institutionsAt = byStart(institutions.data?.buckets)
  const starts = bucketStartsInRange(shown)
  const rows: RoleRow[] = (users.data?.roles ?? []).map(role => ({ ...role, id: role.role }))

  const labels = starts.map(start => formatBucketStart(start, shown.bucket))
  const series = [
    { label: 'Users created', data: starts.map(start => usersAt.get(start)?.count ?? 0) },
    { label: 'Institutions created', data: starts.map(start => institutionsAt.get(start)?.count ?? 0) },
  ]

  return (
    <AnalyticsSection
      title="Users & Institutions"
      description="User accounts and institutions created in the range, and those users by the roles they hold now."
      caveats={[
        'DUOS records no logins, so these are accounts created, not active users.',
        'A user counts once for each role they hold, so the roles can add up to more than the users created.',
      ]}
      isLoading={users.isPending || institutions.isPending || !coverSameRange(users.data, institutions.data)}
      isRefreshing={users.isPlaceholderData || institutions.isPlaceholderData}
      error={users.error ?? institutions.error}
      isEmpty={(users.data?.total ?? 0) === 0 && (institutions.data?.total ?? 0) === 0}
      emptyText="No users or institutions were created in this range."
    >
      <HeadlineFigures
        figures={[
          { label: 'Users created', value: users.data?.total ?? 0 },
          { label: 'Institutions created', value: institutions.data?.total ?? 0 },
        ]}
      />
      <Box sx={layoutStyle}>
        <BarChart
          title="Users and institutions created per period"
          desc={describePeriods(labels, series)}
          height={320}
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={series}
        />
        <DataGrid
          aria-label="Users created by role"
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
