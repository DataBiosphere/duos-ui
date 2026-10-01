import React, { useState } from 'react'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DarKind, SoApproval, SoApprovalStatus } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { HeadlineFigures } from 'src/components/dar_analytics/HeadlineFigures'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'

const PAGE_SIZE = 25

const KIND_LABELS: Record<DarKind, string> = {
  ORIGINAL: 'DAR',
  PROGRESS_REPORT: 'Progress report',
  CLOSEOUT: 'Closeout',
}

const STATUS_LABELS: Record<SoApprovalStatus, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  SKIPPED: 'Skipped',
  NOT_DETERMINED: 'Not determined',
}

const date = (value?: number | null) => (value == null ? '–' : dayjs(value).format('MMM D, YYYY'))

const COLUMNS: GridColDef<SoApproval>[] = [
  { field: 'kind', headerName: 'Submission', flex: 1, sortable: false, valueFormatter: (value: DarKind) => KIND_LABELS[value] },
  { field: 'submissionDate', headerName: 'Submitted', flex: 1, sortable: false, valueFormatter: date },
  { field: 'status', headerName: 'SO status', flex: 1, sortable: false, valueFormatter: (value: SoApprovalStatus) => STATUS_LABELS[value] },
  { field: 'approvalDate', headerName: 'Approved', flex: 1, sortable: false, valueFormatter: date },
  {
    field: 'elapsedDays',
    headerName: 'Days to approval',
    flex: 1,
    align: 'right',
    headerAlign: 'right',
    sortable: false,
    valueFormatter: (value?: number | null) => (value == null ? '–' : value.toFixed(1)),
  },
]

export const SoApprovalsSection = ({ range }: { range: DarAnalyticsRange }) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE })
  const rangeKey = `${range.from}|${range.to}|${range.bucket}`
  const [pagedRange, setPagedRange] = useState(rangeKey)
  if (pagedRange !== rangeKey) {
    setPagedRange(rangeKey)
    setPaginationModel(current => ({ ...current, page: 0 }))
  }
  const report = useDarMetricsReport('so-approvals', DarMetrics.getSoApprovals, range, {
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
  })
  const buckets = report.data?.buckets ?? []
  const countOf = (status: SoApprovalStatus) =>
    buckets.filter(bucket => bucket.status === status).reduce((sum, bucket) => sum + bucket.count, 0)

  return (
    <AnalyticsSection
      title="SO approvals"
      description={'DARs, progress reports and closeouts submitted in the range, and where each stands '
        + 'with its Signing Official. Listed rather than charted while the history is short.'}
      caveats={[
        'Pre-authorization skips are recorded from May 20, 2026, and closeout reviews from June 5, 2025; '
        + 'earlier submissions without an approval show as Not determined. Approval times start in June '
        + '2026 for DARs and September 2025 for closeouts.',
      ]}
      isLoading={report.isLoading}
      isRefreshing={report.isPlaceholderData}
      error={report.error}
      isEmpty={(report.data?.total ?? 0) === 0}
      emptyText="Nothing was submitted in this range."
    >
      <HeadlineFigures
        figures={(['APPROVED', 'PENDING', 'SKIPPED', 'NOT_DETERMINED'] as const).map(status => ({
          label: STATUS_LABELS[status],
          value: countOf(status),
        }))}
      />
      <DataGrid
        aria-label="SO approval per submission"
        rows={report.data?.rows ?? []}
        columns={COLUMNS}
        getRowId={row => row.referenceId}
        rowCount={report.data?.total ?? 0}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[PAGE_SIZE]}
        autoHeight
        disableColumnMenu
        disableRowSelectionOnClick
        disableVirtualization
      />
    </AnalyticsSection>
  )
}
