import React, { useState, useEffect, useCallback } from 'react'
import { Storage } from 'src/libs/storage'
import PaginationBar from 'src/components/PaginationBar'
import SimpleTable from 'src/components/SimpleTable'
import cellData, { CellData, CellDataParams } from 'src/components/dac_dataset_table/DACDatasetTableCellData'
import { styles, DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'
import { goToPage as updatePage, recalculateVisibleTable } from 'src/libs/utils'
import { useNavigate } from 'react-router-dom'
import { DatasetTerm } from 'src/types/model'

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
  cellDataFn: (args: CellDataParams) => CellData
  sortable: boolean
}

const columnHeaderConfig: Record<string, ColumnConfig> = {
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

const columnHeaderData = (columns: string[] = defaultColumns) =>
  columns.map(col => columnHeaderConfig[col])

const processDatasetRowData = ({
  datasets,
  columns = defaultColumns,
  consoleType = '',
  navigate,
}: { datasets: DatasetTerm[], columns?: string[], consoleType?: string, navigate: ReturnType<typeof useNavigate> }): CellData[][] =>
  datasets.map(dataset =>
    columns.map(col => columnHeaderConfig[col].cellDataFn({ dataset, consoleType, navigate })),
  )

const storageDACDatasetSort = 'storageDACDatasetSort'

const getInitialSort = (columns: string[] = []): SortConfig => {
  const sort = Storage.getCurrentUserSettings<SortSettings>(storageDACDatasetSort) ?? {
    field: DACDatasetTableColumnOptions.DUOS_ID,
    dir: -1,
  }
  const sortIndex = columns.indexOf(sort.field)
  return sortIndex === -1 ? { colIndex: 0, dir: 1 } : { colIndex: sortIndex, dir: sort.dir }
}

export interface DACDatasetsTableProps {
  datasets: DatasetTerm[]
  columns?: string[]
  isLoading: boolean
  consoleType?: string
}

export const DACDatasetsTable = function DACDatasetTable({ datasets, columns, isLoading, consoleType }: DACDatasetsTableProps) {
  const navigate = useNavigate()
  const [visibleDatasets, setVisibleDatasets] = useState<CellData[][]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState<SortConfig>(getInitialSort(columns))
  const [tableSize, setTableSize] = useState(10)

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(Number.parseInt(String(value)))) {
      setTableSize(value)
    }
  }, [])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processDatasetRowData({ datasets, columns, consoleType, navigate }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleDatasets,
      sort,
    })
  }, [tableSize, currentPage, pageCount, datasets, sort, columns, consoleType, navigate])

  const goToPage = useCallback(
    (value: number) => {
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
      onSort={(newSort: SortConfig) => {
        Storage.setCurrentUserSettings(storageDACDatasetSort, {
          field: (columns ?? defaultColumns)[newSort.colIndex],
          dir: newSort.dir,
        })
        setSort(newSort)
      }}
    />
  )
}
