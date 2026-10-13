import { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { emailTypeLabel, formatTimestamp } from 'src/components/email_log_table/emailLogUtils'
import { MailMessage } from 'src/libs/ajax/Email'
import { isNil } from 'src/utils/NodashUtil'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export interface EmailLogTableProps {
  isLoading: boolean
  emails: MailMessage[]
  /** Only emails of this type; every email when absent. */
  emailType?: number
}

interface EmailRow {
  id: number
  type: string
  timestamp: number
}

const COLUMNS: GridColDef<EmailRow>[] = [
  { field: 'type', headerName: 'Type of Email Sent', flex: 1, minWidth: 240 },
  {
    field: 'timestamp',
    headerName: 'Timestamp',
    flex: 1,
    minWidth: 180,
    // Opens newest first, so the default asc/desc/unsorted cycle would make the first click a no-op reorder.
    sortingOrder: ['desc', 'asc'],
    // Sorts on the epoch value, displays the local time.
    valueFormatter: (value: number) => formatTimestamp(value),
  },
]

export const EmailLogTable = function EmailLogTable({ isLoading, emails, emailType }: EmailLogTableProps) {
  const rows = useMemo(() => emails
    .filter(email => isNil(emailType) || email.emailType === emailType)
    .map((email): EmailRow => ({ id: email.emailId, type: emailTypeLabel(email.emailType), timestamp: email.createDate })),
  [emails, emailType])

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE_OPTIONS[0] })
  const [lastFilters, setLastFilters] = useState({ emails, emailType })
  const lastPage = Math.max(0, Math.ceil(rows.length / paginationModel.pageSize) - 1)

  // A new range or type starts at page 1; adjusted in render, as remounting would drop the sort.
  if (emails !== lastFilters.emails || emailType !== lastFilters.emailType) {
    setLastFilters({ emails, emailType })
    setPaginationModel(model => ({ ...model, page: 0 }))
  }
  else if (paginationModel.page > lastPage) {
    setPaginationModel(model => ({ ...model, page: lastPage }))
  }

  return (
    <Box sx={DATA_GRID_CONTAINER_SX}>
      <DataGrid
        rows={rows}
        columns={COLUMNS}
        loading={isLoading}
        // A progress bar rather than the default skeleton, so loading is announced to screen readers.
        slotProps={{ loadingOverlay: { variant: 'linear-progress', noRowsVariant: 'linear-progress' } }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        paginationModel={{ page: Math.min(paginationModel.page, lastPage), pageSize: paginationModel.pageSize }}
        onPaginationModelChange={setPaginationModel}
        initialState={{ sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] } }}
        disableRowSelectionOnClick
        autoHeight
        sx={DATA_GRID_SX}
      />
    </Box>
  )
}
