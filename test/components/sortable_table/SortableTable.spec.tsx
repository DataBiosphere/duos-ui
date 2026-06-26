import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import SortableTable from 'src/components/sortable_table/SortableTable'

const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'code', label: 'Code' },
  { id: 'status', label: 'Status' },
]

const rows = [
  { name: 'Charlie', code: 'C-003', status: 'Closed' },
  { name: 'Alice', code: 'A-001', status: 'Open' },
  { name: 'Bob', code: 'B-002', status: 'Pending' },
]

describe('SortableTable - Tests', () => {
  beforeEach(() => {
    render(<SortableTable rows={rows} headCells={headCells} defaultSort="name" />)
  })

  it('renders a column header for each headCell', () => {
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders all row data', () => {
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('renders rows sorted ascending by defaultSort on initial render', () => {
    const cells = screen.getAllByRole('rowgroup')[1]
    const rowEls = within(cells).getAllByRole('row')
    expect(rowEls[0]).toHaveTextContent('Alice')
    expect(rowEls[1]).toHaveTextContent('Bob')
    expect(rowEls[2]).toHaveTextContent('Charlie')
  })

  it('sorts descending when the active sort column header is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    const cells = screen.getAllByRole('rowgroup')[1]
    const rowEls = within(cells).getAllByRole('row')
    expect(rowEls[0]).toHaveTextContent('Charlie')
    expect(rowEls[1]).toHaveTextContent('Bob')
    expect(rowEls[2]).toHaveTextContent('Alice')
  })

  it('sorts by a different column when its header is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /code/i }))
    const cells = screen.getAllByRole('rowgroup')[1]
    const rowEls = within(cells).getAllByRole('row')
    expect(rowEls[0]).toHaveTextContent('A-001')
    expect(rowEls[1]).toHaveTextContent('B-002')
    expect(rowEls[2]).toHaveTextContent('C-003')
  })

  it('shows the total row count in the pagination', () => {
    expect(screen.getByText(`1–${rows.length} of ${rows.length}`)).toBeInTheDocument()
  })
})
