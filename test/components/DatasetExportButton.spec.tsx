import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { DatasetExportButton } from 'src/components/data_search/DatasetExportButton'
import { SnapshotSummaryModel } from 'src/types/tdrModel'

vi.mock('src/libs/config', () => ({
  Config: {
    getTerraUrl: vi.fn().mockResolvedValue('https://terra.example.com'),
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
  })

  it('renders nothing when snapshots is empty', async () => {
    const { container } = await renderButton([])
    expect(container.firstChild).toBeNull()
  })

  it('renders a single link for one snapshot', async () => {
    await renderButton([snapshotA])

    const link = screen.getByRole('link', { name: /Snapshot Alpha/i })
    expect(link.textContent).toBe('Export')
    expect(link.getAttribute('href')).toContain('snap-aaa')
    expect(link.getAttribute('href')).toContain('tdrexport')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('single-snapshot link href uses the terra base URL', async () => {
    await renderButton([snapshotA])

    const link = screen.getByRole('link', { name: /Snapshot Alpha/i })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/terra\.example\.com/)
  })

  it('renders a button (not a link) for multiple snapshots', async () => {
    await renderButton([snapshotA, snapshotB])

    expect(screen.getByRole('button', { name: /export/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /export snapshot/i })).toBeNull()
  })

  it('dropdown is closed initially for multiple snapshots', async () => {
    await renderButton([snapshotA, snapshotB])

    expect(screen.queryByText('Snapshot Alpha')).toBeNull()
    expect(screen.queryByText('Snapshot Beta')).toBeNull()
  })

  it('opens dropdown menu on button click and shows snapshot names', async () => {
    await renderButton([snapshotA, snapshotB])

    fireEvent.click(screen.getByRole('button', { name: /export/i }))

    expect(await screen.findByText('Snapshot Alpha')).toBeTruthy()
    expect(await screen.findByText('Snapshot Beta')).toBeTruthy()
  })

  it('each dropdown item links to the correct Terra snapshot URL', async () => {
    await renderButton([snapshotA, snapshotB])

    fireEvent.click(screen.getByRole('button', { name: /export/i }))

    const itemA = await screen.findByText('Snapshot Alpha')
    const itemB = await screen.findByText('Snapshot Beta')

    expect(itemA.closest('a')?.getAttribute('href')).toContain('snap-aaa')
    expect(itemB.closest('a')?.getAttribute('href')).toContain('snap-bbb')
  })

  it('dropdown items open in a new tab', async () => {
    await renderButton([snapshotA, snapshotB])

    fireEvent.click(screen.getByRole('button', { name: /export/i }))

    const itemA = await screen.findByText('Snapshot Alpha')
    expect(itemA.closest('a')?.getAttribute('target')).toBe('_blank')
  })
})
