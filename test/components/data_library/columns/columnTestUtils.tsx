import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GridColDef, GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid'

export const makeMockParams = <T extends GridValidRowModel>(value: unknown, row: T): GridRenderCellParams<T> =>
  ({ value, row, id: 1, field: '', formattedValue: value, colDef: {}, api: {} } as unknown as GridRenderCellParams<T>)

export const makeRenderCellHelper = <T extends GridValidRowModel>(
  makeColumns: () => GridColDef[],
  makeRow: (overrides?: Partial<T>) => T,
) =>
  (field: string, value: unknown, rowOverrides: Partial<T> = {}) => {
    const col = makeColumns().find(c => c.field === field)!
    return render(
      <MemoryRouter>
        {col.renderCell!(makeMockParams(value, makeRow(rowOverrides))) as React.ReactElement}
      </MemoryRouter>,
    )
  }
