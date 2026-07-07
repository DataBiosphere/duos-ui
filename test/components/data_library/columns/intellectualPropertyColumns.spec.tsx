import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makeIntellectualPropertyColumns } from 'src/components/data_library/columns/intellectualPropertyColumns'
import { IntellectualPropertyAsset } from 'src/types/library'

const makeRow = (overrides: Partial<IntellectualPropertyAsset> = {}): IntellectualPropertyAsset => ({
  ipId: 'ip-001',
  studyId: 42,
  studyName: 'Test Study',
  type: 'Patent',
  title: 'Novel Genomic Sequencing Method',
  assignee: 'Broad Institute',
  patentNumber: 'US12345678',
  filingDate: '2023-06-15',
  status: 'Granted',
  url: 'https://patents.example.com/US12345678',
  contact: 'ip@broadinstitute.org',
  tags: ['genomics', 'sequencing'],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<IntellectualPropertyAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<IntellectualPropertyAsset>(makeIntellectualPropertyColumns, makeRow)

describe('makeIntellectualPropertyColumns — Title column', () => {
  it('renders the IP title as a link when url is present', () => {
    const { container } = renderCell('title', 'Novel Sequencing Method', { url: 'https://patents.example.com/US00001' })
    expect(container.querySelector('a[href="https://patents.example.com/US00001"]')).toBeInTheDocument()
    expect(screen.getByText('Novel Sequencing Method')).toBeInTheDocument()
  })

  it('renders plain text when url is absent', () => {
    const { container } = renderCell('title', 'No Link Title', { url: '' })
    expect(screen.getByText('No Link Title')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('sets target="_blank" and rel="noopener noreferrer" for the title link', () => {
    const { container } = renderCell('title', 'Ext Link', { url: 'https://patents.example.com/US99999' })
    const link = container.querySelector('a[href="https://patents.example.com/US99999"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders gracefully when title is empty', () => {
    const { container } = renderCell('title', '', { url: '' })
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Type column', () => {
  it('renders the IP type', () => {
    renderCell('type', 'Patent')
    expect(screen.getByText('Patent')).toBeInTheDocument()
  })

  it('renders gracefully when type is empty', () => {
    const { container } = renderCell('type', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Patent Number column', () => {
  it('renders the patent number', () => {
    renderCell('patentNumber', 'US12345678')
    expect(screen.getByText('US12345678')).toBeInTheDocument()
  })

  it('renders gracefully when patent number is empty', () => {
    const { container } = renderCell('patentNumber', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Assignee column', () => {
  it('renders the assignee', () => {
    renderCell('assignee', 'Broad Institute')
    expect(screen.getByText('Broad Institute')).toBeInTheDocument()
  })

  it('renders gracefully when assignee is empty', () => {
    const { container } = renderCell('assignee', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Status column', () => {
  it('renders the status', () => {
    renderCell('status', 'Granted')
    expect(screen.getByText('Granted')).toBeInTheDocument()
  })

  it('renders gracefully when status is empty', () => {
    const { container } = renderCell('status', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Filing Date column', () => {
  it('renders the filing date', () => {
    renderCell('filingDate', '2023-06-15')
    expect(screen.getByText('2023-06-15')).toBeInTheDocument()
  })

  it('renders gracefully when filing date is empty', () => {
    const { container } = renderCell('filingDate', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Contact column', () => {
  it('renders the contact', () => {
    renderCell('contact', 'ip@broadinstitute.org')
    expect(screen.getByText('ip@broadinstitute.org')).toBeInTheDocument()
  })

  it('renders gracefully when contact is empty', () => {
    const { container } = renderCell('contact', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeIntellectualPropertyColumns — Tags column', () => {
  it('renders chips for each tag', () => {
    renderCell('tags', ['genomics', 'sequencing', 'IP'])
    expect(screen.getByText('genomics')).toBeInTheDocument()
    expect(screen.getByText('sequencing')).toBeInTheDocument()
    expect(screen.getByText('IP')).toBeInTheDocument()
  })

  it('shows overflow chip when more than 3 tags are present', () => {
    renderCell('tags', ['a', 'b', 'c', 'd', 'e'])
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders gracefully when tags array is empty', () => {
    const col = makeIntellectualPropertyColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams([]))
    expect(result).toBeNull()
  })
})
