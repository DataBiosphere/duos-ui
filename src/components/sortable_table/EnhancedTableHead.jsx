import React from 'react'
import PropTypes from 'prop-types'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './Themes'

export default function EnhancedTableHead(props) {
  const {
    order,
    orderBy,
    onRequestSort,
    headCells,
  } = props
  const createSortHandler = property => (event) => {
    onRequestSort(event, property)
  }

  return (
    <ThemeProvider theme={theme}>
      <TableHead>
        <TableRow>
          {headCells.map((headCell, index) => (
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
              {index === 0
                ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={createSortHandler(headCell.id)}
                      aria-label={
                        orderBy === headCell.id
                          ? `${headCell.label}, ${order === 'desc' ? 'sorted descending' : 'sorted ascending'}`
                          : `${headCell.label}, unsorted`
                      }
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        width: '100px',
                        paddingLeft: '17px',
                      }}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )
                : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={createSortHandler(headCell.id)}
                      aria-label={
                        orderBy === headCell.id
                          ? `${headCell.label}, ${order === 'desc' ? 'sorted descending' : 'sorted ascending'}`
                          : `${headCell.label}, unsorted`
                      }
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        width: '100px',
                        paddingLeft: '12px' }}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    </ThemeProvider>
  )
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
}
