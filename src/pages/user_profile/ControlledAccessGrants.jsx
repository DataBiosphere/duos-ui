import React from 'react'
import { useState, useEffect } from 'react'
import SortableTable from 'src/components/sortable_table/SortableTable'
import { User } from 'src/libs/ajax/User'
import { formatDate, Notifications } from 'src/libs/utils'

const headCells = [
  {
    id: 'darCode',
    numeric: false,
    disablePadding: false,
    label: 'DAR Code',
  },
  {
    id: 'datasetIdentifier',
    numeric: false,
    disablePadding: false,
    label: 'Dataset Identifier',
  },
  {
    id: 'datasetName',
    numeric: false,
    disablePadding: false,
    label: 'Dataset Name',
  },
  {
    id: 'dacName',
    numeric: false,
    disablePadding: false,
    label: 'DAC Name',
  },
  {
    id: 'expirationDate',
    numeric: false,
    disablePadding: false,
    label: 'Expiration Date',
  },
]

function createData(darCode, datasetIdentifier, datasetName, dacName, expirationDate) {
  return {
    darCode,
    datasetIdentifier,
    datasetName,
    dacName,
    expirationDate,
  }
}

function createRows(userRows) {
  return userRows.map(exampleRow => createData(
    exampleRow.darCode,
    exampleRow.datasetIdentifier,
    exampleRow.datasetName,
    exampleRow.dacName,
    formatDate(exampleRow.expirationDate),
  ))
}

export default function ControlledAccessGrants() {
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
    <div style={{ margin: '1rem 5rem' }}>
      <h1
        style={{
          color: '#01549F',
          fontSize: '20px',
          fontWeight: '600',
        }}
      >
        Controlled Access Grants
      </h1>
      <p
        style={{
          color: '#000',
          fontSize: '16px',
          fontWeight: '400',
        }}
      >
        Your current dataset approvals
      </p>
      <div style={{ marginTop: '20px' }} />
      <SortableTable rows={rows} headCells={headCells} />
    </div>
  )
}
