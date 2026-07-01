import React from 'react'
import { Styles } from 'src/libs/theme'

export interface TableSkeletonLoaderProps {
  tableHeader: React.ReactNode
  tableRowLoading: React.ReactNode
}

export default function TableSkeletonLoader({ tableHeader, tableRowLoading }: Readonly<TableSkeletonLoaderProps>) {
  const blockStyleOverwrite: React.CSSProperties = {
    display: 'flex',
    height: '48px',
  }

  const tableRowStyle: React.CSSProperties = { ...Styles.TABLE.RECORD_ROW, ...blockStyleOverwrite }
  const modifiedTableRowStyle: React.CSSProperties = { ...tableRowStyle, borderTop: '1px solid rgba(109, 110, 112, 0.2)' }

  const rows: React.ReactNode[] = [
    <div key="row-loader-0" style={Styles.TABLE.HEADER_ROW}>{tableHeader}</div>,
  ]

  for (let i = 1; i <= 10; i++) {
    const targetStyle = i > 1 ? modifiedTableRowStyle : tableRowStyle
    rows.push(
      <div style={targetStyle} key={`row-loader-${i}`}>
        {tableRowLoading}
      </div>,
    )
  }

  rows.push(<div key="row-loader-footer" style={Styles.TABLE.FOOTER} />)

  return <div data-cy="table-skeleton-loader" style={Styles.TABLE.CONTAINER}>{rows}</div>
}
