import { Theme } from 'src/libs/theme'
import { DataGridLoadingOverlay } from 'src/components/DataGridLoadingOverlay'

/**
 * Shared MUI DataGrid presentation defaults, so every DUOS grid looks the same.
 *
 * MUI rings on plain :focus, which fires on click and reads as a selection the user did not
 * make; keyboard focus keeps a visible ring via :focus-visible.
 */
export const DATA_GRID_SX = {
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible': {
    outline: `2px solid ${Theme.palette.link}`,
    outlineOffset: '-2px',
  },
  // A link takes focus in its cell's place, and index.css resets link outlines.
  '& .MuiDataGrid-cell a:focus-visible': {
    outline: `2px solid ${Theme.palette.link}`,
    outlineOffset: '2px',
  },
}

/**
 * Squares a grid up with the page header and the search/action row above it: the left inset
 * matches SearchBar's own margin, the negative right mirrors SEARCH_ACTION_HEADER_SECTION.
 */
export const DATA_GRID_CONTAINER_SX = { marginTop: '2rem', marginLeft: 3, marginRight: '-2rem' }

/** Module-level so the slots object keeps a stable identity across renders. */
export const DATA_GRID_SLOTS = { loadingOverlay: DataGridLoadingOverlay }
