import React from 'react'
import {
  renderColumnContent,
  renderMaintainer,
  renderUrl,
  renderValue,
  renderArray,
  renderPresenter,
  renderAuthors,
} from 'src/utils/RenderUtils'
import { Maintainer, Presenter, Author, ClinicalTrial } from 'src/types/model'

// Helper functions
function mountAndAssertText(element: React.ReactNode, expectedText: string) {
  cy.mount(<div>{element}</div>)
  cy.contains(expectedText).should('exist')
}

function mountAndAssertLink(element: React.ReactNode, href: string, text: string) {
  cy.mount(<div>{element}</div>)
  cy.get(`a[href="${href}"]`).should('contain', text)
}

describe('renderMaintainer', () => {
  it('renders maintainer with email', () => {
    const maintainer: Maintainer = { name: 'John Doe', email: 'john@example.com' }
    mountAndAssertText(renderMaintainer(maintainer), 'John Doe (john@example.com)')
  })

  it('renders maintainer without email', () => {
    const maintainer: Maintainer = { name: 'Jane Doe', email: 'jdoe@example.com' }
    mountAndAssertText(renderMaintainer(maintainer), 'Jane Doe')
  })

  it('renders em dash for null or invalid input', () => {
    expect(renderMaintainer(null)).to.deep.equal('—')
    expect(renderMaintainer('invalid')).to.deep.equal('—')
  })
})

describe('renderUrl', () => {
  it('renders valid URL as link', () => {
    const url = 'https://example.com'
    mountAndAssertLink(renderUrl(url), url, url)
  })

  it('renders em dash for empty or null URL', () => {
    expect(renderUrl('')).to.equal('—')
    expect(renderUrl(null)).to.equal('—')
  })
})

describe('renderValue', () => {
  it('renders string value', () => {
    expect(renderValue('test')).to.equal('test')
  })

  it('renders em dash for empty or null value', () => {
    expect(renderValue('')).to.equal('—')
    expect(renderValue(null)).to.equal('—')
  })
})

describe('renderArray', () => {
  it('renders array as comma-separated string', () => {
    expect(renderArray(['a', 'b', 'c'])).to.equal('a, b, c')
  })

  it('renders em dash for empty or null array', () => {
    expect(renderArray([])).to.equal('—')
    expect(renderArray(null)).to.equal('—')
  })
})

describe('renderPresenter', () => {
  it('renders presenter with email', () => {
    const presenter: Presenter = { name: 'Alice Smith', email: 'alice@example.com' }
    mountAndAssertText(renderPresenter(presenter), 'Alice Smith (alice@example.com)')
  })

  it('renders presenter without email', () => {
    const presenter: Presenter = { name: 'Bob Johnson', email: 'bjohnson@example.com' }
    mountAndAssertText(renderPresenter(presenter), 'Bob Johnson')
  })

  it('renders em dash for null or invalid input', () => {
    expect(renderPresenter(null)).to.deep.equal('—')
    expect(renderPresenter('invalid')).to.deep.equal('—')
  })
})

describe('renderAuthors', () => {
  it('renders multiple authors', () => {
    const authors: Author[] = [
      { name: 'Author One', orcId: '0000-0001-1234-5678' },
      { name: 'Author Two', orcId: '0000-0002-1234-5678' },
    ]
    cy.mount(<div>{renderAuthors(authors)}</div>)
    cy.contains('Author One, Author Two').should('exist')
  })

  it('renders single author', () => {
    const authors: Author[] = [{ name: 'Solo Author' }]
    mountAndAssertText(renderAuthors(authors), 'Solo Author')
  })

  it('renders em dash for empty or null array', () => {
    expect(renderAuthors([])).to.deep.equal('—')
    expect(renderAuthors(null)).to.deep.equal('—')
  })
})

describe('renderColumnContent', () => {
  it('renders maintainer column', () => {
    const maintainer: Maintainer = { name: 'Test User', email: 'test@example.com' }
    cy.mount(<div>{renderColumnContent('maintainer', maintainer)}</div>)
    cy.contains('Test User (test@example.com)').should('exist')
  })

  it('renders array columns', () => {
    expect(renderColumnContent('trainedOnDatasets', ['ds1', 'ds2'])).to.equal('ds1, ds2')
    expect(renderColumnContent('tags', ['tag1', 'tag2'])).to.equal('tag1, tag2')
    expect(renderColumnContent('tools', ['tool1', 'tool2'])).to.equal('tool1, tool2')
  })

  it('renders url column', () => {
    const url = 'https://test.com'
    mountAndAssertLink(renderColumnContent('url', url), url, url)
  })

  it('renders dateRange column', () => {
    const clinicalTrial: Partial<ClinicalTrial> = {
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    }
    expect(renderColumnContent('dateRange', undefined, clinicalTrial)).to.equal('2023-01-01 → 2024-01-01')
  })

  it('renders dateRange with missing dates', () => {
    const clinicalTrial: Partial<ClinicalTrial> = { startDate: '2023-01-01' }
    expect(renderColumnContent('dateRange', undefined, clinicalTrial)).to.equal('2023-01-01 → N/A')
  })

  it('renders presenter column', () => {
    const presenter: Presenter = { name: 'Presenter Name', email: 'presenter@example.com' }
    cy.mount(<div>{renderColumnContent('presenter', presenter)}</div>)
    cy.contains('Presenter Name (presenter@example.com)').should('exist')
  })

  it('renders authors column', () => {
    const authors: Author[] = [{ name: 'Author One' }, { name: 'Author Two' }]
    cy.mount(<div>{renderColumnContent('authors', authors)}</div>)
    cy.contains('Author One, Author Two').should('exist')
  })

  it('renders array of objects', () => {
    const arr = [{ a: 1 }, { b: 2 }]
    const result = renderColumnContent('col', arr)
    expect(result).to.equal(JSON.stringify(arr[0]) + ', ' + JSON.stringify(arr[1]))
  })

  it('renders array of strings', () => {
    const arr = ['a', 'b']
    const result = renderColumnContent('col', arr)
    expect(result).to.equal('a, b')
  })

  it('renders null and undefined as em dash', () => {
    expect(renderColumnContent('col', null)).to.equal('—')
    expect(renderColumnContent('col', undefined)).to.equal('—')
  })

  it('renders object as JSON string', () => {
    expect(renderColumnContent('col', { a: 1 })).to.equal(JSON.stringify({ a: 1 }))
  })

  it('renders string and number', () => {
    expect(renderColumnContent('col', 'abc')).to.equal('abc')
    expect(renderColumnContent('col', 123)).to.equal('123')
  })
})
