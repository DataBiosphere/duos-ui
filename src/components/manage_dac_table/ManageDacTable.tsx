import React, { useState, useEffect, useCallback } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { DAC } from 'src/libs/ajax/DAC'
import { filter, isNil } from 'src/utils/NodashUtil'
import { recalculateVisibleTable, goToPage as updatePage, Notifications } from 'src/libs/utils'
import cellData, { type CellData } from 'src/components/manage_dac_table/ManageDacTableCellData'
import { styles } from 'src/components/manage_dac_table/manageDacTableUtils'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import type { DacObject, Dataset } from 'src/types/model'

interface SortConfig {
  colIndex: number
  dir: number
}

interface DacCellArgs {
  dac: DacObject
  dacId?: number
  description?: string
  name?: string
  viewDatasets: (dac: DacObject) => void
  deleteDac: (dac: DacObject) => void
  userRole: string
  label?: string
}

interface ColumnConfig {
  label: string
  cellStyle: React.CSSProperties
  cellDataFn: (args: DacCellArgs) => CellData
  sortable?: boolean
}

export interface ManageDacTableProps {
  isLoading: boolean
  dacs: DacObject[]
  userRole: string
  onViewDatasets: (dac: DacObject, datasets: Dataset[]) => void
  setShowConfirmationModal: (v: boolean) => void
  setSelectedDac: (dac: DacObject) => void
  columns?: string[]
}

const columnHeaderConfig: Record<string, ColumnConfig> = {
  name: {
    label: 'DAC Name',
    cellStyle: { width: styles.cellWidth.name },
    cellDataFn: cellData.nameCellData,
    sortable: true,
  },
  description: {
    label: 'DAC Description',
    cellStyle: { width: styles.cellWidth.description },
    cellDataFn: cellData.descriptionCellData,
    sortable: false,
  },
  datasets: {
    label: 'DAC Datasets',
    cellStyle: { width: styles.cellWidth.datasets },
    cellDataFn: cellData.datasetsCellData,
    sortable: false,
  },
  actions: {
    label: 'Action',
    cellStyle: { width: styles.cellWidth.actions },
    cellDataFn: cellData.actionsCellData,
  },
}

const defaultCols = Object.keys(columnHeaderConfig)

const columnHeaderData = (cols: string[]): ColumnConfig[] => cols.map(col => columnHeaderConfig[col])

const getInitialSort = (cols: string[] = []): SortConfig => {
  const sortField = 'name'
  const sortIndex = cols.indexOf(sortField)
  return sortIndex === -1 ? { colIndex: 0, dir: 1 } : { colIndex: sortIndex, dir: -1 }
}

interface ProcessDacRowDataArgs {
  dacs: DacObject[]
  viewDatasets: (dac: DacObject) => void
  deleteDac: (dac: DacObject) => void
  userRole: string
  cols: string[]
}

const processDacRowData = ({ dacs, viewDatasets, deleteDac, userRole, cols }: ProcessDacRowDataArgs): CellData[][] | undefined => {
  if (!isNil(dacs)) {
    return dacs.map((dac) => {
      const { dacId, name, description } = dac
      return cols.map(col => columnHeaderConfig[col].cellDataFn({
        dac,
        dacId,
        description,
        name,
        viewDatasets,
        deleteDac,
        userRole,
      }))
    })
  }
}

export const ManageDacTable = function ManageDacTable(props: ManageDacTableProps) {
  const [visibleDacs, setVisibleDacs] = useState<CellData[][]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState<SortConfig>(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)

  const {
    isLoading,
    dacs,
    userRole,
    onViewDatasets,
    setShowConfirmationModal,
    setSelectedDac,
    columns = defaultCols,
  } = props

  const deleteDac = useCallback((selectedDac: DacObject) => {
    setShowConfirmationModal(true)
    setSelectedDac(selectedDac)
  }, [setShowConfirmationModal, setSelectedDac])

  const viewDatasets = useCallback(async (selectedDac: DacObject) => {
    try {
      const datasets = await DAC.datasets(selectedDac.dacId as number)
      const approvedDatasets = filter(datasets, { dacApproval: true })
      onViewDatasets(selectedDac, approvedDatasets)
    }
    catch {
      Notifications.showError({ text: 'Failed to load datasets.' })
    }
  }, [onViewDatasets])

  useEffect(() => {
    recalculateVisibleTable<CellData[]>({
      tableSize,
      pageCount,
      filteredList: processDacRowData({ dacs, viewDatasets, deleteDac, userRole, cols: columns }) ?? [],
      currentPage,
      setPageCount: c => setPageCount(c),
      setCurrentPage: p => setCurrentPage(p),
      setVisibleList: l => setVisibleDacs(l),
      sort,
    })
  }, [dacs, tableSize, pageCount, userRole, currentPage, sort, deleteDac, viewDatasets, columns])

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(value)) {
      setTableSize(value)
    }
  }, [])

  const goToPage = useCallback(
    (value: number) => {
      updatePage(value, pageCount, (page) => {
        setCurrentPage(page)
      })
    },
    [pageCount],
  )

  return (
    <>
      <SimpleTable
        isLoading={isLoading}
        rowData={visibleDacs}
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
        onSort={(s: SortConfig) => {
          setSort(s)
        }}
      />
      <ReactTooltip
        place="left"
        className="tooltip-wrapper"
      />
    </>
  )
}

export default ManageDacTable
