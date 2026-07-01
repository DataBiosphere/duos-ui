import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SimpleTable, { type CellData, type ColumnHeader, type TableStyles } from 'src/components/SimpleTable'

vi.mock('src/components/SpinnerComponent', () => ({
  SpinnerComponent: () => <div data-testid="spinner" />,
}))

vi.mock('react-tooltip', () => ({
  Tooltip: () => null,
}))

vi.mock('src/images/loading-indicator.svg', () => ({ default: 'loading.svg' }))

const baseStyles: TableStyles = {
  baseStyle: { display: 'flex' },
  columnStyle: { fontWeight: 700 },
}

const makeHeaders = (overrides: Partial<ColumnHeader>[] = []): ColumnHeader[] => [
  { label: 'Name', cellStyle: { width: '50%' }, ...overrides[0] },
  { label: 'Role', cellStyle: { width: '50%' }, ...overrides[1] },
]

const makeRow = (overrides: Partial<CellData>[] = []): CellData[][] => [[
  { data: 'Alice', id: 1, label: 'Name', ...overrides[0] },
  { data: 'Admin', id: 1, label: 'Role', ...overrides[1] },
]]

describe('SimpleTable', () => {
  it('renders the table container', () => {
    render(<SimpleTable styles={baseStyles} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('has the data-cy attribute for cypress selectors', () => {
    render(<SimpleTable styles={baseStyles} />)
    expect(screen.getByRole('table')).toHaveAttribute('data-cy', 'simple-table')
  })

  it('shows the spinner when isLoading is true', () => {
    render(<SimpleTable styles={baseStyles} isLoading={true} />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('does not show the spinner when not loading', () => {
    render(<SimpleTable styles={baseStyles} isLoading={false} />)
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
  })

  it('renders column headers', () => {
    render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('renders cell data in rows', () => {
    render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} rowData={makeRow()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders "- -" for nil cell values', () => {
    const row: CellData[][] = [[
      { data: null, id: 1, label: 'Name' },
      { data: 'Admin', id: 1, label: 'Role' },
    ]]
    render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} rowData={row} />)
    expect(screen.getByText('- -')).toBeInTheDocument()
  })

  it('calls onClick with the row index when an OnClickTextCell is clicked', () => {
    const onClick = vi.fn()
    const row: CellData[][] = [[
      { data: 'Click me', id: 1, label: 'Name', onClick },
      { data: 'Admin', id: 1, label: 'Role' },
    ]]
    render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} rowData={row} />)
    fireEvent.click(screen.getByText('Click me'))
    expect(onClick).toHaveBeenCalledWith(0)
  })

  it('renders component cells when isComponent is true', () => {
    const row: CellData[][] = [[
      { data: <span data-testid="custom-component">Custom</span>, id: 1, label: 'Name', isComponent: true },
      { data: 'Admin', id: 1, label: 'Role' },
    ]]
    render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} rowData={row} />)
    expect(screen.getByTestId('custom-component')).toBeInTheDocument()
  })

  it('renders a sortable header as a button', () => {
    const onSort = vi.fn()
    const headers = makeHeaders([{ sortable: true }])
    render(<SimpleTable styles={baseStyles} columnHeaders={headers} sort={{ colIndex: 0, dir: 1 }} onSort={onSort} />)
    const sortBtn = screen.getByRole('button', { name: /Name/i })
    expect(sortBtn).toBeInTheDocument()
  })

  it('calls onSort with toggled direction when a sort button is clicked', () => {
    const onSort = vi.fn()
    const headers = makeHeaders([{ sortable: true }])
    render(<SimpleTable styles={baseStyles} columnHeaders={headers} sort={{ colIndex: 0, dir: 1 }} onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Name/i }))
    expect(onSort).toHaveBeenCalledWith({ colIndex: 0, dir: -1 })
  })

  it('renders the paginationBar when provided', () => {
    render(
      <SimpleTable
        styles={baseStyles}
        paginationBar={<div data-testid="pagination">Page 1</div>}
      />,
    )
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('applies containerOverride style when provided', () => {
    const { container } = render(
      <SimpleTable
        styles={{ ...baseStyles, containerOverride: { backgroundColor: 'red' } }}
      />,
    )
    const tableDiv = container.querySelector('[role="table"]') as HTMLElement
    expect(tableDiv.style.backgroundColor).toBe('red')
  })

  it('skips cells whose column header is missing', () => {
    const headers = makeHeaders().slice(0, 1) // only Name header
    const row: CellData[][] = [[
      { data: 'Alice', id: 1, label: 'Name' },
      { data: 'Admin', id: 1, label: 'Role' }, // no matching header
    ]]
    render(<SimpleTable styles={baseStyles} columnHeaders={headers} rowData={row} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('applies striped row background for even/odd rows', () => {
    const rows: CellData[][] = [
      [{ data: 'Row 0', id: 0, label: 'Name', striped: true }, { data: 'A', id: 0, label: 'Role' }],
      [{ data: 'Row 1', id: 1, label: 'Name', striped: true }, { data: 'B', id: 1, label: 'Role' }],
    ]
    const { container } = render(<SimpleTable styles={baseStyles} columnHeaders={makeHeaders()} rowData={rows} />)
    const rowDivs = container.querySelectorAll('[role="row"].row-data-0, [role="row"].row-data-1')
    expect((rowDivs[0] as HTMLElement).style.backgroundColor).toBe('white')
    expect((rowDivs[1] as HTMLElement).style.backgroundColor).toBe('rgb(247, 248, 249)')
  })
})
