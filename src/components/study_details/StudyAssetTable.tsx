import React, { useMemo, useState } from 'react'
import { DataGrid, GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

/** Where this table's own row id is kept, alongside the asset's fields. */
const ROW_ID = '__studyAssetRowId'

/** The largest page the community DataGrid accepts; it throws above this. */
const ASSET_PAGE_SIZE = 100

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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: ASSET_PAGE_SIZE })

  const studyScopedColumns = useMemo(
    () => columns.filter(column => column.field !== 'studyName'),
    [columns],
  )

  return (
    <StudyPageSection id={id} heading={heading}>
      <StudyQueryResult
        isPending={isPending}
        // Only when there is nothing to show. A refetch that fails while rows are already on
        // screen leaves data intact and sets error; reporting that would replace a populated
        // table with a line of error text, which is the opposite of keeping the rows up.
        error={data.length === 0 ? error : undefined}
        isEmpty={data.length === 0}
        emptyMessage={emptyMessage}
        errorMessage={errorMessage}
      >
        <DataGrid
          autoHeight
          // The community grid always paginates and refuses a page size above 100, so the whole
          // list cannot be put on one page. hideFooter used to remove the controls regardless,
          // which left anything past the first page unreachable. The footer now appears exactly
          // when there is a further page to reach - no chrome on the small tables that are the
          // common case, and a way through the rest when a study has more.
          hideFooter={rows.length <= ASSET_PAGE_SIZE}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[ASSET_PAGE_SIZE]}
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
