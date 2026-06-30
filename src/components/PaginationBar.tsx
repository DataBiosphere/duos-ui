import React, { useRef, useEffect, CSSProperties } from 'react'
import { toNumber } from 'src/utils/NodashUtil'
import { Styles, Theme } from 'src/libs/theme'

const INPUT_STYLE = Styles.TABLE.PAGINATION_INPUT as CSSProperties

const NAV_BUTTON: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: Theme.palette.primary,
  fontFamily: 'inherit',
  fontSize: 'inherit',
}

interface PaginationBarProps {
  pageCount: number
  currentPage: number
  tableSize: number
  goToPage: (page: number) => void
  changeTableSize: (value: number) => void
}

export default function PaginationBar(props: Readonly<PaginationBarProps>) {
  const { pageCount, goToPage, changeTableSize } = props
  const currentPage = useRef<HTMLInputElement>(null)
  const tableSize = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentPage.current) currentPage.current.value = String(props.currentPage)
    if (tableSize.current) tableSize.current.value = String(props.tableSize)
  }, [props.currentPage, props.tableSize])

  return (
    <div style={Styles.TABLE.FOOTER}>
      <div style={Styles.TABLE.PAGINATION_SECTION_OFFSET}></div>
      <div style={Styles.TABLE.PAGINATION_BUTTON_SECTION}>
        <div style={Styles.TABLE.PAGINATION_BUTTON}>
          <button
            type="button"
            style={NAV_BUTTON}
            onClick={() => goToPage(toNumber(currentPage.current?.value) - 1)}
          >
            Prev
          </button>
        </div>
        <div style={Styles.TABLE.PAGINATION_CURRENT_PAGE}>
          <span>Page </span>
          <input
            onChange={() => goToPage(toNumber(currentPage.current?.value))}
            type="text"
            ref={currentPage}
            defaultValue={props.currentPage}
            style={INPUT_STYLE}
            aria-label="Current page number"
          />
          <span>
            {' '}
            of
            {' '}
            {pageCount}
          </span>
        </div>
        <div style={Styles.TABLE.PAGINATION_BUTTON}>
          <button
            type="button"
            style={NAV_BUTTON}
            onClick={() => goToPage(toNumber(currentPage.current?.value) + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <div style={Styles.TABLE.PAGINATION_TABLE_SIZE_SECTION}>
        <span style={{ marginRight: '2%' }}>Rows per page: </span>
        <input
          onChange={() => changeTableSize(toNumber(tableSize.current?.value))}
          type="text"
          ref={tableSize}
          defaultValue={props.tableSize}
          style={INPUT_STYLE}
          aria-label="Rows per page"
        />
      </div>
    </div>
  )
}
