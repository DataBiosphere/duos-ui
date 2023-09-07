import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Notifications} from '../../libs/utils';
import loadingIndicator from '../../images/loading-indicator.svg';
import {ThemeProvider} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import EnhancedTableHead from '../../components/sortable_table/EnhancedTableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import {TableTheme} from './DataSubmitterTheme';


export default function DataSubmitterDatasetsTable(props) {

  const spinner = <div style={{textAlign: 'center', height: '44', width: '180'}}>
    <img src={loadingIndicator} alt={'Loading'}/>
  </div>;

  const columns = [
    {
      id: 'datasetIdentifier',
      numeric: false,
      disablePadding: false,
      label: 'Dataset Identifier',
    }
  ];

  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('datasetIdentifier');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Datasets can be filtered from the parent component and redrawn frequently.
  const redrawRows = useCallback(() => {
    const rows = datasets.map((dataset) => {
      return {datasetIdentifier: dataset.datasetIdentifier};
    });
    setRows(rows);
  }, [datasets]);

  useEffect(() => {
    const init = async () => {
      try {
        setDatasets(props.datasets);
        setIsLoading(props.isLoading);
        redrawRows();
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve datasets from server'});
      }
    };
    init();
  }, [props, redrawRows]);

  const table = <ThemeProvider theme={TableTheme()}>
    <Box
      sx={{
        width: '100%',
        fill: '#FFF',
        strokeWidth: '1px',
        stroke: '#ABABAB',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        marginTop: 4,
        marginLeft: 4
      }}>
      <Paper
        sx={{
          width: '100%',
          mb: 2,
          fontFamily: 'Montserrat',
          fontSize: '100'
        }}>
        <TableContainer>
          <Table>
            <EnhancedTableHead
              headCells={columns}
              sx={{marginBottom: '15px'}}
              onRequestSort={handleRequestSort}
              order={order}
              orderBy={orderBy}/>
            <TableBody>
              {rows.map((row, index) => {
                // const isItemSelected = isSelected(row.name);
                const labelId = `enhanced-table-checkbox-${index}`;
                return (<TableRow
                  hover
                  tabIndex={-1}
                  key={row.datasetIdentifier}>
                  <TableCell
                    component='th'
                    id={labelId}
                    scope='row'
                    padding='none'>
                    {row.datasetIdentifier}
                  </TableCell>
                </TableRow>);
              })
              }
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[]}
          component='div'
          count={rows.length}
          rowsPerPage={10}
          page={0}
          onPageChange={() => {}}/>
      </Paper>
    </Box>
  </ThemeProvider>;

  return isLoading ? spinner : table;
}