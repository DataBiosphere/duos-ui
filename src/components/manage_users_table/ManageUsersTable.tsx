import { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid'
import { Link } from 'react-router'
import { getSearchFilterFunctions } from 'src/libs/utils'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { dacNameMap, formatUserDacs, formatUserRoles, institutionName, UserDac, userDacs } from 'src/components/manage_users_table/manageUsersTableUtils'
import { DacObject, DuosUser } from 'src/types/model'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

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
    // One DAC per line, so every link is visible and followable however many a user belongs to.
    renderCell: ({ row, tabIndex }: GridRenderCellParams<UserRow>) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {row.dacDetails.length === 0
          ? 'None'
          : row.dacDetails.map(dac => (
              <Link key={dac.dacId} to={`/manage_dac/${dac.dacId}`} tabIndex={tabIndex}>
                {dac.name}
              </Link>
            ))}
      </Box>
    ),
  },
]

const GROW_ROW_TO_FIT_CONTENT = () => 'auto' as const

// An auto-height cell lays its content out itself, so the padding and centering the fixed row height
// used to supply have to be spelled out.
const AUTO_HEIGHT_DATA_GRID_SX = {
  ...DATA_GRID_SX,
  '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', paddingY: 1 },
}

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
    <Box sx={DATA_GRID_CONTAINER_SX}>
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
        // A row grows to fit its DACs column, rather than clipping every DAC after the first.
        getRowHeight={GROW_ROW_TO_FIT_CONTENT}
        sx={AUTO_HEIGHT_DATA_GRID_SX}
      />
    </Box>
  )
}
