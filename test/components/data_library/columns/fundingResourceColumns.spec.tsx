import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makeFundingResourceColumns } from 'src/components/data_library/columns/fundingResourceColumns'
import { FundingResourceAsset } from 'src/types/library'

const makeRow = (overrides: Partial<FundingResourceAsset> = {}): FundingResourceAsset => ({
  fundingId: 'FR-001',
  studyId: 101,
  studyName: 'Study A',
  funderName: 'Funder A',
  funderProgram: 'Program A',
  grantNumber: 'GN-1',
  projectTitle: 'Project A',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  url: 'https://example.org',
  tags: ['tag1', 'tag2'],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<FundingResourceAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<FundingResourceAsset>(makeFundingResourceColumns, makeRow)

describe('makeFundingResourceColumns — Study Name column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Cancer Study', { studyId: 101 })
    expect(screen.getByText('Cancer Study')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Cancer Study', { studyId: 101 })
    expect(container.querySelector('a[href="/studies/101"]')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when studyName is absent', () => {
    const { container } = renderCell('studyName', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — Funding ID column', () => {
  it('renders the funding ID text', () => {
    renderCell('fundingId', 'FR-12345')
    expect(screen.getByText('FR-12345')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when fundingId is absent', () => {
    const { container } = renderCell('fundingId', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — Funder Name column', () => {
  it('renders the funder name', () => {
    renderCell('funderName', 'NIH')
    expect(screen.getByText('NIH')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when funderName is absent', () => {
    const { container } = renderCell('funderName', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — Grant Number column', () => {
  it('renders the grant number', () => {
    renderCell('grantNumber', 'R01-XYZ')
    expect(screen.getByText('R01-XYZ')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when grantNumber is absent', () => {
    const { container } = renderCell('grantNumber', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — Project Title column', () => {
  it('renders the project title', () => {
    renderCell('projectTitle', 'Cancer Genomics')
    expect(screen.getByText('Cancer Genomics')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when projectTitle is absent', () => {
    const { container } = renderCell('projectTitle', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — Start Date column', () => {
  it('renders the start date', () => {
    renderCell('startDate', '2024-01-01')
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when startDate is absent', () => {
    const { container } = renderCell('startDate', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeFundingResourceColumns — URL column', () => {
  it('renders url as external link when present', () => {
    const { container } = renderCell('url', 'https://example.org')
    const link = container.querySelector('a[href="https://example.org"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('Link')).toBeInTheDocument()
  })

  it('renders null for empty url', () => {
    const col = makeFundingResourceColumns().find(c => c.field === 'url')!
    const result = col.renderCell!(mockParams(''))
    expect(result).toBeNull()
  })
})

describe('makeFundingResourceColumns — Tags column', () => {
  it('renders nothing when tags array is empty', () => {
    const col = makeFundingResourceColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams(undefined, { tags: [] }))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['tag1', 'tag2', 'tag3'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['tagA', 'tagB', 'tagC'] })
    const chips = container.querySelectorAll('.MuiChip-root')
    expect(chips).toHaveLength(3)
    chips.forEach(chip => expect(chip.textContent).not.toMatch(/^\+\d+$/))
  })
})

describe('makeFundingResourceColumns — column structure', () => {
  it('returns 9 column definitions', () => {
    expect(makeFundingResourceColumns()).toHaveLength(9)
  })

  it('defines expected fields in correct order', () => {
    const fields = makeFundingResourceColumns().map(c => c.field)
    expect(fields).toEqual([
      'studyName', 'fundingId', 'funderName', 'funderProgram',
      'grantNumber', 'projectTitle', 'startDate', 'url', 'tags',
    ])
  })

  it('sets url and tags as non-sortable', () => {
    const cols = makeFundingResourceColumns()
    expect(cols.find(c => c.field === 'url')?.sortable).toBe(false)
    expect(cols.find(c => c.field === 'tags')?.sortable).toBe(false)
  })
})

describe('makeFundingResourceColumns — accessibility', () => {
  it('renders headers with proper labels', () => {
    const cols = makeFundingResourceColumns()
    const headers = cols.map(c => c.headerName)
    expect(headers).toContain('Study Name')
    expect(headers).toContain('Funding Resource ID')
    expect(headers).toContain('Funder Name')
    expect(headers).toContain('Funder Program')
    expect(headers).toContain('Grant Number')
    expect(headers).toContain('Project Title')
    expect(headers).toContain('Start Date')
    expect(headers).toContain('URL')
    expect(headers).toContain('Tags')
  })
})
