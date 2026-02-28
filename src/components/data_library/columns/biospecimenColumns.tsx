import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Biospecimen } from 'src/types/model'
import { Link } from '@mui/material'

export const makeBiospecimenColumns = (): GridColDef<Biospecimen>[] => [
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1,
    minWidth: 150,
    renderCell: params => (
      <Link href={`/studies/${params.row?.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'biospecimenId',
    headerName: 'Biospecimen ID',
    flex: 1,
    width: 200,
  },
  {
    field: 'specimenType',
    headerName: 'Specimen Type',
    width: 150,
  },
  {
    field: 'donorId',
    headerName: 'Donor ID',
    flex: 1,
    width: 150,
  },
  {
    field: 'dateOfCollection',
    headerName: 'Date Of Collection',
    flex: 1,
    width: 150,
  },
]
