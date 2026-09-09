import React, { useMemo } from 'react'
import { DataGrid, GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

/** Where this table's own row id is kept, alongside the asset's fields. */
const ROW_ID = '__studyAssetRowId'

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
}: Props<T>) => {
  // The row's position, not the asset's own id: registered ids are submitter-supplied and
  // frequently blank ("" for every model and publication in production data), and two equal
  // ids are one id to the grid, which renders a single row for two distinct assets. Nothing
  // here needs the asset's identity — the grid has no selection, editing or paging.
  const rows = useMemo(
    () => data.map((row, index) => ({ ...row, [ROW_ID]: `${id}-${index}` })),
    [data, id],
  )

  // Every reused column set carries a Study column, because the data library lists these assets
  // across all studies. On a page about one study it is redundant, and these endpoints return
  // the registration JSON, which has no study name to put in it.
  const studyScopedColumns = useMemo(
    () => columns.filter(column => column.field !== 'studyName'),
    [columns],
  )

  return (
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
          rows={rows}
          columns={studyScopedColumns}
          getRowId={row => row[ROW_ID]}
          disableRowSelectionOnClick
        />
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyAssetTable
