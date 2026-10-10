import { useMemo, useState } from 'react'
import { Box, Tooltip } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { darCodeComparator, emailTypeLabel, formatTimestamp, recipientName } from 'src/components/email_log_table/emailLogUtils'
import { MailSend } from 'src/libs/ajax/Email'
import { isNil } from 'src/utils/NodashUtil'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const MULTIPLE = 'Multiple'

export interface EmailLogTableProps {
  isLoading: boolean
  sends: MailSend[]
  /** Only sends of this type; every send when absent. */
  emailType?: number
}

interface EmailRow {
  id: number
  type: string
  timestamp: number
  recipientCount: number
  darCode: string
  datasets: string
  send: MailSend
}

/** Hover or focus lists the items; takes the cell's tabIndex so the grid's arrow-key navigation reaches it. */
const HoverList = ({ label, items, tabIndex }: { label: string, items: string[], tabIndex: -1 | 0 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Tooltip
      title={(
        <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: '50vh', overflowY: 'auto' }}>
          {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </Box>
      )}
      describeChild
    >
      <Box component="span" tabIndex={tabIndex} sx={{ textDecoration: 'underline dotted' }}>{label}</Box>
    </Tooltip>
  </Box>
)

const recipientItems = (send: MailSend): string[] => {
  const names = send.recipients.map(recipient =>
    recipient.delivered ? recipientName(recipient) : `${recipientName(recipient)} (not delivered)`)
  const unlisted = send.recipientCount - send.recipients.length
  return unlisted > 0 ? [...names, `and ${unlisted.toLocaleString()} more`] : names
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
  {
    field: 'recipientCount',
    headerName: 'Recipients',
    minWidth: 150,
    sortingOrder: ['desc', 'asc'],
    renderCell: ({ row, tabIndex }) => {
      const label = row.recipientCount === 1 ? '1 recipient' : `${row.recipientCount.toLocaleString()} recipients`
      return row.recipientCount === 0 ? label : <HoverList label={label} items={recipientItems(row.send)} tabIndex={tabIndex} />
    },
  },
  { field: 'darCode', headerName: 'DAR-ID', minWidth: 130, getSortComparator: darCodeComparator },
  {
    field: 'datasets',
    headerName: 'DUOS-ID',
    minWidth: 150,
    renderCell: ({ row, value, tabIndex }) => value === MULTIPLE
      ? <HoverList label={MULTIPLE} items={row.send.datasetIdentifiers} tabIndex={tabIndex} />
      : value,
  },
]

export const EmailLogTable = function EmailLogTable({ isLoading, sends, emailType }: EmailLogTableProps) {
  const allRows = useMemo(() => sends.map((send): EmailRow => ({
    id: send.sendId,
    type: emailTypeLabel(send.emailType),
    timestamp: send.createDate,
    recipientCount: send.recipientCount,
    darCode: send.darCode ?? '',
    // Sorts on what the cell shows.
    datasets: send.datasetIdentifiers.length > 1 ? MULTIPLE : send.datasetIdentifiers[0] ?? '',
    send,
  })), [sends])

  const rows = useMemo(() => allRows.filter(row => isNil(emailType) || row.send.emailType === emailType),
    [allRows, emailType])

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE_OPTIONS[0] })
  const [lastFilters, setLastFilters] = useState({ sends, emailType })
  const lastPage = Math.max(0, Math.ceil(rows.length / paginationModel.pageSize) - 1)

  // A new range, search or type starts at page 1; adjusted in render, as remounting would drop the sort.
  if (sends !== lastFilters.sends || emailType !== lastFilters.emailType) {
    setLastFilters({ sends, emailType })
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
