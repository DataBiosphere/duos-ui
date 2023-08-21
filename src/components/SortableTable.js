import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from '@mui/material/TableCell';
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TableSortLabel from "@mui/material/TableSortLabel";

export default function SortableTable(props) {

  const {
    rowNames,
    rows
  } = props

  const [rowData, setRowData] = useState(rows);
  const [rowHeaders, setRowHeaders] = useState(rowNames);

  // function createRowHeaders(rowNames) {
  //   const rowHeaders = []
  //   rowNames.forEach((rowName) => (
  //     rowHeaders.push(
  //       {
  //         rowHeader: rowName.ja,
  //         orderDirection: "asc"
  //       }
  //     )
  //   ))
  //   return rowHeaders
  // }

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }
    if (b[orderBy] > a[orderBy]) {
      return 1
    }
    return 0
  }
  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {rowHeaders.map((item, i) => (
              // item.sortable ? (
              //   <TableCell key={i} align="center" onClick={() => handleSortRequest(item.rowHeader)}>
              //     <TableSortLabel active={orderBy === item.rowHeader} direction={orderDirection}>
              //       {item.name}
              //     </TableSortLabel>
              //   </TableCell>
              // ) : (
                <TableCell key={i} align="right">{item.name}</TableCell>
              // )
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
            {Object.values(row).map((value, j) => (
              <TableCell key={j}>{value}</TableCell>
            ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
