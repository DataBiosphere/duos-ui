import React from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DataGrid } from '@mui/x-data-grid'
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
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — Funding ID column', () => {
  it('renders the funding ID text', () => {
    renderCell('fundingId', 'FR-12345')
    expect(screen.getByText('FR-12345')).toBeInTheDocument()
  })

  it('applies ellipsis styling to long funding IDs', () => {
    renderCell('fundingId', 'VERY-LONG-FUNDING-RESOURCE-IDENTIFIER-12345')
    const box = screen.getByText('VERY-LONG-FUNDING-RESOURCE-IDENTIFIER-12345')
    expect(box).toHaveStyle({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
  })

  it('renders an empty cell gracefully when fundingId is absent', () => {
    const { container } = renderCell('fundingId', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — Funder Name column', () => {
  it('renders the funder name', () => {
    renderCell('funderName', 'NIH')
    expect(screen.getByText('NIH')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when funderName is absent', () => {
    const { container } = renderCell('funderName', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — Grant Number column', () => {
  it('renders the grant number', () => {
    renderCell('grantNumber', 'R01-XYZ')
    expect(screen.getByText('R01-XYZ')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when grantNumber is absent', () => {
    const { container } = renderCell('grantNumber', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — Project Title column', () => {
  it('renders the project title', () => {
    renderCell('projectTitle', 'Cancer Genomics')
    expect(screen.getByText('Cancer Genomics')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when projectTitle is absent', () => {
    const { container } = renderCell('projectTitle', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — Start Date column', () => {
  it('renders the start date', () => {
    renderCell('startDate', '2024-01-01')
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when startDate is absent', () => {
    const { container } = renderCell('startDate', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeFundingResourceColumns — URL column', () => {
  it('renders url as external link when present', () => {
    const { container } = renderCell('url', 'https://example.org')
    const link = container.querySelector('a[href="https://example.org"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveTextContent('Link')
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
  beforeAll(() => {
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
  })

  it('renders column headers with correct accessible names', () => {
    render(
      <MemoryRouter>
        <div style={{ height: 400, width: 800 }}>
          <DataGrid columns={makeFundingResourceColumns()} rows={[]} />
        </div>
      </MemoryRouter>,
    )
    expect(screen.getByRole('columnheader', { name: 'Study Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Funding Resource ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Funder Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Funder Program' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Grant Number' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Project Title' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Start Date' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'URL' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Tags' })).toBeInTheDocument()
  })
})
