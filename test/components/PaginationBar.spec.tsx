import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import PaginationBar from 'src/components/PaginationBar'

const defaultProps = {
  pageCount: 10,
  currentPage: 3,
  tableSize: 25,
  goToPage: vi.fn(),
  changeTableSize: vi.fn(),
}

describe('PaginationBar', () => {
  it('renders Prev and Next buttons and page count', () => {
    render(<PaginationBar {...defaultProps} />)
    expect(screen.getByText('Prev')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText(/of\s+10/)).toBeInTheDocument()
  })

  it('sets the current page input to the currentPage prop', () => {
    render(<PaginationBar {...defaultProps} />)
    const pageInput = screen.getByRole('textbox', { name: /current page number/i }) as HTMLInputElement
    expect(pageInput.defaultValue).toBe('3')
  })

  it('sets the rows-per-page input to the tableSize prop', () => {
    render(<PaginationBar {...defaultProps} />)
    const sizeInput = screen.getByRole('textbox', { name: /rows per page/i }) as HTMLInputElement
    expect(sizeInput.defaultValue).toBe('25')
  })

  it('calls goToPage with currentPage - 1 when Prev is clicked', () => {
    const goToPage = vi.fn()
    render(<PaginationBar {...defaultProps} goToPage={goToPage} currentPage={3} />)
    fireEvent.click(screen.getByText('Prev'))
    expect(goToPage).toHaveBeenCalledWith(2)
  })

  it('calls goToPage with currentPage + 1 when Next is clicked', () => {
    const goToPage = vi.fn()
    render(<PaginationBar {...defaultProps} goToPage={goToPage} currentPage={3} />)
    fireEvent.click(screen.getByText('Next'))
    expect(goToPage).toHaveBeenCalledWith(4)
  })

  it('calls changeTableSize with the numeric value when rows-per-page input changes', () => {
    const changeTableSize = vi.fn()
    render(<PaginationBar {...defaultProps} changeTableSize={changeTableSize} />)
    const sizeInput = screen.getByRole('textbox', { name: /rows per page/i })
    fireEvent.change(sizeInput, { target: { value: '50' } })
    expect(changeTableSize).toHaveBeenCalledWith(50)
  })

  it('updates input values when props change', () => {
    const { rerender } = render(<PaginationBar {...defaultProps} currentPage={1} tableSize={10} />)
    rerender(<PaginationBar {...defaultProps} currentPage={5} tableSize={50} />)
    const pageInput = screen.getByRole('textbox', { name: /current page number/i }) as HTMLInputElement
    const sizeInput = screen.getByRole('textbox', { name: /rows per page/i }) as HTMLInputElement
    expect(pageInput.value).toBe('5')
    expect(sizeInput.value).toBe('50')
  })
})
