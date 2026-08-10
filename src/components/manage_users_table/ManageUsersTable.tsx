import React, { useState, useEffect, useCallback } from 'react'
import PaginationBar from '../PaginationBar'
import {
  recalculateVisibleTable,
  goToPage as updatePage,
  getSearchFilterFunctions,
  searchOnFilteredList,
} from 'src/libs/utils'
import SimpleTable from '../SimpleTable'
import cellData from './ManageUsersTableCellData'
import { styles } from './manageUsersTableUtils'
import { DuosUser } from 'src/types/model'

interface SortConfig {
  colIndex: number
  dir: number
}

interface TableCellData {
  data: React.ReactNode
  value?: string | number
  id?: number
  style?: React.CSSProperties
  label?: string
  isComponent?: boolean
}

interface CellDataArgs {
  user: DuosUser
  roles: DuosUser['roles']
  userId: number
  displayName: string
  email: string
  institution: DuosUser['institution']
  libraryCard: DuosUser['libraryCard']
}

interface ColumnConfig {
  label: string
  cellStyle: React.CSSProperties
  cellDataFn: (args: CellDataArgs) => TableCellData
  sortable: boolean
}

export interface ManageUsersTableProps {
  isLoading: boolean
  userList: DuosUser[]
  searchText: string
  columns?: string[]
}

const columnHeaderConfig: Record<string, ColumnConfig> = {
  username: {
    label: 'User Name',
    cellStyle: {
      width: styles.cellWidth.username,
      margin: `0% ${styles.cellWidth.usernameMargin} 0% 0%`,
    },
    cellDataFn: cellData.usernameCellData,
    sortable: true,
  },
  email: {
    label: 'Email',
    cellStyle: {
      width: styles.cellWidth.email,
      margin: `0% ${styles.cellWidth.emailMargin} 0% 0%`,
    },
    cellDataFn: cellData.emailCellData,
    sortable: false,
  },
  institution: {
    label: 'Institution',
    cellStyle: {
      width: styles.cellWidth.institution,
      margin: `0% ${styles.cellWidth.institutionMargin} 0% 0%`,
    },
    cellDataFn: cellData.institutionCellData,
    sortable: false,
  },
  perms: {
    label: 'Roles',
    cellStyle: {
      width: styles.cellWidth.perms,
    },
    cellDataFn: cellData.rolesCellData,
    sortable: false,
  },
}

const columns = Object.keys(columnHeaderConfig)

const columnHeaderData = (cols: string[]): ColumnConfig[] => cols.map(col => columnHeaderConfig[col])

const processUserRowData = (users: DuosUser[], cols: string[]): TableCellData[][] =>
  users.map((user) => {
    const { roles, userId, displayName, libraryCard, institution, email } = user
    return cols.map(col =>
      columnHeaderConfig[col].cellDataFn({ user, roles, userId, displayName, email, institution, libraryCard }),
    )
  })

const getInitialSort = (cols: string[] = []): SortConfig => {
  const defaultField = 'username'
  const sortIndex = cols.indexOf(defaultField)
  return sortIndex === -1 ? { colIndex: 0, dir: 1 } : { colIndex: sortIndex, dir: -1 }
}

const filterFn = getSearchFilterFunctions().users

export const ManageUsersTable = function ManageUsersTable({
  isLoading,
  userList,
  searchText,
  columns: columnsProp,
}: ManageUsersTableProps) {
  const [filteredUsers, setFilteredUsers] = useState<DuosUser[]>(userList)
  const [visibleUsers, setVisibleUsers] = useState<TableCellData[][]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState<SortConfig>(getInitialSort(columnsProp))
  const [tableSize, setTableSize] = useState(10)

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(value)) {
      setTableSize(value)
    }
  }, [])

  const handleSearchChange = useCallback(
    (searchTerms: string) => searchOnFilteredList(searchTerms, userList, filterFn, setFilteredUsers),
    [userList],
  )

  useEffect(() => {
    handleSearchChange(searchText)
  }, [userList, searchText, handleSearchChange])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processUserRowData(filteredUsers, columns),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleUsers,
      sort,
    })
  }, [tableSize, currentPage, pageCount, filteredUsers, sort])

  const goToPage = useCallback(
    (value: number) => updatePage(value, pageCount, setCurrentPage),
    [pageCount],
  )

  return (
    <SimpleTable
      isLoading={isLoading}
      rowData={visibleUsers}
      columnHeaders={columnHeaderData(columns)}
      styles={styles}
      tableSize={tableSize}
      paginationBar={(
        <PaginationBar
          pageCount={pageCount}
          currentPage={currentPage}
          tableSize={tableSize}
          goToPage={goToPage}
          changeTableSize={changeTableSize}
        />
      )}
      sort={sort}
      onSort={(newSort: SortConfig) => setSort(newSort)}
    />
  )
}
