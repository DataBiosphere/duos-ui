import * as React from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

const DatasetTableMaterial = (props) => {
  const { columns, data } = props;
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
  });
  return <MaterialReactTable table={table} />;
};

export default DatasetTableMaterial;
