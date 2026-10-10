import { useMemo, useState } from 'react'
import { Box, Tooltip } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { emailTypeLabel, formatTimestamp, recipientName, sendMatches } from 'src/components/email_log_table/emailLogUtils'
import { MailSend } from 'src/libs/ajax/Email'
import { isNil } from 'src/utils/NodashUtil'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export interface EmailLogTableProps {
  isLoading: boolean
  sends: MailSend[]
  /** Only sends of this type; every send when absent. */
  emailType?: number
  /** Only sends whose type, recipients, DAR code or DUOS-IDs contain this text. */
  search?: string
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

/** Hover or focus lists the items; focusable so the list is reachable without a pointer. */
const HoverList = ({ label, items }: { label: string, items: string[] }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Tooltip
      title={(
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </Box>
      )}
      describeChild
    >
      <Box component="span" tabIndex={0} sx={{ textDecoration: 'underline dotted' }}>{label}</Box>
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
    headerName: 'To',
    minWidth: 150,
    sortingOrder: ['desc', 'asc'],
    renderCell: ({ row }) => {
      const label = row.recipientCount === 1 ? '1 recipient' : `${row.recipientCount.toLocaleString()} recipients`
      return <HoverList label={label} items={recipientItems(row.send)} />
    },
  },
  { field: 'darCode', headerName: 'DAR-ID', minWidth: 130 },
  {
    field: 'datasets',
    headerName: 'DUOS-ID',
    minWidth: 150,
    renderCell: ({ row }) => {
      const ids = row.send.datasetIdentifiers
      if (ids.length <= 1) return ids[0] ?? ''
      return <HoverList label="Multiple" items={ids} />
    },
  },
]

export const EmailLogTable = function EmailLogTable({ isLoading, sends, emailType, search = '' }: EmailLogTableProps) {
  const rows = useMemo(() => sends
    .filter(send => (isNil(emailType) || send.emailType === emailType) && sendMatches(send, search))
    .map((send): EmailRow => ({
      id: send.sendId,
      type: emailTypeLabel(send.emailType),
      timestamp: send.createDate,
      recipientCount: send.recipientCount,
      darCode: send.darCode ?? '',
      // Sorts and quick-filters on what the cell shows.
      datasets: send.datasetIdentifiers.length > 1 ? 'Multiple' : send.datasetIdentifiers[0] ?? '',
      send,
    })),
  [sends, emailType, search])

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE_OPTIONS[0] })
  const [lastFilters, setLastFilters] = useState({ sends, emailType, search })
  const lastPage = Math.max(0, Math.ceil(rows.length / paginationModel.pageSize) - 1)

  // A new range, type or search starts at page 1; adjusted in render, as remounting would drop the sort.
  if (sends !== lastFilters.sends || emailType !== lastFilters.emailType || search !== lastFilters.search) {
    setLastFilters({ sends, emailType, search })
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
