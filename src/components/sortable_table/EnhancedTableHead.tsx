import React from 'react'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './Themes'

export interface HeadCell {
  id: string
  label: string
  disablePadding?: boolean
}

export type SortOrder = 'asc' | 'desc'

interface EnhancedTableHeadProps {
  order: SortOrder
  orderBy: string
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void
  headCells: HeadCell[]
}

export default function EnhancedTableHead({
  order,
  orderBy,
  onRequestSort,
  headCells,
}: Readonly<EnhancedTableHeadProps>) {
  const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property)
  }

  return (
    <ThemeProvider theme={theme}>
      <TableHead>
        <TableRow>
          {headCells.map((headCell, index) => {
            const sortDirection = order === 'desc' ? 'sorted descending' : 'sorted ascending'
            const ariaLabel = orderBy === headCell.id
              ? `${headCell.label}, ${sortDirection}`
              : `${headCell.label}, unsorted`
            return (
              <TableCell
                key={headCell.id}
                align="center"
                padding={headCell.disablePadding ? 'none' : 'normal'}
                sortDirection={orderBy === headCell.id ? order : false}
                sx={{
                  lineHeight: 'normal',
                  fontWeight: '600',
                  padding: '10px',
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={createSortHandler(headCell.id)}
                  aria-label={ariaLabel}
                  sx={{
                    fontSize: '16px',
                    fontWeight: '400',
                    width: '100px',
                    paddingLeft: index === 0 ? '17px' : '12px',
                  }}
                >
                  {headCell.label}
                </TableSortLabel>
              </TableCell>
            )
          })}
        </TableRow>
      </TableHead>
    </ThemeProvider>
  )
}
