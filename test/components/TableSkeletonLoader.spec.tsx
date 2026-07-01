import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TableSkeletonLoader from 'src/components/TableSkeletonLoader'

describe('TableSkeletonLoader', () => {
  const headerContent = <span>Header</span>
  const rowContent = <span>Loading row</span>

  it('renders the outer container with data-cy attribute', () => {
    const { container } = render(<TableSkeletonLoader tableHeader={headerContent} tableRowLoading={rowContent} />)
    expect(container.querySelector('[data-cy="table-skeleton-loader"]')).toBeInTheDocument()
  })

  it('renders the tableHeader content', () => {
    render(<TableSkeletonLoader tableHeader={<span>My Header</span>} tableRowLoading={rowContent} />)
    expect(screen.getByText('My Header')).toBeInTheDocument()
  })

  it('renders exactly 10 loading rows', () => {
    render(<TableSkeletonLoader tableHeader={headerContent} tableRowLoading={<span>Row</span>} />)
    expect(screen.getAllByText('Row')).toHaveLength(10)
  })

  it('renders the footer div as an empty element', () => {
    const { container } = render(<TableSkeletonLoader tableHeader={headerContent} tableRowLoading={rowContent} />)
    const footer = container.querySelector('[data-cy="table-skeleton-loader"] > div:last-child')
    expect(footer).toBeInTheDocument()
    expect(footer?.childElementCount).toBe(0)
  })

  it('first data row has no extra top border', () => {
    const { container } = render(<TableSkeletonLoader tableHeader={headerContent} tableRowLoading={rowContent} />)
    // children: [header-row, data-row-1..10, footer] — data-row-1 is at index 1 (2nd child)
    const firstDataRow = container.querySelector('[data-cy="table-skeleton-loader"] > div:nth-child(2)')
    expect(firstDataRow?.getAttribute('style')).not.toContain('rgba(109, 110, 112, 0.2)')
  })

  it('subsequent data rows have a distinct top border', () => {
    const { container } = render(<TableSkeletonLoader tableHeader={headerContent} tableRowLoading={rowContent} />)
    // data-row-2 is the 3rd child
    const secondDataRow = container.querySelector('[data-cy="table-skeleton-loader"] > div:nth-child(3)')
    expect(secondDataRow?.getAttribute('style')).toContain('rgba(109, 110, 112, 0.2)')
  })
})
