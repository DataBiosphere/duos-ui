import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { User } from '../libs/ajax';
import { isNil } from 'lodash';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: 'yellow',
    '&.MuiTableSortLabel-active': {
      color: 'yellow',
    },
  },
}));



// const example = [
//   {
//     alias: 1,
//     darCode: "darCode1",
//     datasetName: "datasetName1",
//     dacName: "dacName1",
//     approvalDate: "approvalDate1",
//     datasetIdentifier: "datasetIdentifier1"
//   },
//   {
//     alias: 2,
//     darCode: 'darCode2',
//     datasetName: "datasetName2",
//     dacName: "dacName2",
//     approvalDate: "approvalDate2",
//     datasetIdentifier: "datasetIdentifier2"
//   }
// ];


// const rows = createRows()

// function createRows() {
//   const rows = []
//   example.map((exampleRow) => (
//     rows.push(createData(exampleRow.darCode, exampleRow.approvalDate, exampleRow.datasetIdentifier, exampleRow.datasetName, exampleRow.dacName))
//   ))
//   return rows
// }

function createData(darCode, approvalDate, datasetIdentifier, datasetName, dacName) {
  return {
    darCode,
    approvalDate,
    datasetIdentifier,
    datasetName,
    dacName
  };
}


const headCells = [
  {
    id: 'darCode',
    numeric: false,
    disablePadding: false,
    label: 'DAR Code',
  },
  {
    id: 'approvalDate',
    numeric: true,
    disablePadding: false,
    label: 'Approval Date',
  },
  {
    id: 'datasetIdentifier',
    numeric: true,
    disablePadding: false,
    label: 'Dataset Identifier',
  },
  {
    id: 'datasetName',
    numeric: true,
    disablePadding: false,
    label: 'Dataset Name',
  },
  {
    id: 'dacName',
    numeric: true,
    disablePadding: false,
    label: 'DAC Name',
  },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } =
    props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  // Inside your component
const theme = useTheme();

  const classes = useStyles();

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            // sx={{
            //   // color: '#626262',
            //   // fontFamily: 'Montserrat',
            //   // fontSize: '14px',
            //   // fontStyle: 'normal',
            //   // fontWeight: '600',
            //   // lineHeight: 'normal',
            //   '& .MuiButtonBase-root-MuiTableSortLabel-root-root.Mui-active': {
            //     color: 'green',
            // },
            // }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={{
                color: orderBy === headCell.id ? theme.palette.primary.main : theme.palette.text.primary,
                fontFamily: 'Montserrat',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: orderBy === headCell.id ? '600' : '400',
                lineHeight: 'normal'
              }}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export default function SortableTable() {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('darCode');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const userRows = await User.getApprovedDatasets();
        setRows(createRows(userRows));
        console.log("useEffect " + userRows)
      } catch (error) {
        console.error('Error  data:', error);
      }
    };
    init();
  }, [User.getApprovedDatasets]);

  function createRows(userRows) {
    return userRows.map((exampleRow) => createData(
      exampleRow.darCode,
      exampleRow.approvalDate,
      exampleRow.datasetIdentifier,
      exampleRow.datasetName,
      exampleRow.dacName
    ));
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };


  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };//

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      stableSort(rows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [order, orderBy, page, rows, rowsPerPage],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, fontFamily: 'Montserrat', fontSize: '100' }}>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size='medium'
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.name);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.name)}
                    tabIndex={-1}
                    key={row.datasetIdentifier}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                      sx={{ fontFamily: 'Montserrat', color: '#000', fontSize: '14px', fontWeight: '400' }}
                    >
                      {row.darCode}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Montserrat', color: '#000', fontSize: '14px', fontWeight: '400' }}
                      align="right">
                      {row.approvalDate}
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: 'Montserrat', color: '#000', fontSize: '14px', fontWeight: '400' }}
                      align="right">
                      {row.datasetIdentifier}
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: 'Montserrat', color: '#000', fontSize: '14px', fontWeight: '400' }}
                      align="right">
                      {row.datasetName}
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: 'Montserrat', color: '#000', fontSize: '14px', fontWeight: '400' }}
                      align="right">
                      {row.dacName}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: '#626262',
            fontFamily: 'Montserrat',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '600',
          }}
        />
      </Paper>
    </Box >
  );
}