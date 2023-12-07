import React, { useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Table, { tableClasses } from '@mui/material/Table';
import TableBody, { tableBodyClasses } from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { isEmpty } from 'lodash';
import { Checkbox } from '@mui/material';

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
          truncate: true,
        },
        {
          value: 'Row 1, Cell 2',
          truncate: false,
        },
        {
          value: 'Row 1, Cell 3',
          truncate: false,
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

const StyledTable = styled(Table)(() => ({
  borderCollapse: 'separate',
  borderSpacing: '0 15px'
}));

const StyledTableBody = styled(TableBody)(() => ({
  "& > :not(:last-child)": {
    // borderBottom: "3px solid white"
  }
}));

const StyledTableHeaderRow = styled(TableRow)(() => ({
  [`&.${tableRowClasses.root}`]: {
    height: '40px',
    border: '1px solid black',
    borderBottom: '1px solid black',
    padding: '5px',
    borderSpacing: '5em',
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  [`&.${tableRowClasses.root}`]: {
    height: '57px',
    border: '1px solid black',
    borderBottom: '1px solid black',
    padding: '5px',
    borderSpacing: '5em',
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  borderBottom: 'none',
  [`&.${tableCellClasses.head}`]: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '16px',
    backgroundColor: '#e2e8f4',
    textTransform: 'uppercase',
    borderBottom: '1px solid green'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '14px',
    lineHeight: '24px',
    fontFamily: 'Montserrat',
    fontWeight: 400,
    color: '#333F52',
    letterSpacing: 0,
  },
  [`&.${tableCellClasses.root}`]: {
    width: '150px',
    textAlign: 'center',
    borderTop: '1px solid black',
    // borderRadius: '25%',
    borderBottom: '1px solid black',
    padding: '5px',
    '&:first-child': {
      borderLeft: '1px solid black',
      // borderRadius: '12.5% 0 0 12.5%',
    },
    '&:last-child': {
      borderRight: '1px solid black',
      // borderRadius: '0 5% 5% 0',
    },
  },
}));

const StyledSubtableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '16px',
    backgroundColor: '#e2e8f4',
    textTransform: 'uppercase',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '14px',
    lineHeight: '24px',
    fontFamily: 'Montserrat',
    fontWeight: 400,
    color: '#333F52',
    letterSpacing: 0,
  },
  [`&.${tableCellClasses.root}`]: {
    width: '150px',
    textAlign: 'center',
    borderTop: 'none',
    // borderRadius: '25%',
    borderBottom: 'none',
    padding: '5px',
  },
}));

const TruncatedTableCell = styled(StyledTableCell)(() => ({
  [`&.${tableCellClasses.root}`]: {
    // padding: '8px',
    maxWidth: '20ch',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'max-width 0.5s',
    '&:hover': {
      whiteSpace: 'normal',
      overflow: 'normal',
      wordBreak: 'break-all'
    },
  },
}));

const CollapsibleRow = () => {

  return (
    <React.Fragment className='test' sx={{border: '1px solid black'}}>
      <TableRow >
        <TableCell sx={{borderTop: '10px solid black'}}>
          Hello1
        </TableCell>
        <TableCell sx={{borderTop: '10px solid black'}}>
          Hello2
        </TableCell>
        <TableCell sx={{borderTop: '10px solid black'}}>
          Hello3
        </TableCell>
      </TableRow>
      <TableRow sx={{borderBottom: '10px solid black'}}>
        <TableCell colSpan={3}>
          <Table>
            <TableRow>
              <TableCell sx={{borderBottom: '10px solid black'}}>
                Hello1
              </TableCell>
              <TableCell sx={{borderBottom: '10px solid black'}}>
                Hello1
              </TableCell>
              <TableCell sx={{borderBottom: '10px solid black'}}>
                Hello1
              </TableCell>
            </TableRow>
          </Table>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export const HealthCheck = () => {

  return (
    <TableContainer sx={{ width: '75%', justifyContent: 'center' }}>
      <StyledTable>
        <TableHead>
          <StyledTableHeaderRow>
            <StyledTableCell component="th">
              Title1
            </StyledTableCell>
            <StyledTableCell component="th">
              Title2
            </StyledTableCell>
            <StyledTableCell component="th">
              Title3
            </StyledTableCell>
          </StyledTableHeaderRow>
        </TableHead>
        <StyledTableBody>
          <CollapsibleRow />
          <CollapsibleRow />

        </StyledTableBody>
      </StyledTable>
    </TableContainer>
  );
};

export default HealthCheck;
