import { Tooltip as ReactTooltip } from 'react-tooltip'
import React from 'react'
import { InstitutionInterface, SimplifiedDuosUser } from 'src/types/model'
import { Link } from 'react-router-dom'
import { Storage } from 'src/libs/storage'
import { isEmpty } from 'lodash'

// Sort functionality for the institution table.
export interface SortType {
  colIndex: number
  dir: number
}

interface StorageSort {
  field: string
  dir: number
}

// Sort functionality for the institution table.
export const storageInstitutionSort = 'storageInstitutionSort'

// Sort functionality for the institution table.
export const getInitialSort = (columns: string[] = []): SortType => {
  const sort = Storage.getCurrentUserSettings<StorageSort>(storageInstitutionSort) ?? {
    field: 'name',
    dir: 1,
  }
  const sortIndex = columns.indexOf(sort.field)
  if (sortIndex !== -1) {
    return { colIndex: sortIndex, dir: sort.dir }
  }
  else {
    return { colIndex: 0, dir: 1 }
  }
}

/**
 * ColumnConfig defines a map of column names to their configuration.
 */
interface ColumnConfig {
  [key: string]: ColumnConfigCell
}

/**
 * ColumnConfigCell defines the configuration for each cell in a column.
 * It includes the label for the column, the style for the cell, a function to get the cell data,
 *
 */
interface ColumnConfigCell {
  label: string
  cellStyle: React.CSSProperties
  cellDataFn: (row: InstitutionInterface) => React.ReactNode
  sortable?: boolean
  sortValueFn?: (row: InstitutionInterface) => React.ReactNode
}

/**
 * SimpleTable requires a matrix of CellData objects to render the table.
 * Each row is an array of CellData objects, where each object represents a cell in that row.
 * The value property is used for sorting, and the data property is the actual content to be displayed in the cell
 * which allows for complex content like links or formatted text in the cell but still allows for sorting on
 * a simple string or number value. See utils.sortVisibleTable for more details.
 */
export interface CellData {
  data: React.ReactNode
  id: number
  cellStyle: React.CSSProperties
  label: string
  value: string | number
}

/**
 * Standardized table column widths that can be adjusted and re-used across different components.
 */
const columnWidths = {
  id: '5%',
  name: '25%',
  domains: '15%',
  signingOfficials: '25%',
  updateUser: '18%',
  updateDate: '12%',
}

const baseTemplateStyle = {
  margin: '1rem 2%',
}

// Template used for a skeleton loader that shows a loading state for the table.
export const tableHeaderTemplate = (
  <>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.id } }}>ID</div>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.name } }}>Institution</div>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.domains } }}>Domains</div>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.signingOfficials } }}>Signing Officials</div>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.updateUser } }}>Update User</div>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.updateDate } }}>Updated On</div>
  </>
)

// Template used for a skeleton loader that shows a loading state for the table.
export const tableRowLoadingTemplate = (
  <>
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.id } }} className="text-placeholder" />
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.name } }} className="text-placeholder" />
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.domains } }} className="text-placeholder" />
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.signingOfficials } }} className="text-placeholder" />
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.updateUser } }} className="text-placeholder" />
    <div style={{ ...baseTemplateStyle, ...{ width: columnWidths.updateDate } }} className="text-placeholder" />
  </>
)

export const tableStyles = {
  baseStyle: {
    fontSize: '1.5rem',
    display: 'flex',
    padding: '1rem 2%',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    margin: '0.5% 0',
  },
  columnStyle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    color: '#7B7B7B',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    backgroundColor: 'B8CDD3',
    border: 'none',
  },
}

/**
 * The primary configuration for the columns in the institution table.
 */
