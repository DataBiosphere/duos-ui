import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Box } from '@mui/material';

const DatasetRowMaterial = (props) => {
  const { columns, data } = props;
  
  const table = useMaterialReactTable({
      columns,
      data,
      enableColumnFilters: false,
      enablePagination: false,
      enableSorting: false,
      enableRowSelection: true,
  });
  return <MaterialReactTable table={table} />;
};

const DatasetTableMaterial = (props) => {
  const { columns, subColumns, data } = props;

  const table = useMaterialReactTable({
    columns,
    data,
    enableRowSelection: true,
    initialState: {
      pagination: { pageSize: 100, pageIndex: 0 },
      showGlobalFilter: true,
    },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100],
      variant: 'outlined',
    },
    renderDetailPanel: ({ row }) => {
      return <Box>
        <DatasetRowMaterial columns={subColumns} data={row.original.datasets} />
      </Box>
    }
  });
  return <MaterialReactTable table={table} />;
};

export default DatasetTableMaterial;
