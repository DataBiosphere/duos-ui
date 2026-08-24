import { DataGridLoadingOverlay } from 'src/components/DataGridLoadingOverlay'

/**
 * Shared MUI DataGrid presentation defaults, so every DUOS grid looks the same.
 *
 * Suppresses the grid's default focus outlines on cells and column headers: DUOS grids are
 * read-mostly, and the outline reads as a selection the user did not make.
 */
export const DATA_GRID_NO_FOCUS_OUTLINE_SX = {
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
}

/** Module-level so the slots object keeps a stable identity across renders. */
export const DATA_GRID_SLOTS = { loadingOverlay: DataGridLoadingOverlay }
