import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { isNil } from 'lodash'
import PaginationBar from '../PaginationBar'
import { recalculateVisibleTable, goToPage as updatePage, getSearchFilterFunctions, searchOnFilteredList } from '../../libs/utils'
import SimpleTable from '../SimpleTable'
import cellData from './ManageUsersTableCellData'
import { styles } from './manageUsersTableUtils'

const columnHeaderConfig = {
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
    label: 'Permissions',
    cellStyle: {
      width: styles.cellWidth.perms,
    },
    cellDataFn: cellData.permissionsCellData,
    sortable: false,
  },

}

const columns = Object.keys(columnHeaderConfig)

const columnHeaderData = (columns = columns) => {
  return columns.map(col => columnHeaderConfig[col])
}

const processUserRowData = ({ users, columns = columns }) => {
  if (!isNil(users)) {
    return users.map((user) => {
      const {
        roles,
        userId,
        displayName,
        libraryCard,
        institution,
        email,
      } = user
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          user, roles, userId, displayName, email, institution, libraryCard,
        })
      })
    })
  }
}

const getInitialSort = (columns = []) => {
  const sort = {
    field: 'username',
    dir: -1,
  }
  const sortIndex = columns.indexOf(sort.field)

  if (sortIndex !== -1) {
    return { colIndex: sortIndex, dir: sort.dir }
  }
  else {
    return { colIndex: 0, dir: 1 }
  }
}

const filterFn = getSearchFilterFunctions().users

export const ManageUsersTable = function ManageUsersTable(props) {
  const {
    isLoading,
    userList,
    searchText,
  } = props

  const [filteredUsers, setFilteredUsers] = useState(userList)
  const [visibleUsers, setVisibleCollections] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value)
    }
  }, [])

  const handleSearchChange = useCallback(searchTerms => searchOnFilteredList(
    searchTerms,
    userList,
    filterFn,
    setFilteredUsers,
  ), [userList])

  useEffect(() => {
    handleSearchChange(searchText)
  }, [userList, searchText, handleSearchChange])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processUserRowData({
        users: filteredUsers,
        columns,
      }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollections,
      sort,
    })
  }, [tableSize, currentPage, pageCount, filteredUsers, sort])

  // Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage)
    },
    [pageCount],
  )

  return (
    <>
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
        onSort={(sort) => {
          setSort(sort)
        }}
      />
    </>
  )
}
