import React, { useEffect, useState, useMemo } from 'react'
import { capitalize, isEmpty } from 'lodash'
import { DatasetTerm } from 'src/types/model'
import SimpleTable from 'src/components/SimpleTable'
import { Styles } from 'src/libs/theme'
import {
  type CellData,
  DatasetSearchTableTab,
} from 'src/components/data_search/DatasetSearchTableConstants'
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import { Storage } from 'src/libs/storage'
import PaginationBar from 'src/components/PaginationBar'
import { recalculateVisibleTable } from 'src/libs/utils'

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    textOverflow: 'ellipsis',
    height: '4rem',
    marginTop: 5,
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    backgroundColor: '#E2E8F4',
    border: 'none',
    textTransform: 'uppercase',
    lineHeight: '16px',
  }),
  containerOverride: {},
}

interface Sort {
  colIndex: number
  dir: number
}

// Storage key for persisting sort preferences
const storageDatasetSearchSort = 'storageDatasetSearchSort'

// Get the sort configuration for the active tab
const getSortForTab = (tabKey: string): Sort => {
  const storageKey = `${storageDatasetSearchSort}_${tabKey}`
  const savedSort = Storage.getCurrentUserSettings(storageKey)

  if (savedSort) {
    return {
      colIndex: savedSort.colIndex,
      dir: savedSort.dir,
    }
  }

  return { dir: 1 } as Sort
}

interface DatasetSearchTableDisplayProps {
  onSelect: (newSelectedIds: number[]) => void
  filteredData: DatasetTerm[]
  selected: number[]
  exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }
  tab: DatasetSearchTableTab<DatasetTerm | DatasetTerm[]>
}

export const DatasetSearchTableDisplay = (props: DatasetSearchTableDisplayProps) => {
  const { onSelect, exportableDatasets, filteredData, selected, tab } = props
  const [sort, setSort] = useState<Sort>(getSortForTab(tab.key))
  const [tableSize, setTableSize] = useState(50)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [visibleRows, setVisibleRows] = useState<CellData[][]>([])
  
  // Memoize headers to prevent recreation on every render
  const headers = useMemo(
    () => tab.makeHeaders(filteredData, selected, onSelect, exportableDatasets),
    [tab, filteredData, selected, onSelect, exportableDatasets]
  )
  
  // Memoize rows to prevent recreation on every render
  const rows = useMemo(
    () => tab.makeRows(filteredData, headers),
    [tab, filteredData, headers]
  )
  
  const [pageCount, setPageCount] = useState<number>(rows.length / tableSize)

  const handleSort = (newSort: Sort) => {
    const storageKey = `${storageDatasetSearchSort}_${tab.key}`
    Storage.setCurrentUserSettings(storageKey, {
      colIndex: newSort.colIndex,
      dir: newSort.dir,
    })
    setSort(newSort)
  }

  const goToPage = (page: number) => {
    if (page > 0 && page < pageCount + 1) {
      setCurrentPage(page)
    }
  }

  const changeTableSize = (newSize: number) => {
    if (!isEmpty(newSize) && newSize > 0) {
      setTableSize(newSize)
    }
  }

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: rows,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleRows,
      sort: sort,
    })
  },
  [tableSize, pageCount, currentPage, setPageCount, setCurrentPage, rows, sort])

  return (
    <>
      <div style={{
        fontWeight: 600,
        borderBottom: '1px solid black',
      }}
      >
        {rows.length}
        {' '}
        {capitalize(rows.length < 1 ? tab.plural : tab.singular)}
      </div>
      {
        isEmpty(visibleRows)
          ? (
              <div style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                There are no
                {tab.plural}
                {' '}
                that fit these criteria.
              </div>
            )
          : (
              <SimpleTable
                rowData={visibleRows}
                columnHeaders={headers}
                selected={selected}
                styles={styles}
                tableSize={10}
                summary={`faceted ${tab.singular} search table`}
                onSort={handleSort}
                sort={sort}
                paginationBar={(
                  <PaginationBar
                    pageCount={pageCount}
                    currentPage={currentPage}
                    tableSize={tableSize}
                    goToPage={goToPage}
                    changeTableSize={changeTableSize}
                  />
                )}
              />
            )
      }
    </>
  )
}
