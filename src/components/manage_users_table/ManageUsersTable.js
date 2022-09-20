import { useState, useEffect, Fragment, useCallback } from 'react';
import { h } from 'react-hyperscript-helpers';
import {isNil} from 'lodash/fp';
import { Styles } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import { recalculateVisibleTable, goToPage as updatePage, getSearchFilterFunctions, searchOnFilteredList } from '../../libs/utils';
import SimpleTable from '../SimpleTable';
import cellData from './ManageUsersTableCellData';

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    margin: '0.5% 0'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    backgroundColor: 'B8CDD3',
    border: 'none'
  }),
  cellWidth: {
    username: '20%',
    usernameMargin: '5%',
    email: '20%',
    emailMargin: '5%',
    institution: '20%',
    institutionMargin: '5%',
    perms: '20%',
  },
  color: {
    username: '#000000',
    email: '#000000',
    perms: '#000000',
  },
  fontSize: {
    username: '1.6rem',
    email: '1.4rem',
    perms: '1.4rem',
  },
};

const columnHeaderConfig = {
  username: {
    label: 'User Name',
    cellStyle: {
      width: styles.cellWidth.username,
      margin: `0% ${styles.cellWidth.usernameMargin} 0% 0%`
    },
    cellDataFn: cellData.usernameCellData,
    sortable: true
  },
  email: {
    label: 'Email',
    cellStyle: {
      width: styles.cellWidth.email,
      margin: `0% ${styles.cellWidth.emailMargin} 0% 0%`
    },
    cellDataFn: cellData.emailCellData,
    sortable: false
  },
  institution: {
    label: 'Insitution',
    cellStyle: {
      width: styles.cellWidth.institution,
      margin: `0% ${styles.cellWidth.institutionMargin} 0% 0%`
    },
    cellDataFn: cellData.institutionCellData,
    sortable: false
  },
  perms: {
    label: 'Permissions',
    cellStyle: {
      width: styles.cellWidth.perms,
    },
    cellDataFn: cellData.permissionsCellData,
    sortable: false
  },

};

const columns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = columns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const processUserRowData = ({ users, columns = columns }) => {
  if(!isNil(users)) {
    return users.map((user) => {
      const {
        roles,
        userId,
        displayName,
        libraryCards,
        institution,
        email
      } = user;
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          user, roles, userId, displayName, email, institution, libraryCards
        });
      });
    });
  }
};

const getInitialSort = (columns = []) => {
  const sort = {
    field: 'username',
    dir: -1
  };
  const sortIndex = columns.indexOf(sort.field);

  if (sortIndex !== -1) {
    return { colIndex: sortIndex, dir: sort.dir};
  }
  else {
    return { colIndex: 0, dir: 1 };
  }
};

const filterFn = getSearchFilterFunctions().users;

export const ManageUsersTable = function ManageUsersTable(props) {
  const {
    isLoading,
    userList,
    searchText
  } = props;

  const [filteredUsers, setFilteredUsers] = useState(userList);
  const [visibleUsers, setVisibleCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sort, setSort] = useState(getInitialSort(props.columns));
  const [tableSize, setTableSize] = useState(10);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    userList,
    filterFn,
    setFilteredUsers
  ), [userList]);

  useEffect(() => {
    handleSearchChange(searchText);
  }, [userList, searchText, handleSearchChange]);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processUserRowData({
        users:filteredUsers,
        columns,
      }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollections,
      sort
    });
  }, [tableSize, currentPage, pageCount, filteredUsers, sort]);

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      'rowData': visibleUsers,
      'columnHeaders': columnHeaderData(columns),
      styles,
      tableSize: tableSize,
      'paginationBar': h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      }),
      sort,
      onSort: (sort) => {
        setSort(sort);
      }
    }),
  ]);
};
