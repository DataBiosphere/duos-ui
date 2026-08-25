import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Tooltip } from '@mui/material'
import { DatasetTerm } from 'src/types/model'
import { dataUseTooltip, orderDataUseCodes } from 'src/utils/DataUseUtils'

/**
 * The Data Library's Data Use cell, shared so every grid showing data use renders the same
 * chip in the same format. Spread it into a column list and override the width there — sizing
 * is the only part a grid gets to decide.
 */
export const DATA_USE_GRID_COLUMN: GridColDef<DatasetTerm> = {
  field: 'dataUse',
  headerName: 'Data Use',
  sortable: false,
  // Keep the cell's value identical to what the chip shows, so the two cannot
  // disagree if the grid ever gains export or quick-filter.
  valueGetter: (_value, row) => orderDataUseCodes(row).map(term => term.shortCode).join('-'),
  renderCell: (params) => {
    const terms = orderDataUseCodes(params.row)
    if (terms.length === 0) return null

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', maxWidth: '100%' }}>
        {/* One chip, so the tier of each code lives in the tooltip rather than in chip styling */}
        <Tooltip
          title={(
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {terms.map((term, index) => (
                <li key={`${term.shortCode}-${index}`}>{dataUseTooltip(term)}</li>
              ))}
            </Box>
          )}
          describeChild
        >
          <Chip
            // Derived here rather than read from params.value so the cell renders
            // correctly on its own; valueGetter builds the identical string from the
            // same helper. Both passes are a map over a handful of codes.
            label={terms.map(term => term.shortCode).join('-')}
            size="small"
            variant="outlined"
            color="primary"
            // The tooltip is the only place the tier of each code and a DS primary's
            // disease list appear, so it has to be reachable without a pointer. An
            // unclickable Chip renders a plain div, which never receives focus.
            tabIndex={0}
            // A long sequence ellipsizes at the cell edge instead of overflowing it
            sx={{ maxWidth: '100%' }}
          />
        </Tooltip>
      </Box>
    )
  },
}
