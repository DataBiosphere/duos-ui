import React from 'react'
import { isNil } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material'
import { SpinnerComponent } from 'src/components/SpinnerComponent'
import loadingImage from 'src/images/loading-indicator.svg'

export interface SortConfig {
  colIndex: number
  dir: number
}

export interface CellData {
  data: React.ReactNode
  id?: number | string
  label?: string
  style?: React.CSSProperties
  onClick?: (rowIndex: number) => void
  isComponent?: boolean
  striped?: boolean
}

export interface ColumnHeader {
  label: React.ReactNode
  cellStyle?: React.CSSProperties
  sortable?: boolean
  data?: React.ReactNode
}

export interface TableStyles {
  baseStyle: React.CSSProperties
  columnStyle?: React.CSSProperties
  containerOverride?: React.CSSProperties
}

interface RowWrapperArgs {
  renderedRow: React.ReactElement
  rowData: CellData[]
}

interface SimpleTableProps {
  columnHeaders?: ColumnHeader[]
  rowData?: CellData[][]
  isLoading?: boolean
  styles: TableStyles
  rowWrapper?: (args: RowWrapperArgs) => React.ReactNode
  paginationBar?: React.ReactNode
  sort?: SortConfig
  onSort?: (sort: SortConfig) => void
  tableSize?: number
}

const TableLoading = () => (
  <div className="table-loading-placeholder">
    <SpinnerComponent show={true} name="loadingSpinner" loadingImage={loadingImage} />
  </div>
)

interface SimpleTextCellProps {
  text: React.ReactNode
  style?: React.CSSProperties
}

const SimpleTextCell = ({ text, style }: SimpleTextCellProps) => {
  const display = isNil(text) ? '- -' : text
  return <div style={style} role="cell">{display}</div>
}

interface OnClickTextCellProps {
  text: React.ReactNode
  style?: React.CSSProperties
  onClick: () => void
}

const buttonReset: React.CSSProperties = { background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }

const OnClickTextCell = ({ text, style, onClick }: OnClickTextCellProps) => {
  const display = isNil(text) ? '- -' : text
  return (
    <button style={{ ...buttonReset, ...style }} onClick={onClick} type="button" role="cell">
      {display}
    </button>
  )
}

interface ColumnRowProps {
  columnHeaders: ColumnHeader[]
  baseStyle?: React.CSSProperties
  columnStyle?: React.CSSProperties
  sort?: SortConfig
  onSort?: (sort: SortConfig) => void
}

const sortButtonReset: React.CSSProperties = { background: 'none', border: 'none', padding: 0 }

interface HeaderCellContentProps {
  header: ColumnHeader
  colIndex: number
  sort?: SortConfig
  onSort?: (sort: SortConfig) => void
}

const HeaderCellContent = ({ header, colIndex, sort, onSort }: HeaderCellContentProps) => {
  const { label, data } = header
  if (header.sortable && onSort && sort) {
    return (
      <button
        type="button"
        style={{ ...sortButtonReset, ...Styles.TABLE.HEADER_SORT }}
        className="cell-sort"
        onClick={() => onSort({ colIndex, dir: sort.colIndex === colIndex ? sort.dir * -1 : 1 })}
      >
        {label}
        <div className="sort-container">
          <ArrowDropUp className={`sort-icon sort-icon-up ${sort.colIndex === colIndex && sort.dir === -1 ? 'active' : ''}`} />
          <ArrowDropDown className={`sort-icon sort-icon-down ${sort.colIndex === colIndex && sort.dir === 1 ? 'active' : ''}`} />
        </div>
      </button>
    )
  }
  if (data) {
    return (
      <li className="dropdown" style={{ listStyleType: 'none' }}>
        <button type="button" style={sortButtonReset} data-toggle="dropdown">
          <div id="dacUser">
            {label}
            <span className="caret caret-margin" style={{ color: '#337ab7' }}></span>
          </div>
        </button>
        {data}
      </li>
    )
  }
  return <>{label}</>
}

