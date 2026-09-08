import React from 'react'
import { Box, CircularProgress } from '@mui/material'

/** Centered spinner used as the `loadingOverlay` slot for every DUOS DataGrid. */
export const DataGridLoadingOverlay = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
)

export default DataGridLoadingOverlay
