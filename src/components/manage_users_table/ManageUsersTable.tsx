import React, { useMemo, useState } from 'react'
import { Box, Tooltip } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid'
import { Link } from 'react-router'
import { getSearchFilterFunctions } from 'src/libs/utils'
import { Theme } from 'src/libs/theme'
import { dacNameMap, formatUserDacs, formatUserRoles, institutionName, UserDac, userDacs } from 'src/components/manage_users_table/manageUsersTableUtils'
import { DacObject, DuosUser } from 'src/types/model'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// MUI rings on plain :focus, which fires on click; keyboard focus keeps a ring via :focus-visible.
const DATAGRID_SX = {
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible': {
    outline: `2px solid ${Theme.palette.link}`,
    outlineOffset: '-2px',
  },
  // The link takes focus in its cell's place, and index.css resets link outlines.
  '& .MuiDataGrid-cell a:focus-visible': {
    outline: `2px solid ${Theme.palette.link}`,
    outlineOffset: '2px',
  },
}

// Left inset matches SearchBar's own margin, negative right mirrors the search and add button row.
const gridContainerSx = { marginTop: '2rem', marginLeft: 3, marginRight: '-2rem' }

export interface ManageUsersTableProps {
  isLoading: boolean
  userList: DuosUser[]
  dacList?: DacObject[]
  searchText: string
}

interface UserRow {
  id: number
  displayName: string
  email: string
  institution: string
  roles: string
  dacs: string
  dacDetails: UserDac[]
}

// Roles and institution are flattened to their displayed text, so every column sorts on what is read.
const toUserRow = (user: DuosUser, dacNameById: Map<number, string>): UserRow => {
  const dacDetails = userDacs(user.roles, dacNameById)
  return {
    id: user.userId,
    displayName: user.displayName,
    email: user.email,
    institution: institutionName(user.institution),
    roles: formatUserRoles(user.roles, user.libraryCard),
    dacs: formatUserDacs(dacDetails),
    dacDetails,
  }
}

const COLUMNS: GridColDef<UserRow>[] = [
  {
    field: 'displayName',
    headerName: 'User Name',
    flex: 1,
    minWidth: 180,
    // The cell's tabIndex keeps the link inside the grid's roving focus rather than in the page order.
    renderCell: ({ row, tabIndex }: GridRenderCellParams<UserRow>) => (
      <Link to={`/admin_edit_user/${row.id}`} title={`Edit ${row.displayName}`} tabIndex={tabIndex}>
        {row.displayName}
      </Link>
    ),
  },
  { field: 'email', headerName: 'Email', flex: 1.25, minWidth: 200 },
  { field: 'institution', headerName: 'Institution', flex: 1, minWidth: 180 },
  { field: 'roles', headerName: 'Roles', flex: 1, minWidth: 180 },
  {
    field: 'dacs',
    headerName: 'DACs',
    flex: 1,
    minWidth: 180,
    // The tooltip only shows the full list on hover once the row's names overflow the cell width.
    renderCell: ({ row, tabIndex }: GridRenderCellParams<UserRow>) => (
      <Tooltip title={row.dacDetails.length === 0 ? '' : row.dacs} placement="top">
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.dacDetails.length === 0
            ? 'None'
            : row.dacDetails.map((dac, index) => (
                <React.Fragment key={dac.dacId}>
                  {index > 0 && ', '}
                  <Link to={`/manage_dac/${dac.dacId}`} tabIndex={tabIndex}>
                    {dac.name}
                  </Link>
                </React.Fragment>
              ))}
        </Box>
      </Tooltip>
    ),
  },
]

const filterFn = getSearchFilterFunctions().users

export const ManageUsersTable = function ManageUsersTable({ isLoading, userList, dacList = [], searchText }: ManageUsersTableProps) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE_OPTIONS[0] })
  const [lastSearchText, setLastSearchText] = useState(searchText)

  const dacNameById = useMemo(() => dacNameMap(dacList), [dacList])

  // Filtering is derived, so a keystroke costs one render rather than a cascade of effects.
  const rows = useMemo(() => {
    const terms = searchText.split(' ').filter(term => term.length > 0)
    return terms.reduce((list, term) => filterFn(term, list), userList ?? []).map(user => toUserRow(user, dacNameById))
  }, [userList, searchText, dacNameById])

  const lastPage = Math.max(0, Math.ceil(rows.length / paginationModel.pageSize) - 1)

  // Adjusted during render rather than clamped for the render alone, so widening the results again
  // cannot restore the page the admin was already moved off.
  if (searchText !== lastSearchText) {
    setLastSearchText(searchText)
    setPaginationModel(model => ({ ...model, page: 0 }))
  }
  else if (paginationModel.page > lastPage) {
    setPaginationModel(model => ({ ...model, page: lastPage }))
  }

  const page = Math.min(paginationModel.page, lastPage)

  return (
    <Box sx={gridContainerSx}>
      <DataGrid
        rows={rows}
        columns={COLUMNS}
        loading={isLoading}
        // A progress bar rather than the default skeleton, so loading is announced to screen readers.
        slotProps={{ loadingOverlay: { variant: 'linear-progress', noRowsVariant: 'linear-progress' } }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        paginationModel={{ page, pageSize: paginationModel.pageSize }}
        onPaginationModelChange={setPaginationModel}
        // Alphabetical by user name until an admin sorts another column.
        initialState={{ sorting: { sortModel: [{ field: 'displayName', sort: 'asc' }] } }}
        disableRowSelectionOnClick
        autoHeight
        sx={DATAGRID_SX}
      />
    </Box>
  )
}
