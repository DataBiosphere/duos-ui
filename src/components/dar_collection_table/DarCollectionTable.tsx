import React, { useState, useEffect, Fragment, useCallback } from 'react'
import { cloneDeep, isNil } from 'src/utils/NodashUtil'
import { DarCollectionTableColumnOptions, styles, consoleTypes } from 'src/utils/DarCollectionUtils'
import { Storage } from 'src/libs/storage'
import PaginationBar from 'src/components/PaginationBar'
import { recalculateVisibleTable, goToPage as updatePage, Notifications } from 'src/libs/utils'
import SimpleTable, { type RowWrapperArgs } from 'src/components/SimpleTable'
import cellData, { type CellData } from 'src/components/dar_collection_table/DarCollectionTableCellData'
import CollectionConfirmationModal from 'src/components/dar_collection_table/CollectionConfirmationModal'
import 'src/components/dar_collection_table/dar_collection_table.css'
import { DarDatasetTable } from 'src/components/dar_dataset_table/DarDatasetTable'
import { Collections } from 'src/libs/ajax/Collections'
import { type DarCollection, DarCollectionSummary } from 'src/types/model'

interface SortConfig {
  colIndex: number
  dir: number
}

interface CollectionCellFnArgs {
  collection: DarCollectionSummary
  darCollectionId: number
  datasetIds: number[]
  darCode: string
  status: string
  name: string
  submissionDate: number
  researcherName: string
  institutionName: string
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
  consoleType: string
  goToVote?: (collectionId: number) => void
  relevantDatasets?: unknown
  actions?: string[]
  dacNames: string[]
  collectionIsExpanded: boolean
  updateCollectionIsExpanded: (val: boolean) => void
  label?: string
}

interface ColumnConfig {
  label: string
  cellStyle: React.CSSProperties
  cellDataFn: (args: CollectionCellFnArgs) => CellData
  sortable?: boolean
}

export interface DarCollectionTableProps {
  collections?: DarCollectionSummary[]
  columns?: string[]
  isLoading?: boolean
  cancelCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  reviseCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  openCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  goToVote?: (collectionId: number) => void
  consoleType?: string
  relevantDatasets?: unknown
  deleteDraft?: ((collection: DarCollectionSummary) => Promise<void>) | null
  approveCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
}

interface ProcessCollectionRowDataArgs {
  collections?: DarCollectionSummary[]
  collectionIsExpanded: (id: number) => boolean
  updateCollectionIsExpandedById: (id: number, val: boolean) => void
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
  columns?: string[]
  consoleType?: string
  goToVote?: (collectionId: number) => void
  relevantDatasets?: unknown
}

const storageDarCollectionSort = 'storageDarCollectionSort'

