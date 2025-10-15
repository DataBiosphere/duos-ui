import * as React from 'react'
import { isEmpty, capitalize, isUndefined } from 'lodash'
import { DatasetTerm } from 'src/types/model'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import { Styles } from 'src/libs/theme'
import {
  type CellData,
  DatasetSearchTableTab,
} from 'src/components/data_search/DatasetSearchTableConstants'
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import { Storage } from 'src/libs/storage'

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

// Helper function to check if a value should be treated as empty/undefined
const isMissingValue = (value: CellData['value']): boolean => {
  return isUndefined(value)
    || isEmpty(value)
    || value === '--'
}

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

  return { colIndex: -1, dir: 1 }
}

interface DatasetSearchTableDisplayProps {
  onSelect: (newSelectedIds: number[]) => void
  filteredData: DatasetTerm[]
  allData: DatasetTerm[] // Added: all datasets for cell calculation
  selected: number[]
  exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }
  tab: DatasetSearchTableTab<DatasetTerm | DatasetTerm[]>
}

export const DatasetSearchTableDisplay = (props: DatasetSearchTableDisplayProps) => {
  const { onSelect, exportableDatasets, filteredData, allData, selected, tab } = props
  const [sort, setSort] = React.useState<Sort>(getSortForTab(tab.key))
  const [currentPage, setCurrentPage] = React.useState(1)
  const [tableSize, setTableSize] = React.useState(50)
  const headers = tab.makeHeaders(filteredData, selected, onSelect, exportableDatasets)

  const sortData = React.useCallback((data: CellData[][], sortState: Sort) => {
    if (sortState.colIndex < 0) return data

    const colIndex = sortState.colIndex
    const columnLabel = headers[colIndex]?.label

    // Check if we're sorting a numeric column like Participants or Participant Count
    const isNumericColumn = columnLabel === 'Participants' || columnLabel === 'Participant Count'

    return [...data].sort((a, b) => {
      const aValue = a[colIndex]?.value
      const bValue = b[colIndex]?.value

      // Always sort empty values to the bottom regardless of sort direction
      const aIsEmpty = isMissingValue(aValue)
      const bIsEmpty = isMissingValue(bValue)

      if (aIsEmpty && bIsEmpty) return 0
      if (aIsEmpty) return 1 // Move 'a' to the bottom when it's empty
      if (bIsEmpty) return -1 // Move 'b' to the bottom when it's empty

      if (isNumericColumn) {
        const numA = Number(aValue)
        const numB = Number(bValue)

        // Handle NaN values similar to undefined
        if (isNaN(numA) && isNaN(numB)) return 0
        if (isNaN(numA)) return 1 // Treat NaN like undefined, to the bottom
        if (isNaN(numB)) return -1 // Treat NaN like undefined, to the bottom

        return (numA - numB) * sortState.dir
      }
      const strA = String(aValue).toLowerCase()
      const strB = String(bValue).toLowerCase()
      return strA.localeCompare(strB) * sortState.dir
    })
  }, [headers])

  // Calculate cell data once for all datasets
  const allRowData = React.useMemo(() => {
    return tab.makeRows(allData, headers)
  }, [allData, headers, tab])

  // Create map for fast lookup of calculated row data
  const rowDataMap = React.useMemo(() => {
    const map = new Map()
    allData.forEach((dataset, index) => {
      const key = dataset.datasetId || dataset.study?.studyId || index
      map.set(key, allRowData[index])
    })
    return map
  }, [allData, allRowData])

  // Filter and sort only the row data we need
  const sortedRowData = React.useMemo(() => {
    const filteredRowData = filteredData.map((dataset) => {
      const key = dataset.datasetId || dataset.study?.studyId
      return rowDataMap.get(key)
    }).filter(Boolean)

    return sortData(filteredRowData, sort)
  }, [filteredData, rowDataMap, sort, sortData])

  // Pagination logic
  const pageSize = tableSize // Use the tableSize state instead of hardcoded 50
  const pageCount = Math.ceil(sortedRowData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const rowData = sortedRowData.slice(startIndex, endIndex)

  const changeTableSize = (newSize: number) => {
    setTableSize(newSize)
    setCurrentPage(1) // Reset to first page when changing size
  }

  const handleSort = (newSort: Sort) => {
    const storageKey = `${storageDatasetSearchSort}_${tab.key}`
    Storage.setCurrentUserSettings(storageKey, {
      colIndex: newSort.colIndex,
      dir: newSort.dir,
    })
    setSort(newSort)
  }

  return (
    <>
      <div style={{
        fontWeight: 600,
        borderBottom: '1px solid black',
      }}
      >
        {sortedRowData.length}
        {' '}
        {capitalize(sortedRowData.length !== 1 ? tab.plural : tab.singular)}
        {sortedRowData.length > pageSize && (
          <span style={{ fontWeight: 400, marginLeft: '1rem' }}>
            (showing {Math.min(pageSize, sortedRowData.length - startIndex)} of {sortedRowData.length})
          </span>
        )}
      </div>
      {
        isEmpty(filteredData)
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
                rowData={rowData}
                columnHeaders={headers}
                selected={selected}
                styles={styles}
                paginationBar={(
                  <PaginationBar
                    currentPage={currentPage}
                    pageCount={pageCount}
                    tableSize={pageSize}
                    goToPage={(newPage) => {
                      setCurrentPage(newPage)
                    }}
                    changeTableSize={(newSize) => {
                      changeTableSize(newSize)
                    }}
                  />
                )}
                summary={`faceted ${tab.singular} search table`}
                onSort={handleSort}
                sort={sort}
              />
            )
      }
    </>
  )
}
