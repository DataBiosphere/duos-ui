import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { Maintainer, Presenter, Author, ClinicalTrial } from 'src/types/model'
import {
  renderColumnContent,
  renderMaintainer,
  renderUrl,
  renderValue,
  renderArray,
  renderPresenter,
  renderAuthors,
} from 'src/utils/RenderUtils'

const renderInDiv = (node: React.ReactNode) => render(<div>{node}</div>)

describe('renderMaintainer', () => {
  it('renders maintainer with email', () => {
    const maintainer: Maintainer = { name: 'John Doe', email: 'john@example.com' }
    const { container } = renderInDiv(renderMaintainer(maintainer))
    expect(container).toHaveTextContent('John Doe (john@example.com)')
  })

  it('renders maintainer without email', () => {
    const maintainer: Maintainer = { name: 'Jane Doe', email: 'jdoe@example.com' }
    const { container } = renderInDiv(renderMaintainer(maintainer))
    expect(container).toHaveTextContent('Jane Doe')
  })

  it('renders em dash for null or invalid input', () => {
    expect(renderMaintainer(null)).toBe('—')
    expect(renderMaintainer('invalid')).toBe('—')
  })
})

describe('renderUrl', () => {
  it('renders valid URL as link', () => {
    const url = 'https://example.com'
    const { container } = renderInDiv(renderUrl(url))
    const link = container.querySelector(`a[href="${url}"]`)
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent(url)
  })

  it('renders unsafe URL as inert text', () => {
    const url = 'javascript:alert(1)'
    const { container } = renderInDiv(renderUrl(url))
    expect(container.querySelector('a')).not.toBeInTheDocument()
    expect(container).toHaveTextContent(url)
  })

  it('renders em dash for empty or null URL', () => {
    expect(renderUrl('')).toBe('—')
    expect(renderUrl(null)).toBe('—')
  })
})

describe('renderValue', () => {
  it('renders string value', () => {
    expect(renderValue('test')).toBe('test')
  })

  it('renders em dash for empty or null value', () => {
    expect(renderValue('')).toBe('—')
    expect(renderValue(null)).toBe('—')
  })
})

describe('renderArray', () => {
  it('renders array as comma-separated string', () => {
    expect(renderArray(['a', 'b', 'c'])).toBe('a, b, c')
  })

  it('renders em dash for empty or null array', () => {
    expect(renderArray([])).toBe('—')
    expect(renderArray(null)).toBe('—')
  })
})

describe('renderPresenter', () => {
  it('renders presenter with email', () => {
    const presenter: Presenter = { name: 'Alice Smith', email: 'alice@example.com' }
    const { container } = renderInDiv(renderPresenter(presenter))
    expect(container).toHaveTextContent('Alice Smith (alice@example.com)')
  })

  it('renders presenter without email', () => {
    const presenter: Presenter = { name: 'Bob Johnson', email: 'bjohnson@example.com' }
    const { container } = renderInDiv(renderPresenter(presenter))
    expect(container).toHaveTextContent('Bob Johnson')
  })

  it('renders em dash for null or invalid input', () => {
    expect(renderPresenter(null)).toBe('—')
    expect(renderPresenter('invalid')).toBe('—')
  })
})

describe('renderAuthors', () => {
  it('renders multiple authors', () => {
    const authors: Author[] = [
      { name: 'Author One', orcId: '0000-0001-1234-5678' },
      { name: 'Author Two', orcId: '0000-0002-1234-5678' },
    ]
    const { container } = renderInDiv(renderAuthors(authors))
    expect(container).toHaveTextContent('Author One, Author Two')
  })

  it('renders single author', () => {
    const authors: Author[] = [{ name: 'Solo Author' }]
    const { container } = renderInDiv(renderAuthors(authors))
    expect(container).toHaveTextContent('Solo Author')
  })

  it('renders em dash for empty or null array', () => {
    expect(renderAuthors([])).toBe('—')
    expect(renderAuthors(null)).toBe('—')
  })
})

describe('renderColumnContent', () => {
  it('renders maintainer column', () => {
    const maintainer: Maintainer = { name: 'Test User', email: 'test@example.com' }
    const { container } = renderInDiv(renderColumnContent('maintainer', maintainer))
    expect(container).toHaveTextContent('Test User (test@example.com)')
  })

  it('renders array columns', () => {
    expect(renderColumnContent('trainedOnDatasets', ['ds1', 'ds2'])).toBe('ds1, ds2')
    expect(renderColumnContent('tags', ['tag1', 'tag2'])).toBe('tag1, tag2')
    expect(renderColumnContent('tools', ['tool1', 'tool2'])).toBe('tool1, tool2')
  })

  it('renders url column', () => {
    const url = 'https://test.com'
    const { container } = renderInDiv(renderColumnContent('url', url))
    const link = container.querySelector(`a[href="${url}"]`)
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent(url)
  })

  it('renders dateRange column', () => {
    const clinicalTrial: Partial<ClinicalTrial> = {
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    }
    expect(renderColumnContent('dateRange', undefined, clinicalTrial)).toBe('2023-01-01 → 2024-01-01')
  })

  it('renders dateRange with missing dates', () => {
    const clinicalTrial: Partial<ClinicalTrial> = { startDate: '2023-01-01' }
    expect(renderColumnContent('dateRange', undefined, clinicalTrial)).toBe('2023-01-01 → N/A')
  })

  it('renders presenter column', () => {
    const presenter: Presenter = { name: 'Presenter Name', email: 'presenter@example.com' }
    const { container } = renderInDiv(renderColumnContent('presenter', presenter))
    expect(container).toHaveTextContent('Presenter Name (presenter@example.com)')
  })

  it('renders authors column', () => {
    const authors: Author[] = [{ name: 'Author One' }, { name: 'Author Two' }]
    const { container } = renderInDiv(renderColumnContent('authors', authors))
    expect(container).toHaveTextContent('Author One, Author Two')
  })

  it('renders array of objects', () => {
    const arr = [{ a: 1 }, { b: 2 }]
    const result = renderColumnContent('col', arr)
    expect(result).toBe(JSON.stringify(arr[0]) + ', ' + JSON.stringify(arr[1]))
  })

  it('renders array of strings', () => {
    const arr = ['a', 'b']
    expect(renderColumnContent('col', arr)).toBe('a, b')
  })

  it('renders null and undefined as em dash', () => {
    expect(renderColumnContent('col', null)).toBe('—')
    expect(renderColumnContent('col', undefined)).toBe('—')
  })

  it('renders object as JSON string', () => {
    expect(renderColumnContent('col', { a: 1 })).toBe(JSON.stringify({ a: 1 }))
  })

  it('renders string and number', () => {
    expect(renderColumnContent('col', 'abc')).toBe('abc')
    expect(renderColumnContent('col', 123)).toBe('123')
  })
})
