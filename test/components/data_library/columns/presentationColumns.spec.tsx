import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makePresentationColumns } from 'src/components/data_library/columns/presentationColumns'
import { PresentationAsset } from 'src/types/library'
import { Presenter } from 'src/types/model'

const makeRow = (overrides: Partial<PresentationAsset> = {}): PresentationAsset => ({
  presentationId: 'pres-001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'Genomics Data Sharing in the Modern Era',
  date: '2024-03-15',
  url: 'https://example.com/presentation',
  authors: 'Alice Smith, Bob Jones',
  datasetCitation: 'DUOS-123456',
  citation: true,
  presenter: { name: 'Alice Smith', email: 'alice@example.com' },
  event: 'ASHG 2024',
  location: 'Denver, CO',
  format: 'Oral',
  access: 'open',
  tags: [],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<PresentationAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<PresentationAsset>(makePresentationColumns, makeRow)

describe('makePresentationColumns — Title column', () => {
  it('renders the presentation title as a link when url is present', () => {
    const { container } = renderCell('title', 'Genomics in Practice', { url: 'https://example.com/slides' })
    expect(container.querySelector('a[href="https://example.com/slides"]')).toBeInTheDocument()
    expect(screen.getByText('Genomics in Practice')).toBeInTheDocument()
  })

  it('renders plain text when url is absent', () => {
    const { container } = renderCell('title', 'No Link Title', { url: '' })
    expect(screen.getByText('No Link Title')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    const { container } = renderCell('title', 'Ext Link', { url: 'https://example.com/pres' })
    const link = container.querySelector('a[href="https://example.com/pres"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    const { container } = renderCell('title', '', { url: '' })
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Event column', () => {
  it('renders the event name', () => {
    renderCell('event', 'ASHG 2024')
    expect(screen.getByText('ASHG 2024')).toBeInTheDocument()
  })

  it('renders gracefully when event is empty', () => {
    const { container } = renderCell('event', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Date column', () => {
  it('renders the presentation date', () => {
    renderCell('date', '2024-10-15')
    expect(screen.getByText('2024-10-15')).toBeInTheDocument()
  })

  it('renders gracefully when date is empty', () => {
    const { container } = renderCell('date', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Location column', () => {
  it('renders the location', () => {
    renderCell('location', 'Denver, CO')
    expect(screen.getByText('Denver, CO')).toBeInTheDocument()
  })

  it('renders gracefully when location is empty', () => {
    const { container } = renderCell('location', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Presenter column', () => {
  it('renders the presenter name', () => {
    renderCell('presenter', 'Alice Smith', { presenter: { name: 'Alice Smith', email: 'alice@example.com' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders gracefully when presenter is absent', () => {
    const { container } = renderCell('presenter', '', { presenter: undefined })
    expect(container).toBeInTheDocument()
  })

  it('renders gracefully when presenter name is absent', () => {
    const { container } = renderCell('presenter', '', { presenter: { email: 'alice@example.com' } as Presenter })
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Format column', () => {
  it('renders the format', () => {
    renderCell('format', 'Oral')
    expect(screen.getByText('Oral')).toBeInTheDocument()
  })

  it('renders gracefully when format is empty', () => {
    const { container } = renderCell('format', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makePresentationColumns — Tags column', () => {
  it('renders nothing when tags array is empty', () => {
    const col = makePresentationColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams([]))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tags', () => {
    const { container } = renderCell('tags', ['genomics', 'data-sharing', 'open-access'])
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('genomics')).toBeInTheDocument()
    expect(screen.getByText('data-sharing')).toBeInTheDocument()
    expect(screen.getByText('open-access')).toBeInTheDocument()
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
