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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useEffect } from 'react';
import { isEmpty } from 'lodash';
import { Checkbox } from '@mui/material';
import { useState } from 'react';

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

const CollapsibleRow = (props) => {
  const { row, row: { subtable: { rows: subrows } }, selected, selectHandler } = props;

  const [open, setOpen] = useState(false);

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const allSelected = subrows.every((row) => isSelected(row.id));
  const someSelected = subrows.some((row) => isSelected(row.id));

  return (
    <React.Fragment>
      {/* main table row */}
      <TableRow>
        <StyledTableCell>
          <Checkbox
            aria-label="select row"
            onClick={(event) => selectHandler(event, row, 'row')}
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
          />
        </StyledTableCell>
        <StyledTableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        {row.data.map((cell, i) => (
          <StyledTableCell key={i}>
            {cell.value}
          </StyledTableCell>
        ))}
      </TableRow>
      {/* subtable */}
      <TableRow>
        <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Table>
                {/* subtable header */}
                <TableHead>
                  <TableRow>
                    <StyledTableCell component="th" />
                    {row.subtable.headers.map((header, i) => (
                      <StyledTableCell key={i}>{header.value}</StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                {/* subtable rows */}
                <TableBody>
                  {subrows.map((subRow, j) => (
                    <TableRow key={j}>
                      <StyledTableCell>
                        <Checkbox
                          aria-label="select subtable row"
                          onClick={(event) => selectHandler(event, subRow, 'subrow')}
                          checked={isSelected(subRow.id)}
                        />
                      </StyledTableCell>
                      {subRow.data.map((cell, k) => (
                        <StyledTableCell key={k}>
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
    </React.Fragment>
  );
};

export const CollapsibleTable = (props) => {
  const { data, summary, isLoading, selected, selectHandler } = props;

  const [allSelected, setAllSelected] = useState(false);
  const [someSelected, setSomeSelected] = useState(false);

  useEffect(() => {
    const isSelected = (id) => selected.indexOf(id) !== -1;
    if (!isEmpty(data)) {
      setAllSelected(data.rows.every((row) => {
        return row.subtable.rows.every((subRow) => isSelected(subRow.id));
      }));
      setSomeSelected(data.rows.some((row) => {
        return row.subtable.rows.some((subRow) => isSelected(subRow.id));
      }));
    }
  }, [data, selected]);

  return !isLoading && !isEmpty(data) && (
    <TableContainer component={Paper}>
      <Table aria-label={summary}>
        {/* main table header */}
        <TableHead>
          <TableRow>
            <StyledTableCell component="th">
              <Checkbox
                aria-label="select all on page"
                onClick={(event) => selectHandler(event, data, 'all')}
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
              />
            </StyledTableCell>
            <StyledTableCell component="th" />
            {data.headers.map((header) => (
              <StyledTableCell key={header.value} component="th">{header.value}</StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        {/* main table rows */}
        <TableBody>
          {data.rows.map((row) => (
            <CollapsibleRow key={row.id} row={row} selected={selected} selectHandler={selectHandler} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CollapsibleTable;
