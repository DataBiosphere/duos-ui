import React, { useState, useEffect, useCallback } from 'react'
import { Storage } from 'src/libs/storage'
import PaginationBar from 'src/components/PaginationBar'
import { recalculateVisibleTable, goToPage as updatePage, Notifications } from 'src/libs/utils'
import SimpleTable from 'src/components/SimpleTable'
import cellData, { BucketCellDataParams, CellData } from 'src/components/dar_dataset_table/DarDatasetTableCellData'
import { compact, isEmpty, map, uniq } from 'src/utils/NodashUtil'
import { Bucket, binCollectionToBuckets } from 'src/utils/BucketUtils'
import { styles } from 'src/utils/darDatasetUtils'
import { DarCollection, DuosUser } from 'src/types/model'

const storageDarDatasetSort = 'storageDarDatasetSort'

const DarDatasetTableColumnOptions = {
  DATA_USE_GROUP: 'dataUseGroup',
  NUMBER_OF_DATASETS: 'numberOfDatasets',
  DATASETS: 'datasets',
} as const

interface SortConfig {
  colIndex: number
  dir: number
}

interface SortSettings {
  field: string
  dir: number
}

interface ColumnConfig {
  label: string
  cellStyle: React.CSSProperties
  cellDataFn: (args: BucketCellDataParams) => CellData
  sortable: boolean
}

export interface DarDatasetTableProps {
  collection: DarCollection
  isLoading: boolean
  isUnfilteredView: boolean
  columns?: string[]
}

const columnHeaderConfig: Record<string, ColumnConfig> = {
  dataUseGroup: {
    label: 'Data Use Group',
    cellStyle: { width: styles.cellWidth.dataUseGroup },
    cellDataFn: cellData.dataUseGroupCellData,
    sortable: true,
  },
  numberOfDatasets: {
    label: '# of Datasets',
    cellStyle: { width: styles.cellWidth.numberOfDatasets },
    cellDataFn: cellData.numberOfDatasetsCellData,
    sortable: true,
  },
  datasets: {
    label: 'Datasets',
    cellStyle: { width: styles.cellWidth.datasets },
    cellDataFn: cellData.datasetsCellData,
    sortable: false,
  },
}

const columns = Object.keys(columnHeaderConfig)

const columnHeaderData = (cols: string[]): ColumnConfig[] => cols.map(col => columnHeaderConfig[col])

const processBucketRowData = (buckets: Bucket[]): CellData[][] =>
  buckets.map(({ key: dataUseGroup, datasets, label }) =>
    columns.map(col => columnHeaderConfig[col].cellDataFn({ dataUseGroup, datasets, label })),
  )

const getInitialSort = (cols: string[] = []): SortConfig => {
  const settings = Storage.getCurrentUserSettings<SortSettings>(storageDarDatasetSort)
  const sort = settings ?? { field: DarDatasetTableColumnOptions.NUMBER_OF_DATASETS, dir: -1 }
  const sortIndex = cols.indexOf(sort.field)
  return sortIndex === -1 ? { colIndex: 0, dir: 1 } : { colIndex: sortIndex, dir: sort.dir }
}

export const DarDatasetTable = ({
  collection, isLoading, isUnfilteredView, columns: columnsProp,
}: DarDatasetTableProps): React.ReactElement => {
  const [visibleBuckets, setVisibleBuckets] = useState<CellData[][]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState<SortConfig>(getInitialSort(columnsProp))
  const [tableSize, setTableSize] = useState(10)
  const [user] = useState<DuosUser>(Storage.getCurrentUser())
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isInitializing, setIsInitializing] = useState(true)

  const init = useCallback(async () => {
    try {
      if (isEmpty(collection)) {
        setBuckets([])
        return
      }
      const dacIds = isUnfilteredView ? [] : uniq(compact(map(user.roles, r => r.dacId))) as number[]
      const allBuckets = await binCollectionToBuckets(collection, dacIds)
      const dataAccessBuckets = allBuckets.filter(b => b.isRP !== true)
      setBuckets(dataAccessBuckets)
      setTableSize(dataAccessBuckets.length)
    }
    catch {
      Notifications.showError({ text: 'Error initializing DAR Collection Dataset summary.' })
    }
    setIsInitializing(false)
  }, [collection, isUnfilteredView, user])

  useEffect(() => {
    const callInit = async () => {
      try {
        await init()
      }
      catch {
        Notifications.showError({ text: 'Failed to initialize collection' })
      }
    }
    callInit()
  }, [init])

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(Number(value))) {
      setTableSize(value)
    }
  }, [])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processBucketRowData(buckets),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleBuckets,
      sort,
    })
  }, [tableSize, currentPage, pageCount, buckets, sort])

  const goToPage = useCallback(
    (value: number) => updatePage(value, pageCount, setCurrentPage),
    [pageCount],
  )

  return (
    <SimpleTable
      isLoading={isLoading || isInitializing}
      rowData={visibleBuckets}
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
      sort={sort}
      onSort={(newSort: SortConfig) => {
        Storage.setCurrentUserSettings(storageDarDatasetSort, {
          field: columns[newSort.colIndex],
          dir: newSort.dir,
        })
        setSort(newSort)
      }}
    />
  )
}