export const columnConfig: ColumnConfig = {
  id: {
    label: 'ID',
    cellStyle: { width: columnWidths.id },
    cellDataFn: (row: InstitutionInterface) => row.id,
    sortable: true,
    sortValueFn: (row: InstitutionInterface) => row.id,
  },
  name: {
    label: 'Institution',
    cellStyle: { width: columnWidths.name },
    cellDataFn: (row: InstitutionInterface) => {
      if (row) {
        return (
          <Link
            to={{ pathname: `/admin_manage_institutions/institutions/${row.id}` }}
            style={{
              textDecoration: 'none',
              color: '#1f75b6',
              cursor: 'pointer',
            }}
          >
            {row.name}
          </Link>
        )
      }
      else {
        return '- -'
      }
    },
    sortable: true,
    sortValueFn: (row: InstitutionInterface) => row.name,
  },
  domains: {
    label: 'Domains',
    cellStyle: { width: columnWidths.domains },
    cellDataFn: (row: InstitutionInterface) => {
      if (row?.domains) {
        return row.domains.toSorted((a: string, b: string) => {
          return a.localeCompare(b)
        }).join(', ')
      }
      else {
        return '- -'
      }
    },
    sortable: true,
    sortValueFn: (row: InstitutionInterface) => {
      if (row?.domains) {
        return row.domains.toSorted((a: string, b: string) => {
          return a.localeCompare(b)
        }).join(', ')
      }
      else {
        return 'zzz'
      }
    },
  },
  signingOfficials: {
    label: 'Signing Officials',
    cellStyle: { width: columnWidths.signingOfficials },
    cellDataFn: (row: InstitutionInterface) => {
      if (row.signingOfficials && row.signingOfficials.length > 0) {
        const fullNames = row.signingOfficials.map((user: SimplifiedDuosUser) => `${user.displayName} (${user.email})`).join(', ')
        if (fullNames.length > 40) {
          return (
            <div>
              <span data-tip data-for={`signing-officials-tooltip-${row.id}`} className="tooltip-text">
                {fullNames.slice(0, 40)}
                ...
              </span>
              <ReactTooltip
                place="right"
                effect="solid"
                id={`signing-officials-tooltip-${row.id}`}
              >
                <span>
                  <ul>
                    {row.signingOfficials.map((user: SimplifiedDuosUser) => {
                      return (
                        <li key={user.email}>
                          {user.displayName}
                          {' '}
                          (
                          {user.email}
                          )
                        </li>
                      )
                    })}
                  </ul>
                </span>
              </ReactTooltip>
            </div>
          )
        }
        else {
          return fullNames
        }
      }
      else {
        return '- -'
      }
    },
  },
  updateUser: {
    label: 'Updated By',
    cellStyle: { width: columnWidths.updateUser },
    cellDataFn: (row: InstitutionInterface) => {
      const user = isEmpty(row.updateUser) ? row.createUser : row.updateUser
      return user?.displayName ?? '- -'
    },
    sortable: true,
    sortValueFn: (row: InstitutionInterface) => {
      const user = isEmpty(row.updateUser) ? row.createUser : row.updateUser
      return user?.displayName ?? 'zz' // 'zz' ensures that institutions without a user appear at the end of the list
    },
  },
  updateDate: {
    label: 'Updated On',
    cellStyle: { width: columnWidths.updateDate },
    cellDataFn: (row: InstitutionInterface) => {
      if (row?.updateDate) {
        return row.updateDate
      }
      else if (row?.createDate) {
        return row.createDate
      }
      else {
        return '- -'
      }
    },
    sortable: true,
    sortValueFn: (row: InstitutionInterface) => {
      // Institution dates are in the form of 'Mon D, YYYY', e.g. 'Jan 1, 2023'
      const dateString = row.updateDate || row.createDate
      if (dateString) {
        const date = new Date(dateString)
        return date.getTime()
      }
      return 0
    },
  },
}

/**
 * processRowData takes a row of type Institution and returns an array of CellData objects.
 * SimpleTable expects each row to be an array of CellData objects, where each object contains the data to be displayed
 * in the cell.
 * @param row Row of institution data to be processed.
 */
export const processRowData = (row: InstitutionInterface): CellData[] => {
  const rowData: CellData[] = []
  Object.keys(columnConfig).forEach((col) => {
    const { cellDataFn, cellStyle, label, sortValueFn } = columnConfig[col]
    rowData.push({
      data: cellDataFn(row),
      id: row.id,
      cellStyle: cellStyle,
      label: label,
      value: sortValueFn ? sortValueFn(row) : 'zz',
    } as CellData)
  })
  return rowData
}

/*
 * Utility functions for the Institution Table.
 */

export const calcPageCount = (tableSize: number, filteredList: InstitutionInterface[]) => {
  if (isEmpty(filteredList)) {
    return 1
  }
  return Math.ceil(filteredList.length / tableSize)
}

export const columns = Object.keys(columnConfig)

export const columnHeaderData = (columns: string[]) => {
  return columns.map(col => columnConfig[col])
}

export const processRows = (institutions: InstitutionInterface[]): CellData[][] => {
  return institutions.map((institution) => {
    return processRowData(institution)
  })
}
