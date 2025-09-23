import React, { useState, useEffect, useCallback } from 'react'
import { Storage } from 'src/libs/storage'
import PaginationBar from '../PaginationBar'
import SimpleTable from '../SimpleTable'
import cellData from './DACDatasetTableCellData'
import { styles, DACDatasetTableColumnOptions } from './DACDatasetConstants'
import { isNil } from 'lodash/fp'
import { goToPage as updatePage, recalculateVisibleTable } from 'src/libs/utils'

const columnHeaderConfig = {
  duosId: { label: 'DUOS ID', cellStyle: { width: styles.cellWidths.duosId }, cellDataFn: cellData.duosIdCellData, sortable: true },
  phsId: { label: 'PHS ID', cellStyle: { width: styles.cellWidths.phsId }, cellDataFn: cellData.duosPhsIdCellData, sortable: true },
  datasetName: { label: 'Dataset Name', cellStyle: { width: styles.cellWidths.datasetName }, cellDataFn: cellData.datasetNameCellData, sortable: true },
  studyName: { label: 'Study Name', cellStyle: { width: styles.cellWidths.studyName }, cellDataFn: cellData.studyNameCellData, sortable: true },
  dataSubmitter: { label: 'Data Submitter', cellStyle: { width: styles.cellWidths.dataSubmitter }, cellDataFn: cellData.dataSubmitterCellData, sortable: true },
  dataCustodian: { label: 'Data Custodian', cellStyle: { width: styles.cellWidths.dataCustodian }, cellDataFn: cellData.dataCustodianCellData, sortable: true },
  dataUse: { label: 'Data Use', cellStyle: { width: styles.cellWidths.dataUse }, cellDataFn: cellData.dataUseCellData, sortable: false },
  certificationLink: { label: 'NIH Institutional Certification', cellStyle: { width: styles.cellWidths.certificationLink }, cellDataFn: cellData.nihCertificationLinkData, sortable: true },
  status: { label: 'Status', cellStyle: { width: styles.cellWidths.status }, cellDataFn: cellData.statusCellData, sortable: false },
}

const defaultColumns = Object.keys(columnHeaderConfig)

const columnHeaderData = (columns = defaultColumns) => {
  return columns.map(col => columnHeaderConfig[col])
}

const processDatasetRowData = ({
  datasets, columns = defaultColumns, consoleType = '', history,
}) => {
  if (!isNil(datasets)) {
    return datasets.map((dataset) => {
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dataset, consoleType, history,
        })
      })
    })
  }
}

const storageDACDatasetSort = 'storageDACDatasetSort'

const getInitialSort = (columns = []) => {
  const sort = Storage.getCurrentUserSettings(storageDACDatasetSort) || {
    field: DACDatasetTableColumnOptions.DUOS_ID,
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

export const DACDatasetsTable = function DACDatasetTable(props) {
  const [visibleDatasets, setVisibleDatasets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)
  const { datasets, columns, isLoading, consoleType, history } = props

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value)
    }
  }, [])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processDatasetRowData({ datasets, columns, consoleType, history }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleDatasets,
      sort,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableSize, currentPage, pageCount, datasets, sort, columns, consoleType])

  // Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage)
    },
    [pageCount],
  )

  return (
    <SimpleTable
      isLoading={isLoading}
      rowData={visibleDatasets}
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
        Storage.setCurrentUserSettings(storageDACDatasetSort, {
          field: columns[sort.colIndex],
          dir: sort.dir,
        })
        setSort(sort)
      }}
    />
  )
}
