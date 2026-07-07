import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makeModelColumns } from 'src/components/data_library/columns/modelColumns'
import { ModelAsset } from 'src/types/library'

const makeRow = (overrides: Partial<ModelAsset> = {}): ModelAsset => ({
  modelId: 'model-1',
  studyId: 42,
  studyName: 'Test Study',
  name: 'My Model',
  description: 'A test model',
  url: 'https://example.com/model',
  format: 'ONNX',
  license: 'MIT',
  trainedOnDatasets: [],
  maintainer: { name: 'Jane Doe', email: 'jane@example.com' },
  tags: ['genomics', 'classification'],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<ModelAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<ModelAsset>(makeModelColumns, makeRow)

describe('makeModelColumns — Model Name column', () => {
  it('renders the model name text', () => {
    renderCell('name', 'ResNet-50')
    expect(screen.getByText('ResNet-50')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when name is absent', () => {
    const { container } = renderCell('name', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeModelColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makeModelColumns — Format column', () => {
  it('renders the format text', () => {
    renderCell('format', 'ONNX')
    expect(screen.getByText('ONNX')).toBeInTheDocument()
  })

  it('renders an empty cell when format is absent', () => {
    const { container } = renderCell('format', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeModelColumns — License column', () => {
  it('renders the license text', () => {
    renderCell('license', 'Apache-2.0')
    expect(screen.getByText('Apache-2.0')).toBeInTheDocument()
  })

  it('renders an empty cell when license is absent', () => {
    const { container } = renderCell('license', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeModelColumns — Maintainer column', () => {
  it('renders the maintainer name', () => {
    renderCell('maintainer', 'Alice Smith', { maintainer: { name: 'Alice Smith', email: 'alice@example.com' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders an empty cell when maintainer name is absent', () => {
    const { container } = renderCell('maintainer', '', { maintainer: { name: '', email: '' } })
    expect(container).toBeInTheDocument()
  })
})

describe('makeModelColumns — URL column', () => {
  it('renders "Link" as a clickable anchor when url is present', () => {
    const { container } = renderCell('url', 'https://huggingface.co/my-model')
    expect(container.querySelector('a[href="https://huggingface.co/my-model"]')).toBeInTheDocument()
    expect(screen.getByText('Link')).toBeInTheDocument()
  })

  it('renders nothing when url is absent', () => {
    const col = makeModelColumns().find(c => c.field === 'url')!
    const result = col.renderCell!(mockParams(''))
    expect(result).toBeNull()
  })

  it('sets target="_blank" and rel="noopener noreferrer" for external links', () => {
    const { container } = renderCell('url', 'https://example.com')
    const link = container.querySelector('a[href="https://example.com"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('makeModelColumns — Tags column', () => {
  it('renders nothing when tags array is empty', () => {
    const col = makeModelColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams(undefined, { tags: [] }))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['genomics', 'classification', 'vision'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('genomics')).toBeInTheDocument()
    expect(screen.getByText('classification')).toBeInTheDocument()
    expect(screen.getByText('vision')).toBeInTheDocument()
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['t1', 't2', 't3', 't4', 't5'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tags: ['a', 'b', 'c'] })
    const chips = container.querySelectorAll('.MuiChip-root')
    expect(chips).toHaveLength(3)
    chips.forEach(chip => expect(chip.textContent).not.toMatch(/^\+\d+$/))
  })
})

describe('makeModelColumns — column structure', () => {
  it('returns 7 column definitions', () => {
    expect(makeModelColumns()).toHaveLength(7)
  })

  it('defines expected fields', () => {
    const fields = makeModelColumns().map(c => c.field)
    expect(fields).toEqual(['name', 'studyName', 'format', 'license', 'maintainer', 'url', 'tags'])
  })

  it('marks url and tags as non-sortable', () => {
    const cols = makeModelColumns()
    expect(cols.find(c => c.field === 'url')?.sortable).toBe(false)
    expect(cols.find(c => c.field === 'tags')?.sortable).toBe(false)
  })
})
