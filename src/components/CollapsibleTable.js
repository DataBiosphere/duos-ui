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
      borderRadius: '12.5% 0 0 12.5%',
    },
    '&:last-child': {
      borderRight: '1px solid black',
      borderRadius: '0 5% 5% 0',
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

const CollapsibleRow = (props) => {
  const { row, row: { subtable: { rows: subrows } }, selected, selectHandler } = props;

  const [open, setOpen] = useState(false);

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const allSelected = subrows.every((row) => isSelected(row.id));
  const someSelected = subrows.some((row) => isSelected(row.id));

  return (
    <div className='test'>
      {/* main table row */}
      <StyledTableRow>
        {/* <Stack> */}
          {/* <React.Fragment> */}
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
            {row.data.map((cell, i) => {
              return <TableCellRenderer key={i} cell={cell} />;
            })}

          {/* </React.Fragment> */}
          {/* <Box>Hello</Box> */}
        {/* </Stack> */}
      </StyledTableRow>
      <TableRow sx={{paddingLeft: '50px'}}>
        <StyledSubtableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell component="th" />
                    {row.subtable.headers.map((header, i) => (
                      <StyledTableCell key={i}>{header.value}</StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subrows.map((subRow, j) => (
                    <TableRow key={j}>
                      <TableCell>
                        <Checkbox
                          aria-label="select subtable row"
                          onClick={(event) => selectHandler(event, subRow, 'subrow')}
                          checked={isSelected(subRow.id)}
                        />
                      </TableCell>
                      {subRow.data.map((cell, k) => {
                        return <StyledTableCell key={k}>{cell.value}</StyledTableCell>
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            
          </Collapse>
        </StyledSubtableCell>
      </TableRow>
    </div>
  );
};

export const CollapsibleTable = (props) => {
  const { data, summary, selected, selectHandler } = props;

  const [allSelected, setAllSelected] = useState(false);
  const [someSelected, setSomeSelected] = useState(false);

  useEffect(() => {
    const isSelected = (id) => selected.indexOf(id) !== -1;
    if (!isEmpty(data) && !isEmpty(data.rows)) {
      setAllSelected(data.rows.every((row) => {
        return row.subtable.rows.every((subRow) => isSelected(subRow.id));
      }));
      setSomeSelected(data.rows.some((row) => {
        return row.subtable.rows.some((subRow) => isSelected(subRow.id));
      }));
    }
  }, [data, selected]);

  return !isEmpty(data) && (
    <TableContainer>
      <StyledTable aria-label={summary}>
        {/* main table header */}
        <TableHead>
          <StyledTableHeaderRow>
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
          </StyledTableHeaderRow>
        </TableHead>
        {/* main table rows */}
        <StyledTableBody>
          {data.rows.map((row) => (
            <CollapsibleRow key={row.id} row={row} selected={selected} selectHandler={selectHandler} />
          ))}
        </StyledTableBody>
      </StyledTable>
    </TableContainer>
  );
};

export default CollapsibleTable;

const TableCellRenderer = ({ cell }) => {

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);

  if (cell?.hideUnderIcon) {
    return (
      <StyledTableCell>
        <ArticleOutlinedIcon
          aria-owns={popoverOpen ? 'mouse-over-popover' : undefined}
          aria-haspopup="true"
          onMouseEnter={handlePopoverOpen}
          onMouseLeave={handlePopoverClose}
          sx={{ color: '#0948B7' }}
        />
        <Popover
          id="mouse-over-popover"
          sx={{
            pointerEvents: 'none',
          }}
          open={popoverOpen}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
        >
          <Typography sx={{ p: 1, fontFamily: 'Montserrat', fontSize: '14px', maxWidth: '80rem' }}>
            {cell.value}
          </Typography>
        </Popover>
      </StyledTableCell>
    );
  }

  if (cell?.truncate && cell?.increaseWidth) {
    return <TruncatedTableCell style={{ maxWidth: '30ch' }}>
      {cell.value}
    </TruncatedTableCell>;
  }

  if (cell?.truncate) {
    return <TruncatedTableCell>
      {cell.value}
    </TruncatedTableCell>;
  }

  if (cell?.increaseWidth) {
    return <StyledTableCell style={{ width: '37ch' }}>
      {cell.value}
    </StyledTableCell>;
  }

  // Default case:
  return <StyledTableCell>
    {cell.value}
  </StyledTableCell>;
};

const SubtableCellRenderer = ({ cell }) => {

  if (cell?.increaseWidth) {
    return <StyledTableCell style={{ width: '15ch' }}>
      {cell.value}
    </StyledTableCell>;
  }

  // Default case:
  return <StyledTableCell>
    {cell.value}
  </StyledTableCell>;

};
