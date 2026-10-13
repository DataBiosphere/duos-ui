import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeMockParams, makeRenderCellHelper } from './columnTestUtils'
import { makeWorkspaceColumns } from 'src/components/data_library/columns/workspaceColumns'
import { WorkspaceAsset } from 'src/types/library'

const makeRow = (overrides: Partial<WorkspaceAsset> = {}): WorkspaceAsset => ({
  workspaceId: 'ws-001',
  studyId: 42,
  studyName: 'Test Study',
  name: 'My Workspace',
  platform: 'Terra',
  url: 'https://app.terra.bio/#workspaces/test/my-workspace',
  description: 'A test workspace for genomics analysis',
  tools: ['WDL', 'Jupyter'],
  cloud: ['AWS'],
  access: 'open',
  tags: [],
  ...overrides,
})

const mockParams = (value: unknown, row: Partial<WorkspaceAsset> = {}) =>
  makeMockParams(value, makeRow(row))

const renderCell = makeRenderCellHelper<WorkspaceAsset>(makeWorkspaceColumns, makeRow)

describe('makeWorkspaceColumns — Workspace Name column', () => {
  it('renders the workspace name text', () => {
    renderCell('name', 'Terra Analysis Workspace')
    expect(screen.getByText('Terra Analysis Workspace')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when name is absent', () => {
    const { container } = renderCell('name', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeWorkspaceColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makeWorkspaceColumns — Platform column', () => {
  it('renders the platform text', () => {
    renderCell('platform', 'AnVIL')
    expect(screen.getByText('AnVIL')).toBeInTheDocument()
  })

  it('renders an empty cell when platform is absent', () => {
    const { container } = renderCell('platform', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeWorkspaceColumns — URL column', () => {
  it('renders "Link" as a clickable anchor when url is present', () => {
    const { container } = renderCell('url', 'https://app.terra.bio/#workspaces/test/example')
    const link = container.querySelector('a[href="https://app.terra.bio/#workspaces/test/example"]')!
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('Link')
  })

  it('renders nothing when url is absent', () => {
    const col = makeWorkspaceColumns().find(c => c.field === 'url')!
    const result = col.renderCell!(mockParams(''))
    expect(result).toBeNull()
  })

  it('sets target="_blank" and rel="noopener noreferrer" for external links', () => {
    const { container } = renderCell('url', 'https://example.com/workspace')
    const link = container.querySelector('a[href="https://example.com/workspace"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('makeWorkspaceColumns — Description column', () => {
  it('renders the description text', () => {
    renderCell('description', 'A cloud-based genomics pipeline')
    expect(screen.getByText('A cloud-based genomics pipeline')).toBeInTheDocument()
  })

  it('renders an empty cell when description is absent', () => {
    const { container } = renderCell('description', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeWorkspaceColumns — Tools column', () => {
  it('renders nothing when tools array is empty', () => {
    const col = makeWorkspaceColumns().find(c => c.field === 'tools')!
    const result = col.renderCell!(mockParams(undefined, { tools: [] }))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tools', () => {
    const { container } = renderCell('tools', undefined, { tools: ['WDL', 'Jupyter', 'R'], tags: [] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('WDL')).toBeInTheDocument()
    expect(screen.getByText('Jupyter')).toBeInTheDocument()
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('shows "+N" overflow chip when there are more than 3 tools', () => {
    const { container } = renderCell('tools', undefined, { tools: ['WDL', 'Jupyter', 'R', 'Python', 'Nextflow'], tags: [] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show an overflow chip for exactly 3 tools', () => {
    const { container } = renderCell('tools', undefined, { tools: ['WDL', 'Jupyter', 'R'], tags: [] })
    const chips = container.querySelectorAll('.MuiChip-root')
    expect(chips).toHaveLength(3)
    chips.forEach(chip => expect(chip.textContent).not.toMatch(/^\+\d+$/))
  })
})

describe('makeWorkspaceColumns — Cloud column', () => {
  it('renders nothing when cloud array is empty', () => {
    const col = makeWorkspaceColumns().find(c => c.field === 'cloud')!
    const result = col.renderCell!(mockParams(undefined, { cloud: [] }))
    expect(result).toBeNull()
  })

  it('renders a chip per cloud provider', () => {
    renderCell('cloud', undefined, { cloud: ['AWS', 'GCP'] })
    expect(screen.getByText('AWS')).toBeInTheDocument()
    expect(screen.getByText('GCP')).toBeInTheDocument()
  })
})

describe('makeWorkspaceColumns — Access column', () => {
  it('renders the access text', () => {
    renderCell('access', 'controlled')
    expect(screen.getByText('controlled')).toBeInTheDocument()
  })

  it('renders an empty cell when access is absent', () => {
    const { container } = renderCell('access', '')
    expect(container.textContent?.trim()).toBe('')
  })
})

describe('makeWorkspaceColumns — Tags column', () => {
  it('renders nothing when tags array is empty', () => {
    const col = makeWorkspaceColumns().find(c => c.field === 'tags')!
    const result = col.renderCell!(mockParams(undefined, { tags: [] }))
    expect(result).toBeNull()
  })

  it('renders up to 3 chips for 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tools: [], tags: ['genomics', 'cloud', 'wgs'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(3)
    expect(screen.getByText('genomics')).toBeInTheDocument()
    expect(screen.getByText('cloud')).toBeInTheDocument()
    expect(screen.getByText('wgs')).toBeInTheDocument()
  })

  it('shows "+N" overflow chip when there are more than 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tools: [], tags: ['t1', 't2', 't3', 't4', 't5'] })
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show an overflow chip for exactly 3 tags', () => {
    const { container } = renderCell('tags', undefined, { tools: [], tags: ['a', 'b', 'c'] })
    const chips = container.querySelectorAll('.MuiChip-root')
    expect(chips).toHaveLength(3)
    chips.forEach(chip => expect(chip.textContent).not.toMatch(/^\+\d+$/))
  })
})

describe('makeWorkspaceColumns — column structure', () => {
  it('returns 9 column definitions', () => {
    expect(makeWorkspaceColumns()).toHaveLength(9)
  })

  it('defines expected fields in order', () => {
    const fields = makeWorkspaceColumns().map(c => c.field)
    expect(fields).toEqual(['name', 'studyName', 'platform', 'url', 'description', 'tools', 'cloud', 'access', 'tags'])
  })

  it('marks url, tools, and tags as non-sortable', () => {
    const cols = makeWorkspaceColumns()
    expect(cols.find(c => c.field === 'url')?.sortable).toBe(false)
    expect(cols.find(c => c.field === 'tools')?.sortable).toBe(false)
    expect(cols.find(c => c.field === 'tags')?.sortable).toBe(false)
  })
})
