import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makePublicationColumns } from 'src/components/data_library/columns/publicationColumns'
import { PublicationAsset } from 'src/types/library'

const makeRow = (overrides: Partial<PublicationAsset> = {}): PublicationAsset => ({
  publicationId: 'pub-001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'A Novel Approach to Genomics',
  pubmedId: '12345678',
  publishedDate: '2024-01-15',
  authors: [{ name: 'Alice Smith' }, { name: 'Bob Jones' }],
  authorNames: ['Alice Smith', 'Bob Jones'],
  bibliographicCitation: 'Smith A, Jones B. 2024.',
  datasetCitation: 'DUOS-123456',
  citation: true,
  journal: 'Nature Genetics',
  doi: '10.1038/ng.1234',
  url: 'https://doi.org/10.1038/ng.1234',
  access: 'open',
  tags: [],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<PublicationAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<PublicationAsset>(makePublicationColumns, makeRow)

describe('makePublicationColumns — Title column', () => {
  it('renders the publication title as a link when url is present', () => {
    const { container } = renderCell('title', 'A Novel Genomics Study', { url: 'https://doi.org/10.1038/test' })
    const link = container.querySelector('a[href="https://doi.org/10.1038/test"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('A Novel Genomics Study')
  })

  it('renders plain text when url is absent', () => {
    const { container } = renderCell('title', 'No Link Title', { url: '' })
    expect(screen.getByText('No Link Title')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    const { container } = renderCell('title', 'Ext Link', { url: 'https://example.com/pub' })
    const link = container.querySelector('a[href="https://example.com/pub"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    const { container } = renderCell('title', '', { url: '' })
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makePublicationColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makePublicationColumns — Journal column', () => {
  it('renders the journal name', () => {
    renderCell('journal', 'Nature Genetics')
    expect(screen.getByText('Nature Genetics')).toBeInTheDocument()
  })

  it('renders gracefully when journal is empty', () => {
    const { container } = renderCell('journal', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makePublicationColumns — Published Date column', () => {
  it('renders the published date', () => {
    renderCell('publishedDate', '2024-06-15')
    expect(screen.getByText('2024-06-15')).toBeInTheDocument()
  })

  it('renders gracefully when publishedDate is empty', () => {
    const { container } = renderCell('publishedDate', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makePublicationColumns — PubMed ID column', () => {
  it('renders the PubMed ID as a link', () => {
    const { container } = renderCell('pubmedId', '87654321')
    const link = container.querySelector('a[href="https://pubmed.ncbi.nlm.nih.gov/87654321"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('87654321')
  })

  it('sets target="_blank" and rel="noopener noreferrer"', () => {
    const { container } = renderCell('pubmedId', '87654321')
    const link = container.querySelector('a[href="https://pubmed.ncbi.nlm.nih.gov/87654321"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders nothing when pubmedId is absent', () => {
    const col = makePublicationColumns().find(c => c.field === 'pubmedId')!
    const result = col.renderCell!(mockParams(''))
    expect(result).toBeNull()
  })
})

describe('makePublicationColumns — DOI column', () => {
  it('renders the DOI as a link', () => {
    const { container } = renderCell('doi', '10.1038/ng.1234')
    const link = container.querySelector('a[href="https://doi.org/10.1038/ng.1234"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('10.1038/ng.1234')
  })

  it('sets target="_blank" and rel="noopener noreferrer"', () => {
    const { container } = renderCell('doi', '10.1038/ng.1234')
    const link = container.querySelector('a[href="https://doi.org/10.1038/ng.1234"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders nothing when doi is absent', () => {
    const col = makePublicationColumns().find(c => c.field === 'doi')!
    const result = col.renderCell!(mockParams(''))
    expect(result).toBeNull()
  })
})

describe('makePublicationColumns — Access column', () => {
  it('renders the access text', () => {
    renderCell('access', 'open')
    expect(screen.getByText('open')).toBeInTheDocument()
  })

  it('renders gracefully when access is empty', () => {
    const { container } = renderCell('access', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makePublicationColumns — Authors column', () => {
  it('renders comma-separated author names', () => {
    renderCell('authorNames', ['Alice Smith', 'Bob Jones', 'Carol White'])
    expect(screen.getByText('Alice Smith, Bob Jones, Carol White')).toBeInTheDocument()
  })

  it('renders gracefully when authorNames is empty', () => {
    const { container } = renderCell('authorNames', [])
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makePublicationColumns — Tags column', () => {
  it('renders nothing when tags array is empty', () => {
    const col = makePublicationColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams([]))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tags', () => {
    const { container } = renderCell('tags', ['genomics', 'GWAS', 'cancer'])
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('genomics')).toBeInTheDocument()
    expect(screen.getByText('GWAS')).toBeInTheDocument()
    expect(screen.getByText('cancer')).toBeInTheDocument()
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    const { container } = renderCell('tags', ['t1', 't2', 't3', 't4', 't5'])
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    const { container } = renderCell('tags', ['a', 'b', 'c'])
    const chips = container.querySelectorAll('.MuiChip-root')
    expect(chips).toHaveLength(3)
    chips.forEach(chip => expect(chip.textContent).not.toMatch(/^\+\d+$/))
  })
})
