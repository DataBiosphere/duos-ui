import React, { Fragment, useCallback, useMemo, useState } from 'react'
import { DataGrid, GridPaginationModel, GridSortDirection, GridSortModel } from '@mui/x-data-grid'
import { Box, CircularProgress } from '@mui/material'
import { Storage } from 'src/libs/storage'
import { isNil, toLower, uniq } from 'src/utils/NodashUtil'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'
import { buildDarCollectionGridRows, makeDarCollectionColumns } from 'src/components/dar_collection_table/DarCollectionGridColumns'
import { useDarCollectionDataUseBuckets } from 'src/components/dar_collection_table/useDarCollectionDataUseBuckets'
import CollectionConfirmationModal from 'src/components/dar_collection_table/CollectionConfirmationModal'
import { DarCollectionSummary } from 'src/types/model'

export interface DarCollectionTableProps {
  collections?: DarCollectionSummary[]
  columns?: string[]
  isLoading?: boolean
  cancelCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  reviseCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  openCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  goToVote?: (collectionId: number) => void
  consoleType?: string
  deleteDraft?: ((collection: DarCollectionSummary) => Promise<void>) | null
  approveCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
}

const storageDarCollectionSort = 'storageDarCollectionSort'

interface StoredSort {
  field: string
  dir: number
}

const defaultColumns = [
  DarCollectionTableColumnOptions.DAR_CODE,
  DarCollectionTableColumnOptions.DAC,
  DarCollectionTableColumnOptions.NAME,
  DarCollectionTableColumnOptions.SUBMISSION_DATE,
  DarCollectionTableColumnOptions.RESEARCHER,
  DarCollectionTableColumnOptions.INSTITUTION,
  DarCollectionTableColumnOptions.DATASET_COUNT,
  DarCollectionTableColumnOptions.DATA_USE,
  DarCollectionTableColumnOptions.EXPIRES_AT,
  DarCollectionTableColumnOptions.STATUS,
  DarCollectionTableColumnOptions.ACTIONS,
]

const getInitialSortModel = (columns: string[]): GridSortModel => {
  const stored = Storage.getCurrentUserSettings<StoredSort>(storageDarCollectionSort)
    ?? { field: DarCollectionTableColumnOptions.SUBMISSION_DATE, dir: -1 }
  const field = columns.includes(stored.field) ? stored.field : columns[0]
  return field ? [{ field, sort: stored.dir === -1 ? 'desc' : 'asc' }] : []
}

// Sorting/pagination run in DataGrid's "server" mode (self-managed): DataGrid never
// reorders or slices `rows` on its own, since row spanning requires each collection's
// data-use rows to stay contiguous and never be split across a page boundary.
const getSortValue = (field: string, row: DarCollectionSummary): string | number => {
  switch (field) {
    case DarCollectionTableColumnOptions.DAR_CODE:
      return row.darCode ?? ''
    case DarCollectionTableColumnOptions.DAC:
      return uniq(row.dacNames).join(', ')
    case DarCollectionTableColumnOptions.NAME:
      return row.name ?? ''
    case DarCollectionTableColumnOptions.SUBMISSION_DATE:
      return (isNil(row.submissionDate) || toLower(String(row.submissionDate)) === 'unsubmitted')
        ? -Infinity
        : Number(row.submissionDate)
    case DarCollectionTableColumnOptions.RESEARCHER:
      return row.researcherName ?? ''
    case DarCollectionTableColumnOptions.INSTITUTION:
      return row.institutionName ?? ''
    case DarCollectionTableColumnOptions.DATASET_COUNT:
      return row.datasetCount ?? 0
    case DarCollectionTableColumnOptions.EXPIRES_AT:
      return isNil(row.expiresAt) ? -Infinity : row.expiresAt
    case DarCollectionTableColumnOptions.STATUS:
      return row.status ?? ''
    default:
      return 0
  }
}

const sortDarCollections = (
  collections: DarCollectionSummary[],
  field: string,
  direction: GridSortDirection,
): DarCollectionSummary[] => {
  const multiplier = direction === 'desc' ? -1 : 1
  return [...collections].sort((a, b) => {
    const aValue = getSortValue(field, a)
    const bValue = getSortValue(field, b)
    if (aValue < bValue) return -1 * multiplier
    if (aValue > bValue) return 1 * multiplier
    return 0
  })
}

const LoadingOverlay = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
)

export const DarCollectionTable = function DarCollectionTable(props: DarCollectionTableProps) {
  const {
    collections, columns = defaultColumns, isLoading, cancelCollection, reviseCollection,
    openCollection, goToVote, consoleType = '', deleteDraft, approveCollection,
  } = props

  const [sortModel, setSortModel] = useState<GridSortModel>(() => getInitialSortModel(columns))
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<DarCollectionSummary>({} as DarCollectionSummary)
  const [consoleAction, setConsoleAction] = useState<string | undefined>()

  const isUnfilteredView = consoleType === consoleTypes.ADMIN
    || consoleType === consoleTypes.RESEARCHER
    || consoleType === consoleTypes.SIGNING_OFFICIAL

  const showConfirmationModal = useCallback((collectionSummary: DarCollectionSummary, action = '') => {
    setConsoleAction(action)
    setSelectedCollection(collectionSummary)
    setShowConfirmation(true)
  }, [])

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model)
    if (model[0]) {
      Storage.setCurrentUserSettings(storageDarCollectionSort, {
        field: model[0].field,
        dir: model[0].sort === 'desc' ? -1 : 1,
      })
    }
  }, [])

  const sortedCollections = useMemo(() => {
    if (isNil(collections)) return []
    return sortModel[0] ? sortDarCollections(collections, sortModel[0].field, sortModel[0].sort) : collections
  }, [collections, sortModel])

  // Pagination is done by collection, not by grid row, so that one collection's data-use
  // rows are never split across a page boundary (which would break row spanning).
  const pagedCollections = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize
    return sortedCollections.slice(start, start + paginationModel.pageSize)
  }, [sortedCollections, paginationModel])

  const visibleCollectionIds = useMemo(
    () => pagedCollections.map(c => c.darCollectionId),
    [pagedCollections],
  )

  const bucketsByCollectionId = useDarCollectionDataUseBuckets(visibleCollectionIds, isUnfilteredView)

  const rows = useMemo(
    () => buildDarCollectionGridRows(pagedCollections, bucketsByCollectionId),
    [pagedCollections, bucketsByCollectionId],
  )

  const currentUser = useMemo(() => Storage.getCurrentUser(), [])

  const gridColumns = useMemo(() => makeDarCollectionColumns(columns, {
    consoleType,
    goToVote,
    showConfirmationModal,
    currentUser,
  }), [columns, consoleType, goToVote, showConfirmationModal, currentUser])

  return (
    <Fragment>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={rows}
          getRowId={row => row.id}
          columns={gridColumns}
          loading={isLoading}
          rowHeight={56}
          rowSpanning
          sortingMode="server"
          sortingOrder={['asc', 'desc']}
          paginationMode="server"
          rowCount={sortedCollections.length}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{ loadingOverlay: LoadingOverlay }}
          sx={{
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          }}
        />
      </Box>
      <CollectionConfirmationModal
        collection={selectedCollection}
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        cancelCollection={cancelCollection ?? (() => Promise.resolve())}
        reviseCollection={reviseCollection}
        openCollection={openCollection ?? (() => Promise.resolve())}
        deleteDraft={deleteDraft ?? (() => Promise.resolve())}
        consoleAction={consoleAction}
        approveCollection={approveCollection ?? (() => Promise.resolve())}
      />
    </Fragment>
  )
}
