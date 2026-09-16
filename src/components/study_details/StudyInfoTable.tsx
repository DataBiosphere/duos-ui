import React from 'react'
import { Table, TableBody, TableCell, TableRow } from '@mui/material'

interface Row { label: string, value?: React.ReactNode }

// `false` is what an unsatisfied JSX guard evaluates to, so it means 'nothing to show' here
// just as `undefined` does. `0` is a real value and stays.
const hasValue = (value: React.ReactNode): boolean =>
  value !== undefined && value !== null && value !== '' && value !== false

const StudyInfoTable = ({ rows }: { rows: Row[] }) => (
  <Table size="small" sx={{ mt: 2, maxWidth: 760 }}>
    <TableBody>
      {rows.filter(row => hasValue(row.value)).map(row => (
        <TableRow key={row.label}>
          <TableCell component="th" sx={{ fontWeight: 600, width: 180 }}>{row.label}</TableCell>
          <TableCell>{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export default StudyInfoTable
