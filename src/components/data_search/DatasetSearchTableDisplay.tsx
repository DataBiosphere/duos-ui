import * as React from 'react'
import { isEmpty, capitalize, isUndefined } from 'lodash'
import { DatasetTerm } from 'src/types/model'
import SimpleTable from '../SimpleTable'
import { Styles } from '../../libs/theme'
import {
  type CellData,
  DatasetSearchTableTab,
} from './DatasetSearchTableConstants'
import { SnapshotSummaryModel } from '../../types/tdrModel'
import { Storage } from '../../libs/storage'

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
  selected: number[]
  exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }
  tab: DatasetSearchTableTab<DatasetTerm | DatasetTerm[]>
}

export const DatasetSearchTableDisplay = (props: DatasetSearchTableDisplayProps) => {
  const { onSelect, exportableDatasets, filteredData, selected, tab } = props
  const [sort, setSort] = React.useState<Sort>(getSortForTab(tab.key))
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

  const rowData = React.useMemo(() => {
    const baseData = tab.makeRows(filteredData, headers)
    return sortData(baseData, sort)
  }, [filteredData, headers, sort, sortData, tab])

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
        {rowData.length}
        {' '}
        {capitalize(rowData.length !== 1 ? tab.plural : tab.singular)}
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
                tableSize={10}
                summary={`faceted ${tab.singular} search table`}
                onSort={handleSort}
                sort={sort}
              />
            )
      }
    </>
  )
}
