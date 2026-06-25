import React, { useState, useEffect, useCallback } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { DAC } from 'src/libs/ajax/DAC'
import { filter, isNil } from 'src/utils/NodashUtil'
import { recalculateVisibleTable, goToPage as updatePage, Notifications } from 'src/libs/utils'
import cellData from 'src/components/manage_dac_table/ManageDacTableCellData'
import { styles } from 'src/components/manage_dac_table/manageDacTableUtils'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import PropTypes from 'prop-types'

const columnHeaderConfig = {
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

const columns = Object.keys(columnHeaderConfig)

const columnHeaderData = (columns = columns) => {
  return columns.map(col => columnHeaderConfig[col])
}

const getInitialSort = (columns = []) => {
  const sort = {
    field: 'name',
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

const processDacRowData = ({ dacs, viewDatasets, deleteDac, userRole, columns = columns }) => {
  if (!isNil(dacs)) {
    return dacs.map((dac) => {
      const {
        dacId,
        name,
        description,
      } = dac

      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dac,
          dacId,
          description,
          name,
          viewDatasets,
          deleteDac,
          userRole,
        })
      })
    })
  }
}

export const ManageDacTable = function ManageDacTable(props) {
  // table data
  const [visibleDacs, setVisibleDacs] = useState([])

  // table state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [sort, setSort] = useState(getInitialSort(props.columns))
  const [tableSize, setTableSize] = useState(10)

  const {
    isLoading,
    dacs,
    userRole,
    onViewDatasets,
    setShowConfirmationModal,
    setSelectedDac,
  } = props

  const deleteDac = useCallback((selectedDac) => {
    setShowConfirmationModal(true)
    setSelectedDac(selectedDac)
  }, [setShowConfirmationModal, setSelectedDac])

  const viewDatasets = useCallback(async (selectedDac) => {
    try {
      const datasets = await DAC.datasets(selectedDac.dacId)
      const approvedDatasets = filter(datasets, { dacApproval: true })
      onViewDatasets(selectedDac, approvedDatasets)
    }
    catch {
      Notifications.showError({ text: 'Failed to load datasets.' })
    }
  }, [onViewDatasets])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processDacRowData({
        dacs,
        viewDatasets,
        deleteDac,
        userRole,
        columns,
      }),
      currentPage,
      setPageCount: c => setPageCount(c),
      setCurrentPage: p => setCurrentPage(p),
      setVisibleList: l => setVisibleDacs(l),
      sort,
    })
  }, [dacs, tableSize, pageCount, userRole, currentPage, sort, deleteDac, viewDatasets])

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !Number.isNaN(Number.parseInt(value))) {
      setTableSize(value)
    }
  }, [])

  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, (page) => {
        setCurrentPage(page)
      })
    },
    [pageCount],
  )

  ManageDacTable.propTypes = {
    isLoading: PropTypes.bool,
    dacs: PropTypes.array,
    userRole: PropTypes.string,
    onViewDatasets: PropTypes.func,
    setShowConfirmationModal: PropTypes.func,
    setSelectedDac: PropTypes.func,
    columns: PropTypes.array,
  }

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
        onSort={(sort) => {
          setSort(sort)
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
