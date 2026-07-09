import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { TableHeaderSection } from 'src/components/TableHeaderSection'

describe('TableHeaderSection', () => {
  const mockIcon = {
    src: '/test-icon.png',
    width: 64,
    height: 64,
  }

  it('renders title and description', () => {
    render(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )
    expect(screen.getByText('Test Title')).toBeVisible()
    expect(screen.getByText('Test Description')).toBeVisible()
  })

  it('renders icon when provided', () => {
    const { container } = render(
      <TableHeaderSection
        icon={mockIcon}
        title="Test Title"
        description="Test Description"
      />,
    )
    const img = container.querySelector('img[alt="Dataset Icon"]') as HTMLImageElement
    expect(img).toBeVisible()
    expect(img).toHaveAttribute('src', mockIcon.src)
  })

  it('does not render icon when not provided', () => {
    const { container } = render(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )
    expect(container.querySelector('img[alt="Dataset Icon"]')).not.toBeInTheDocument()
  })

  it('does not render icon when src is missing', () => {
    const { container } = render(
      <TableHeaderSection
        icon={{ src: '', width: 64 }}
        title="Test Title"
        description="Test Description"
      />,
    )
    expect(container.querySelector('img[alt="Dataset Icon"]')).not.toBeInTheDocument()
  })

  it('applies custom width and height to icon', () => {
    const { container } = render(
      <TableHeaderSection
        icon={{ src: '/test.png', width: 100, height: 50 }}
        title="Test Title"
        description="Test Description"
      />,
    )
    const img = container.querySelector('img[alt="Dataset Icon"]') as HTMLImageElement
    expect(img).toHaveStyle({ width: '100px', height: '50px' })
  })

  it('renders React nodes as title and description', () => {
    const titleNode = <span>Custom Title</span>
    const descNode = <span>Custom Description</span>
    render(
      <TableHeaderSection
        title={titleNode}
        description={descNode}
      />,
    )
    expect(screen.getByText('Custom Title')).toBeVisible()
    expect(screen.getByText('Custom Description')).toBeVisible()
  })

  it('has correct data-cy attributes', () => {
    const { container } = render(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )
    const titleEl = container.querySelector('[data-cy="table-header-title"]')
    const descEl = container.querySelector('[data-cy="table-header-description"]')
    expect(titleEl).toBeVisible()
    expect(titleEl).toHaveTextContent('Test Title')
    expect(descEl).toBeVisible()
    expect(descEl).toHaveTextContent('Test Description')
  })
})
