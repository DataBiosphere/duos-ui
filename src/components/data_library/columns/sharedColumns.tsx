import React from 'react'
import { GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import { Box, Chip, Tooltip } from '@mui/material'

const MAX_VISIBLE_CHIPS = 3

/**
 * Chips capped at three, the rest behind a `+N` tooltip. `valueGetter` joins them
 * so the quick filter matches text, not the array; the column stays unsortable.
 */
export const chipListColumn = <T extends GridValidRowModel>(
  field: string,
  headerName: string,
  getValues: (row: T) => string[],
  minWidth: number,
): GridColDef<T> => ({
  field,
  headerName,
  flex: 1,
  minWidth,
  sortable: false,
  valueGetter: (_value, row) => getValues(row).join(', '),
  renderCell: (params) => {
    const values = getValues(params.row)
    if (values.length === 0) {
      return null
    }
    const overflow = values.slice(MAX_VISIBLE_CHIPS)
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {values.slice(0, MAX_VISIBLE_CHIPS).map((value, index) => (
          <Chip key={`${value}-${index}`} label={value} size="small" variant="outlined" />
        ))}
        {overflow.length > 0 && (
          <Tooltip title={overflow.join(', ')}>
            <Chip label={`+${overflow.length}`} size="small" variant="outlined" />
          </Tooltip>
        )}
      </Box>
    )
  },
})

/** Single-line text that ellipsises, with the untruncated value in a tooltip. */
export const truncatedTextColumn = <T extends GridValidRowModel>(
  field: string,
  headerName: string,
  width: number,
): GridColDef<T> => ({
  field,
  headerName,
  width,
  renderCell: (params) => {
    const text = params.value || ''
    return (
      <Tooltip title={text} placement="top">
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </Box>
      </Tooltip>
    )
  },
})

/**
 * Reads "No" for a row indexed without the field, matching how both transforms
 * default it (`citation ?? false`). A cited row shows its citation in the
 * tooltip; the form requires the text either way, so an uncited row has one too.
 */
export const citationColumn = <T extends GridValidRowModel>(
  getCitationText: (row: T) => string,
): GridColDef<T> => ({
  field: 'citation',
  headerName: 'Datasets Cited',
  width: 130,
  valueGetter: (value: boolean | undefined) => (value ? 'Yes' : 'No'),
  renderCell: (params) => {
    const text = getCitationText(params.row)
    const label = params.row.citation ? 'Yes' : 'No'
    if (!params.row.citation || !text) {
      return <Box>{label}</Box>
    }
    // describeChild keeps Yes/No as the name; the cell's own tabIndex keeps this
    // inside the grid's roving focus rather than adding a tab stop per row.
    return (
      <Tooltip title={text} placement="top" describeChild>
        <Box tabIndex={params.tabIndex}>{label}</Box>
      </Tooltip>
    )
  },
})
