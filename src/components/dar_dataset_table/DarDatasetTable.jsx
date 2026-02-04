import React, { useState, useEffect, Fragment, useCallback } from 'react'
import { Storage } from '../../libs/storage'
import PaginationBar from '../PaginationBar'
import { recalculateVisibleTable, goToPage as updatePage } from '../../libs/utils'
import SimpleTable from '../SimpleTable'
import cellData from './DarDatasetTableCellData'
import { compact, isEmpty, isNil, map, uniq } from 'lodash'
import { binCollectionToBuckets } from '../../utils/BucketUtils'
import { styles } from '../../utils/darDatasetUtils'
import { Notifications } from '../../libs/utils'

const storageDarDatasetSort = 'storageDarDatasetSort'

const DarDatasetTableColumnOptions = {
  DATA_USE_GROUP: 'dataUseGroup',
  NUMBER_OF_DATASETS: 'numberOfDatasets',
  DATASETS: 'datasets',
}

const columnHeaderConfig = {
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

const columnHeaderData = (columns = columns) => {
  return columns.map(col => columnHeaderConfig[col])
}

const processBucketRowData = ({
  buckets,
}) => {
  if (!isNil(buckets)) {
    return buckets.map((bucket) => {
      const {
        key: dataUseGroup,
        votes,
        datasets,
        elections,
        label,
      } = bucket
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dataUseGroup,
          datasets,
          elections,
          votes,
          label,
        })
      })
    })
  }
}

const getInitialSort = (columns = []) => {
  const sort = Storage.getCurrentUserSettings(storageDarDatasetSort) || {
    field: DarDatasetTableColumnOptions.NUMBER_OF_DATASETS,
    dir: -1,
  }
  const sortIndex = columns.indexOf(sort.field)

  if (sortIndex !== -1) {
    return { colIndex: sortIndex, dir: sort.dir }
  }
  else {
    return { colIndex: 0, dir: 1 }
  }
}

export const DarDatasetTable = (props) => {
  const [visibleBuckets, setVisibleBuckets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)
  const [user] = useState(Storage.getCurrentUser())

  const [buckets, setBuckets] = useState([])

  const {
    collection, isLoading, isUnfilteredView,
  } = props

  const [isInitializing, setIsInitializing] = useState(true)

  const init = useCallback(async () => {
    try {
      if (isEmpty(collection)) {
        setBuckets([])
        return
      }
      // If this is NOT an admin view, we need to filter buckets by the user's DACs
      const dacIds = isUnfilteredView ? [] : uniq(compact(map(user.roles, r => r.dacId)))
      const buckets = await binCollectionToBuckets(collection, dacIds)
      const dataAccessBuckets = buckets.filter(
        b => b.isRP !== true,
      )
      setBuckets(dataAccessBuckets)
      setTableSize(dataAccessBuckets.length)
    }
    catch (_error) {
      Notifications.showError({
        text: 'Error initializing DAR Collection Dataset summary.',
      })
    }
    setIsInitializing(false)
  }, [collection, isUnfilteredView, user])

  useEffect(() => {
    const callInit = async () => {
      try {
        await init()
      }
      catch (_error) {
        Notifications.showError({ text: 'Failed to initialize collection' })
      }
    }
    callInit()
  }, [init])

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value)
    }
  }, [])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processBucketRowData({
        buckets,
      }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleBuckets,
      sort,
    })
  }, [tableSize, currentPage, pageCount, buckets, sort])

  // Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage)
    },
    [pageCount],
  )

  return (
    <Fragment>
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
        onSort={(sort) => {
          Storage.setCurrentUserSettings(storageDarDatasetSort, {
            field: columns[sort.colIndex],
            dir: sort.dir,
          })
          setSort(sort)
        }}
      />
    </Fragment>
  )
}
