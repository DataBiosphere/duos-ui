import React from 'react'
import { useState, useEffect } from 'react'
import SortableTable from 'src/components/sortable_table/SortableTable'
import { User } from 'src/libs/ajax/User'
import { formatDate, Notifications } from 'src/libs/utils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection.tsx'
import { Styles } from 'src/libs/theme.js'

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
  usePageTitle('My Datasets')
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
      <div style={{ marginBottom: '2rem' }}>
        <TableHeaderSection
          title="Controlled Access Grants"
          description="Your current dataset approvals"
        />
      </div>
      <SortableTable rows={rows} headCells={headCells} />
    </div>
  )
}