const columnHeaderConfig: Record<string, ColumnConfig> = {
  darCode: {
    label: 'DAR Code',
    cellStyle: { width: styles.cellWidth.darCode },
    cellDataFn: cellData.darCodeCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  dacNames: {
    label: 'DAC',
    cellStyle: { width: styles.cellWidth.dacNames },
    cellDataFn: cellData.DacCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  name: {
    label: 'Title',
    cellStyle: { width: styles.cellWidth.projectTitle },
    cellDataFn: cellData.projectTitleCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  submissionDate: {
    label: 'Submission Date',
    cellStyle: { width: styles.cellWidth.submissionDate },
    cellDataFn: cellData.submissionDateCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  researcher: {
    label: 'Researcher',
    cellStyle: { width: styles.cellWidth.researcher },
    cellDataFn: cellData.researcherCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  institution: {
    label: 'Institution',
    cellStyle: { width: styles.cellWidth.institution },
    cellDataFn: cellData.institutionCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  datasetCount: {
    label: 'Datasets',
    cellStyle: { width: styles.cellWidth.datasetCount },
    cellDataFn: cellData.datasetCountCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  expiresAt: {
    label: 'Expiration Date',
    cellStyle: { width: styles.cellWidth.expirationDate },
    cellDataFn: cellData.expiresAtCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  status: {
    label: 'Status',
    cellStyle: { width: styles.cellWidth.status },
    cellDataFn: cellData.statusCellData as (args: CollectionCellFnArgs) => CellData,
    sortable: true,
  },
  actions: {
    label: 'Action',
    cellStyle: { width: styles.cellWidth.actions },
    cellDataFn: cellData.consoleActionsCellData as (args: CollectionCellFnArgs) => CellData,
  },
}

const defaultColumns = Object.keys(columnHeaderConfig)

const columnHeaderData = (columns = defaultColumns): ColumnConfig[] => {
  return columns.map(col => columnHeaderConfig[col])
}

const collectionsSummaryMap: Record<number, DarCollectionSummary> = {}

const processCollectionRowData = ({
  collections,
  collectionIsExpanded,
  updateCollectionIsExpandedById,
  showConfirmationModal,
  columns = defaultColumns,
  consoleType = '',
  goToVote,
  relevantDatasets,
}: ProcessCollectionRowDataArgs): CellData[][] | undefined => {
  if (!isNil(collections)) {
    return collections.map((collection) => {
      const {
        darCollectionId, darCode, datasetIds,
        submissionDate, status, actions, dacNames,
        researcherName, name, institutionName,
      } = collection
      collectionsSummaryMap[collection.darCollectionId] = collection
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          collection, darCollectionId, datasetIds, darCode, status, name,
          submissionDate, researcherName, institutionName,
          showConfirmationModal, consoleType,
          goToVote, relevantDatasets, actions, dacNames,
          collectionIsExpanded: collectionIsExpanded(darCollectionId),
          updateCollectionIsExpanded: val => updateCollectionIsExpandedById(darCollectionId, val),
        })
      })
    })
  }
}

const getInitialSort = (columns: string[] = []): SortConfig => {
  const sort = Storage.getCurrentUserSettings(storageDarCollectionSort) ?? {
    field: DarCollectionTableColumnOptions.SUBMISSION_DATE,
    dir: -1,
  }
  const sortIndex = columns.indexOf(sort.field)

  if (sortIndex === -1) {
    return { colIndex: 0, dir: 1 }
  }
  else {
    return { colIndex: sortIndex, dir: sort.dir }
  }
}

export const DarCollectionTable = function DarCollectionTable(props: DarCollectionTableProps) {
  const [visibleCollection, setVisibleCollection] = useState<CellData[][]>([])
  const [collectionsExpandedState, setCollectionsExpandedState] = useState<Record<number, boolean>>({})
  const [darCollectionCache, setDarCollectionCache] = useState<Record<number, DarCollection | null>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState<SortConfig>(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<DarCollectionSummary>({} as DarCollectionSummary)
  const [consoleAction, setConsoleAction] = useState<string | undefined>()
  const {
    collections, columns, isLoading, cancelCollection, reviseCollection,
    openCollection, goToVote, consoleType, relevantDatasets, deleteDraft,
    approveCollection,
  } = props
  const isUnfilteredView = consoleType === consoleTypes.ADMIN
    || consoleType === consoleTypes.RESEARCHER
    || consoleType === consoleTypes.SIGNING_OFFICIAL

  /*
    NOTE: This component will most likely be used in multiple consoles
    Right now the table is assuming a fetchAll request since it's being implemented for the ResearcherConsole
    This will be updated to account for token based requests on a later ticket
  */

  const updateCollectionIsExpandedById = useCallback((id: number, val: boolean) => {
    if (collectionsExpandedState[id] !== val) {
      const newCollectionsExpandedState = cloneDeep(collectionsExpandedState)
      newCollectionsExpandedState[id] = val
      setCollectionsExpandedState(newCollectionsExpandedState)
    }
  }, [collectionsExpandedState])

  const collectionIsExpanded = useCallback((id: number) => {
    return collectionsExpandedState[id]
  }, [collectionsExpandedState])

  const fetchDarCollection = useCallback((darCollectionId: number) => {
    if (isNil(darCollectionCache[darCollectionId])) {
      return Collections.getCollectionById(darCollectionId).then((coll) => {
        const cache = cloneDeep(darCollectionCache)
        cache[darCollectionId] = coll
        setDarCollectionCache(cache)
        return coll
      }).catch(() => {
        const cache = cloneDeep(darCollectionCache)
        cache[darCollectionId] = null
        setDarCollectionCache(cache)
        Notifications.showError({ text: 'Could not load DAR Collection.' })
        return null
      })
    }
    else {
      return darCollectionCache[darCollectionId]
    }
  }, [darCollectionCache, setDarCollectionCache])

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(Number.parseInt(String(value)))) {
      setTableSize(value)
    }
  }, [])

  const showConfirmationModal = useCallback((collectionSummary: DarCollectionSummary, action = '') => {
    setConsoleAction(action)
    setSelectedCollection(collectionSummary)
    setShowConfirmation(true)
  }, [])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processCollectionRowData({
        collections,
        collectionIsExpanded,
        updateCollectionIsExpandedById,
        columns,
        showConfirmationModal,
        consoleType,
        goToVote,
        relevantDatasets,
      }) ?? [],
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollection,
      sort,
    })
  }, [tableSize, currentPage, pageCount, collections, sort, columns, consoleType, goToVote, relevantDatasets, collectionIsExpanded, updateCollectionIsExpandedById, showConfirmationModal])

  const goToPage = useCallback(
    (value: number) => {
      updatePage(value, pageCount, setCurrentPage)
    },
    [pageCount],
  )

  const showDatasetDropdownWrapper = useCallback((wrapperArgs: RowWrapperArgs) => {
    const { renderedRow, rowData } = wrapperArgs
    const darCollectionId = rowData[0].id as number

    if (collectionIsExpanded(darCollectionId)) {
      // Trigger fetch if not yet cached; isLoading guards usage until the value arrives
      fetchDarCollection(darCollectionId)
      return (
        <div key={`expanded-${darCollectionId}`}>
          {renderedRow}
          <div
            style={{
              width: '80%',
              margin: 'auto',
            }}
          >
            <DarDatasetTable
              // non-null: when isLoading is false, the cache entry is guaranteed to be a DarCollection
              collection={darCollectionCache[darCollectionId]!}
              isLoading={isNil(darCollectionCache[darCollectionId])}
              isUnfilteredView={isUnfilteredView}
            />
          </div>
        </div>
      )
    }
    return renderedRow
  }, [darCollectionCache, fetchDarCollection, collectionIsExpanded, isUnfilteredView])

  return (
    <Fragment>
      <SimpleTable
        isLoading={isLoading}
        rowData={visibleCollection}
        columnHeaders={columnHeaderData(columns)}
        styles={styles}
        tableSize={tableSize}
        paginationBar={(
          <PaginationBar
            pageCount={pageCount}
            currentPage={currentPage}
            tableSize={tableSize}
            goToPage={goToPage}
            changeTableSize={changeTableSize}
          />
        )}
        rowWrapper={showDatasetDropdownWrapper}
        sort={sort}
        onSort={(s: SortConfig) => {
          Storage.setCurrentUserSettings(storageDarCollectionSort, {
            field: columns?.[s.colIndex],
            dir: s.dir,
          })
          setSort(s)
        }}
      />
      {
        /*
      Modal needs to be more flexible
      Should take in an operation type, use that to determine message on modal
      Operations: Open, Cancel, Revise

      How to make more flexible?
        - Need to change message based on operation
        - Need to change prop function based on operation
        - showConfirmationModal
         - Can take in an extra op argument, assign that as a state variable
         - Modal function can be defined via useCallback, recomputed if op state variable changes
         - Above can also be applied for modal message (expect use useMemo instead of useCallback)
    */
      }
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
