/*
Steps for using the SortableTable component:
Step 1: Create an array for the headCells prop
  - This array will contain the column labels
  - It should follow this format:

const headCells = [
  {
    id: 'id1',
    label: 'label1', // this will be displayed as the column name
  },
  {
    id: 'id2',
    label: 'label2',
  }
];

Step 2: Create an array for the rows prop
  - This array will contain the data that will be displayed in the table under the columns
  - It should follow this format:

const rows = [
  {
    id1: 'id1_value1', // use the id values from headCells for each item
    id2: 'id2_value1'
  },
  {
    id1: 'id1_value2',
    id2: 'id2_value2'
  },
  {
    id1: 'id1_value3',
    id2: 'id2_value3'
  }
];

Step 3: Pass both arrays into the headCells and rows props
  - Example: <SortableTable rows={rows} headCells={headCells}

*/

import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { ThemeProvider } from '@mui/material/styles';
import EnhancedTableHead from './EnhancedTableHead';
import { theme } from './Themes';

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

export default function SortableTable(props) {

  const {
    rows,
    headCells
  } = props;

  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('darCode');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
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
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const isSelected = (name) => selected.indexOf(name) !== -1;

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
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          width: '100%',
          fill: '#FFF',
          strokeWidth: '1px',
          stroke: '#ABABAB',
          filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))'
        }} >
        <Paper
          sx={{
            width: '100%',
            mb: 2,
            fontFamily: 'Montserrat',
            fontSize: '100'
          }} >
          <TableContainer>
            <Table>
              <EnhancedTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                headCells={headCells}
                sx={{ marginBottom: '15px' }} />
              <TableBody>
                {visibleRows.map((row, index) => {
                  const isItemSelected = isSelected(row.name);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.name)}
                      tabIndex={-1}
                      key={index}
                      selected={isItemSelected}>
                      {Object.keys(row).map((category) => (
                        <TableCell
                          key={category}
                          component='th'
                          id={labelId}
                          scope='row'
                          padding='none'
                          align='center'>
                          {row[category]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow
                    style={{
                      height: 53 * emptyRows,
                    }} >
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[]}
            component='div'
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage} />
        </Paper>
      </Box >
    </ThemeProvider>
  );
}