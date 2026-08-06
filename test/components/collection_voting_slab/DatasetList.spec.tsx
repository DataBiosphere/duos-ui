import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { Storage } from 'src/libs/storage'
import DatasetList from 'src/components/collection_voting_slab/DatasetList'
import { DacTerm, Dataset } from 'src/types/model'

afterEach(() => vi.restoreAllMocks())

const datasets: Dataset[] = [
  { datasetId: 1, datasetIdentifier: 'DUOS-1', name: 'Dataset 1', dacId: 1 } as Dataset,
  { datasetId: 2, datasetIdentifier: 'DUOS-2', name: 'Dataset 2', dacId: 1 } as Dataset,
]

const dacs: DacTerm[] = [{ dacId: 1, dacName: 'DAC 1' } as DacTerm]

const chairUser = { isChairPerson: true }

describe('DatasetList', () => {
  it('renders a table with datasets', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser as never)
    render(<BrowserRouter><DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} /></BrowserRouter>)
    expect(document.querySelector('table')).toBeInTheDocument()
    expect(screen.getByText('Dataset Identifier')).toBeInTheDocument()
    expect(screen.getByText('Dataset Name')).toBeInTheDocument()
    expect(screen.getByText('DAC')).toBeInTheDocument()
    expect(screen.getByText('DUOS-1')).toBeInTheDocument()
    expect(screen.getByText('Dataset 1')).toBeInTheDocument()
    expect(screen.getAllByText('DAC 1').length).toBeGreaterThan(0)
  })

  it('renders placeholder when loading', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser as never)
    const { container } = render(<DatasetList visibleDatasets={datasets} isLoading={true} dacs={dacs} />)
    expect(container.querySelector('.text-placeholder')).toBeInTheDocument()
    expect(document.querySelector('table')).not.toBeInTheDocument()
  })

  it('renders filler for missing datasetIdentifier', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser as never)
    render(
      <BrowserRouter>
        <DatasetList
          visibleDatasets={[{ datasetId: 3, name: 'Dataset 3', dacId: 1 } as Dataset]}
          isLoading={false}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    expect(screen.getByText('- -')).toBeInTheDocument()
    expect(screen.getByText('Dataset 3')).toBeInTheDocument()
  })

  it('renders filler for missing name', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser as never)
    render(
      <BrowserRouter>
        <DatasetList
          visibleDatasets={[{ datasetId: 4, datasetIdentifier: 'DUOS-4', dacId: 1 } as Dataset]}
          isLoading={false}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    expect(screen.getByText('DUOS-4')).toBeInTheDocument()
    expect(screen.getByText('- -')).toBeInTheDocument()
  })

  it('renders DAC name as link for chair user', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser as never)
    render(<BrowserRouter><DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} /></BrowserRouter>)
    expect(screen.getAllByRole('link', { name: 'DAC 1' })[0]).toHaveAttribute('href', '/manage_dac/1')
  })

  it('renders DAC name as plain text for non-chair user', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ isChairPerson: false } as never)
    render(<BrowserRouter><DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} /></BrowserRouter>)
    expect(document.querySelector('table')).toBeInTheDocument()
    expect(screen.getAllByText('DAC 1').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'DAC 1' })).not.toBeInTheDocument()
  })
})
