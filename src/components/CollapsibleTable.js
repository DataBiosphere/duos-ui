import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useEffect, useState } from 'react';
import { isEmpty, isNil, map } from 'lodash/fp';

/*
The data should follow the following format:

const table = {
  headers: [
    {
      value: 'Header 1',
    },
    {
      value: 'Header 2',
    },
    {
      value: 'Header 3',
    },
  ],
  rows: [
    {
      id: 'Row 1',
      data: [
        {
          value: 'Row 1, Cell 1',
        },
        {
          value: 'Row 1, Cell 2',
        },
        {
          value: 'Row 1, Cell 3',
        }
      ],
      subtable: {
        headers: [
          {
            value: 'Sub header 1',
          },
          {
            value: 'Sub header 2',
          },
        ],
        rows: [
          {
            id: 'Sub Row 1',
            data: [
              {
                value: 'Sub Row 1, Cell 1',
              },
              {
                value: 'Sub Row 1, Cell 2',
              },
            ],
          },
          {
            id: 'Sub Row 2',
            data: [
              {
                value: 'Sub Row 2, Cell 1',
              },
              {
                value: 'Sub Row 2, Cell 2',
              },
            ],
          },
        ],
      }
    },
    {
      id: 'Row 2',
      data: [
        {
          value: 'Row 2, Cell 1',
        },
        {
          value: 'Row 2, Cell 2',
        },
        {
          value: 'Row 2, Cell 3',
        }
      ],
    },
  ],
};
*/

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    fontSize: '1.4rem',
    fontFamily: 'Montserrat',
    fontWeight: 600,
    backgroundColor: '#e2e8f4',
    textTransform: 'uppercase',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '1.4rem',
    fontFamily: 'Montserrat',
    fontWeight: 400,
  },
}));

const SubTable = (props) => {
  const { subtable, open } = props;
  //const [checked, setChecked] = useState([]);

  return (
    <TableRow>
      <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6} component="th">
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 2 }}>
            <Table>
              {/* subtable header */}
              <TableHead>
                <TableRow>
                  <StyledTableCell component="th">
                  </StyledTableCell>
                  {subtable.headers.map((header, i) => (
                    <StyledTableCell key={i}>{header.value}</StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              {/* subtable rows */}
              <TableBody>
                {subtable.rows.map((subRow, j) => (
                  <TableRow key={j}>
                    <StyledTableCell component="th">
                      <Checkbox
                        color="primary"
                        //onChange={onChange}
                      />
                    </StyledTableCell>
                    {subRow.data.map((cell, k) => (
                      <StyledTableCell key={k} component="th">
                        {cell.value}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </StyledTableCell>
    </TableRow>
  );
};

const CollapsibleRow = (props) => {
  const { row, checkSingleRow } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <StyledTableCell component="th">
          <Checkbox
            color="primary"
            aria-label="select"
            //onClick={checkAllSubComponents}
          />
        </StyledTableCell>
        <StyledTableCell component="th">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        {row.data.map((cell, i) => (
          <StyledTableCell key={i} component="th">
            {cell.value}
          </StyledTableCell>
        ))}
      </TableRow>
      <SubTable subtable={row.subtable} open={open} />
    </React.Fragment>
  );
};

export const CollapsibleTable = (props) => {
  const { data, summary, isLoading, selectAllOnPage, allOnPageSelected, checkSingleRow } = props;
  const [table, setTable] = React.useState([]);

  useEffect(() => {
    if (isLoading || isEmpty(data)) {
      return;
    }

    const innerTable = (
      <TableContainer component={Paper}>
        <Table aria-label={summary}>
          <TableHead>
            <TableRow>
              <StyledTableCell>
                <Checkbox
                  color="primary"
                  onClick={selectAllOnPage}
                  checked={allOnPageSelected}
                  inputProps={{
                    'aria-label': 'select all on page',
                  }}
                />
              </StyledTableCell>
              <StyledTableCell />
              {data.headers.map((header) => (
                <StyledTableCell key={header.value}>{header.value}</StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row) => (
              <CollapsibleRow checkSingleRow={checkSingleRow} key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    setTable(innerTable);
  }, [isLoading, data, summary]);

  return table;
};

export default CollapsibleTable;
