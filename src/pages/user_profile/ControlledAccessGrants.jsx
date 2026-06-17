import React from 'react'
import { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box } from '@mui/material'
import { User } from 'src/libs/ajax/User'
import { formatDate, Notifications } from 'src/libs/utils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection.tsx'
import { Styles } from 'src/libs/theme.js'

const columns = [
  { field: 'darCode', headerName: 'DAR Code', flex: 1 },
  { field: 'datasetIdentifier', headerName: 'Dataset Identifier', flex: 1 },
  { field: 'datasetName', headerName: 'Dataset Name', flex: 1 },
  { field: 'dacName', headerName: 'DAC Name', flex: 1 },
  { field: 'expirationDate', headerName: 'Expiration Date', flex: 1 },
]

function createRows(userRows) {
  return userRows.map((row, index) => ({
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
  const [rows, setRows] = useState([])

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
