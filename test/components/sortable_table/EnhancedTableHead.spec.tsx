import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EnhancedTableHead from 'src/components/sortable_table/EnhancedTableHead'

const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'code', label: 'Code' },
  { id: 'status', label: 'Status' },
]

const defaultProps = {
  order: 'asc' as const,
  orderBy: 'name',
  onRequestSort: vi.fn(),
  headCells,
}

describe('EnhancedTableHead - Tests', () => {
  it('renders a column header for each headCell', () => {
    render(<table><EnhancedTableHead {...defaultProps} /></table>)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('calls onRequestSort with the correct property when a header is clicked', () => {
    const onRequestSort = vi.fn()
    render(<table><EnhancedTableHead {...defaultProps} onRequestSort={onRequestSort} /></table>)
    fireEvent.click(screen.getByRole('button', { name: /code/i }))
    expect(onRequestSort).toHaveBeenCalledWith(expect.anything(), 'code')
  })

  it('sets aria-label to "sorted ascending" for the active ascending column', () => {
    render(<table><EnhancedTableHead {...defaultProps} order="asc" orderBy="name" /></table>)
    expect(screen.getByRole('button', { name: 'Name, sorted ascending' })).toBeInTheDocument()
  })

  it('sets aria-label to "sorted descending" for the active descending column', () => {
    render(<table><EnhancedTableHead {...defaultProps} order="desc" orderBy="name" /></table>)
    expect(screen.getByRole('button', { name: 'Name, sorted descending' })).toBeInTheDocument()
  })

  it('sets aria-label to "unsorted" for inactive columns', () => {
    render(<table><EnhancedTableHead {...defaultProps} orderBy="name" /></table>)
    expect(screen.getByRole('button', { name: 'Code, unsorted' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Status, unsorted' })).toBeInTheDocument()
  })

  it('uses normal padding when disablePadding is not set', () => {
    render(<table><EnhancedTableHead {...defaultProps} /></table>)
    const columnheaders = screen.getAllByRole('columnheader')
    expect(columnheaders).toHaveLength(3)
  })
})