const ColumnRow = ({ columnHeaders, baseStyle, columnStyle, sort, onSort }: ColumnRowProps) => {
  const rowStyle = { ...baseStyle, ...columnStyle }
  return (
    <div style={rowStyle} role="row">
      {columnHeaders.map((header, colIndex) => (
        <div style={header.cellStyle} key={`column-row-${colIndex}`} className="column-header">
          <HeaderCellContent header={header} colIndex={colIndex} sort={sort} onSort={onSort} />
        </div>
      ))}
    </div>
  )
}

interface DataRowsProps {
  rowData: CellData[][]
  baseStyle: React.CSSProperties
  columnHeaders: ColumnHeader[]
  rowWrapper: (args: RowWrapperArgs) => React.ReactNode
}

const DataRows = ({ rowData, baseStyle, columnHeaders, rowWrapper }: DataRowsProps) => (
  <>
    {rowData.map((row, index) => {
      const firstCell = row[0]
      const mapKey = firstCell?.id ?? `noId-index-${index}`
      const rowStyle: React.CSSProperties = { borderTop: '1px solid #f3f6f7', ...baseStyle }
      if (firstCell?.striped) {
        rowStyle.backgroundColor = index % 2 === 0 ? 'white' : '#F7F8F9'
      }
      const renderedRow = (
        <div style={rowStyle} key={`row-data-${mapKey}`} role="row" className={`row-data-${index}`}>
          {row.map(({ data, style, onClick, isComponent, id, label }, cellIndex) => {
            // columnHeaders determine column widths — extract width and apply to each cell
            // defensive: column headers may not match row data length when hiding columns in narrow viewports
            const columnHeader = columnHeaders[cellIndex]
            if (!columnHeader?.cellStyle) return null
            const columnWidthStyle = { width: columnHeader.cellStyle.width }
            const appliedStyle = { ...style, ...columnWidthStyle }
            if (isComponent) {
              // component cells use columnWidth only — component manages its own internal style
              const element = data as React.ReactElement | null
              const componentKey = element?.key ?? `component-${index}-${cellIndex}`
              return (
                <div role="cell" style={columnWidthStyle} key={`${componentKey}-container`}>
                  {data}
                </div>
              )
            }
            if (isNil(onClick)) {
              return <SimpleTextCell text={data} style={appliedStyle} key={`filtered-list-simple-${id}-${label}-${cellIndex}`} />
            }
            return <OnClickTextCell text={data} style={appliedStyle} onClick={() => onClick(index)} key={`filtered-list-click-${id}-${label}-${cellIndex}`} />
          }).filter(Boolean)}
        </div>
      )
      return rowWrapper({ renderedRow, rowData: row })
    })}
  </>
)

// rowData: array of arrays — outer = rows, inner = cells per row, each cell: { data, style, onClick, isComponent, ... }
// columnHeaders: [{ label, cellStyle }] — cellStyle sets column dimensions; cell rendering uses those widths
// rowWrapper: ({ renderedRow, rowData }) => ReactNode — allows injecting a custom container around each row
export default function SimpleTable({
  columnHeaders = [],
  rowData = [],
  isLoading,
  styles,
  rowWrapper = ({ renderedRow }) => renderedRow,
  paginationBar,
  sort,
  onSort,
}: Readonly<SimpleTableProps>) {
  const { baseStyle, columnStyle, containerOverride } = styles
  const columnRow = (
    <ColumnRow
      key="column-row-container"
      columnHeaders={columnHeaders}
      baseStyle={baseStyle}
      columnStyle={columnStyle}
      sort={sort}
      onSort={onSort}
    />
  )
  const tableTemplate = [
    columnRow,
    <DataRows key="table-data-rows" rowData={rowData} baseStyle={baseStyle} columnHeaders={columnHeaders} rowWrapper={rowWrapper} />,
  ]
  return (
    <div>
      <div className="table-data" style={containerOverride ?? Styles.TABLE.CONTAINER} role="table" data-cy="simple-table">
        {isLoading ? <TableLoading /> : tableTemplate}
        {isNil(paginationBar) ? <div /> : paginationBar}
      </div>
      <ReactTooltip place="left" className="tooltip-wrapper" />
    </div>
  )
}
