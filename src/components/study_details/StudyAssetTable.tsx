import React from 'react'
import { DataGrid, GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

interface Props<T extends GridValidRowModel> {
  id: string
  heading: string
  data?: T[]
  /** True only until the first response lands, so a background refetch keeps the rows on screen */
  isPending: boolean
  error?: unknown
  /** Both spelled out per section — a heading isn't a grammatical noun phrase, and verb
   *  agreement differs ('workspaces have' vs 'intellectual property has') */
  emptyMessage: string
  errorMessage: string
  columns: GridColDef<T>[]
  getRowId: (row: T) => string | number
}

const StudyAssetTable = <T extends GridValidRowModel>({
  id,
  heading,
  data = [],
  isPending,
  error,
  emptyMessage,
  errorMessage,
  columns,
  getRowId,
}: Props<T>) => (
  <StudyPageSection id={id} heading={heading}>
    <StudyQueryResult
      isPending={isPending}
      error={error}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
    >
      <DataGrid
        autoHeight
        hideFooter
        rows={data}
        columns={columns}
        getRowId={getRowId}
        disableRowSelectionOnClick
      />
    </StudyQueryResult>
  </StudyPageSection>
)

export default StudyAssetTable
