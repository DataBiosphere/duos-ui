import React, { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Box } from '@mui/material'
import { User } from 'src/libs/ajax/User'
import { formatDate, Notifications } from 'src/libs/utils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Styles } from 'src/libs/theme'
import { ApprovedDataset } from 'src/types/model'

interface GridRow {
  id: number
  darCode: string | undefined
  datasetIdentifier: string | undefined
  datasetName: string
  dacName: string
  expirationDate: string
}

const columns: GridColDef[] = [
  { field: 'darCode', headerName: 'DAR Code', flex: 1 },
  { field: 'datasetIdentifier', headerName: 'Dataset Identifier', flex: 1 },
  { field: 'datasetName', headerName: 'Dataset Name', flex: 1 },
  { field: 'dacName', headerName: 'DAC Name', flex: 1 },
  { field: 'expirationDate', headerName: 'Expiration Date', flex: 1 },
]

// darCode and datasetIdentifier are not in the ApprovedDataset model type but may be present
// in the API response; preserve the existing access pattern until the type is reconciled.
type ApprovedDatasetRow = ApprovedDataset & { darCode?: string, datasetIdentifier?: string }

function createRows(userRows: ApprovedDataset[]): GridRow[] {
  return (userRows as ApprovedDatasetRow[]).map((row, index) => ({
    id: index,
    darCode: row.darCode,
    datasetIdentifier: row.datasetIdentifier,
    datasetName: row.datasetName,
    dacName: row.dacName,
    expirationDate: formatDate(row.expirationDate),
  }))
}

export default function ControlledAccessGrants() {
  usePageTitle('My Dataset Approvals')
  const [rows, setRows] = useState<GridRow[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const userRows = await User.getApprovedDatasets()
        setRows(createRows(userRows))
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' })
      }
    }
    init()
  }, [])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My Dataset Approvals"
          description="Your current dataset approvals"
        />
      </div>
      <Box sx={{ marginTop: '2rem', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          }}
        />
      </Box>
    </div>
  )
}
