import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { DatasetExportButton } from 'src/components/data_search/DatasetExportButton'
import { SnapshotSummaryModel } from 'src/types/tdrModel'
import { Config } from 'src/libs/config'

vi.mock('src/libs/config', () => ({
  Config: {
    getTerraUrl: vi.fn(),
  },
}))

const buildSnapshot = (id: string, name: string): SnapshotSummaryModel => ({
  id,
  name,
  duosId: 'DUOS-000001',
  cloudPlatform: 'gcp',
  resourceLocks: {},
})

const snapshotA = buildSnapshot('snap-aaa', 'Snapshot Alpha')
const snapshotB = buildSnapshot('snap-bbb', 'Snapshot Beta')

const renderButton = async (snapshots: SnapshotSummaryModel[]) => {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<DatasetExportButton snapshots={snapshots} />)
  })
  return result!
}

describe('DatasetExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getTerraUrl).mockResolvedValue('https://terra.example.com')
  })

  it('renders nothing when snapshots is empty', async () => {
    const { container } = await renderButton([])
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when terraUrl is not configured, instead of links with an empty base', async () => {
    // BEEs define neither config.json's terraUrl nor DUOS_TERRA_URL — the
    // export button must disappear, not link to `/#import-data?…`.
    vi.mocked(Config.getTerraUrl).mockResolvedValue('')
    const { container } = await renderButton([snapshotA])
    expect(container.firstChild).toBeNull()
  })

  it('renders an "Export to..." dropdown button', async () => {
    await renderButton([snapshotA])

    expect(screen.getByRole('button', { name: /export to/i }).textContent).toContain('Export to...')
  })

  it('dropdown is closed initially', async () => {
    await renderButton([snapshotA])

    expect(screen.queryByText('Terra')).toBeNull()
  })

  it('opens dropdown menu on button click and shows the Terra option with its logo', async () => {
    await renderButton([snapshotA])

    fireEvent.click(screen.getByRole('button', { name: /export to/i }))

    const terraItem = await screen.findByText('Terra')
    expect(terraItem).toBeTruthy()
    expect(terraItem.closest('a')?.querySelector('img')).toBeTruthy()
  })

  it('the Terra option links to the correct Terra snapshot URL in a new tab', async () => {
    await renderButton([snapshotA])

    fireEvent.click(screen.getByRole('button', { name: /export to/i }))

    const terraItem = await screen.findByText('Terra')
    const link = terraItem.closest('a')
    expect(link?.getAttribute('href')).toContain('snap-aaa')
    expect(link?.getAttribute('href')).toContain('tdrexport')
    expect(link?.getAttribute('href')).toMatch(/^https:\/\/terra\.example\.com/)
    expect(link?.getAttribute('target')).toBe('_blank')
  })

  it('renders one menu item per snapshot, each labeled with its snapshot name', async () => {
    await renderButton([snapshotA, snapshotB])

    fireEvent.click(screen.getByRole('button', { name: /export to/i }))

    expect(await screen.findAllByText('Terra')).toHaveLength(2)
    expect(screen.getByText('Snapshot Alpha')).toBeTruthy()
    expect(screen.getByText('Snapshot Beta')).toBeTruthy()

    const alphaLink = screen.getByText('Snapshot Alpha').closest('a')
    const betaLink = screen.getByText('Snapshot Beta').closest('a')
    expect(alphaLink?.getAttribute('href')).toContain('snap-aaa')
    expect(betaLink?.getAttribute('href')).toContain('snap-bbb')
  })
})
