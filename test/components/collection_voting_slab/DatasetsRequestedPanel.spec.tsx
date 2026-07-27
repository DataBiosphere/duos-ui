import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import DatasetsRequestedPanel from 'src/components/collection_voting_slab/DatasetsRequestedPanel'
import { Storage } from 'src/libs/storage'
import { DacTerm, Dataset, DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
  },
}))

const dataset = (id: number, dacId: number): Dataset => ({
  datasetId: id,
  datasetIdentifier: `DUOS-${id}`,
  name: `Dataset ${id}`,
  dacId: dacId,
} as Dataset)

const bucketDatasets: Dataset[] = [
  dataset(1, 1),
  dataset(2, 1),
  dataset(3, 2),
  dataset(4, 2),
  dataset(5, 2),
  dataset(6, 3),
  dataset(7, 3),
]

const dacs: DacTerm[] = [
  { dacId: 1, dacName: 'DAC 1' } as DacTerm,
  { dacId: 2, dacName: 'DAC 2' } as DacTerm,
  { dacId: 3, dacName: 'DAC 3' } as DacTerm,
]

const user = {
  userId: 1,
  displayName: 'Admin',
  institution: {
    id: 150,
    name: 'The Broad Institute of MIT and Harvard',
  },
  roles: [{ dacId: 4 }],
  isAdmin: true,
  isChairPerson: true,
} as DuosUser

describe('DatasetsRequestedPanel - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(user)
  })

  it('Renders no dataset information if bucketDatasets is empty', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={[]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacs={dacs}
        isLoading={false}
        adminPage={false}
      />,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(1)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('Renders no dataset information if bucketDatasets is null', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={undefined as unknown as Dataset[]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacs={dacs}
        isLoading={false}
        adminPage={false}
      />,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(1)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('Renders no dataset information if dacDatasetIds is empty', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[]}
        dacs={dacs}
        isLoading={false}
        adminPage={false}
      />,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(1)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('Renders no dataset information if dacDatasetIds is null', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={undefined}
        dacs={dacs}
        isLoading={false}
        adminPage={false}
      />,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(1)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('Renders no dataset information if there are no matches between bucket datasets and DAC dataset ids', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[8, 9, 10]}
        dacs={dacs}
        isLoading={false}
        adminPage={false}
      />,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(1)
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('Renders less than five datasets without an expansion link', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 3, 9, 10]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(3)
    expect(screen.getByText('(2)')).toBeInTheDocument()

    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-1')
    expect(datasetList?.textContent).toContain('Dataset 1')
    expect(datasetList?.textContent).toContain('DUOS-3')
    expect(datasetList?.textContent).toContain('Dataset 3')

    expect(document.querySelector('[data-cy=collapse-expand-link]')).not.toBeInTheDocument()
  })

  it('Renders five datasets without an expansion link', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(6)
    expect(screen.getByText('(5)')).toBeInTheDocument()

    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-1')
    expect(datasetList?.textContent).toContain('Dataset 1')
    expect(datasetList?.textContent).toContain('DUOS-2')
    expect(datasetList?.textContent).toContain('Dataset 2')
    expect(datasetList?.textContent).toContain('DUOS-3')
    expect(datasetList?.textContent).toContain('Dataset 3')
    expect(datasetList?.textContent).toContain('DUOS-4')
    expect(datasetList?.textContent).toContain('Dataset 4')
    expect(datasetList?.textContent).toContain('DUOS-5')
    expect(datasetList?.textContent).toContain('Dataset 5')

    expect(document.querySelector('[data-cy=collapse-expand-link]')).not.toBeInTheDocument()
  })

  it('Renders more than five datasets with an expansion link', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(6)
    expect(screen.getByText('(7)')).toBeInTheDocument()

    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-1')
    expect(datasetList?.textContent).toContain('Dataset 1')
    expect(datasetList?.textContent).toContain('DUOS-2')
    expect(datasetList?.textContent).toContain('Dataset 2')
    expect(datasetList?.textContent).toContain('DUOS-3')
    expect(datasetList?.textContent).toContain('Dataset 3')
    expect(datasetList?.textContent).toContain('DUOS-4')
    expect(datasetList?.textContent).toContain('Dataset 4')
    expect(datasetList?.textContent).toContain('DUOS-5')
    expect(datasetList?.textContent).toContain('Dataset 5')

    expect(datasetList?.textContent).not.toContain('DUOS-6')
    expect(datasetList?.textContent).not.toContain('Dataset 6')
    expect(datasetList?.textContent).not.toContain('DUOS-7')
    expect(datasetList?.textContent).not.toContain('Dataset 7')

    expect(screen.getByText('+ View 2 more')).toBeInTheDocument()
  })

  it('Shows more or less datasets when link is clicked', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(6)
    expect(screen.getByText('(7)')).toBeInTheDocument()

    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).not.toContain('DUOS-6')
    expect(datasetList?.textContent).not.toContain('Dataset 6')
    expect(datasetList?.textContent).not.toContain('DUOS-7')
    expect(datasetList?.textContent).not.toContain('Dataset 7')

    const expandLink = screen.getByText('+ View 2 more')
    expect(expandLink).toBeInTheDocument()
    fireEvent.click(expandLink)

    const expandedTable = document.querySelector('[data-cy=dataset-list] table')
    expect(expandedTable?.querySelectorAll('tr').length).toBe(8)
    expect(screen.getByText('(7)')).toBeInTheDocument()

    const expandedList = document.querySelector('[data-cy=dataset-list]')
    expect(expandedList?.textContent).toContain('DUOS-6')
    expect(expandedList?.textContent).toContain('Dataset 6')
    expect(expandedList?.textContent).toContain('DUOS-7')
    expect(expandedList?.textContent).toContain('Dataset 7')

    const collapseLink = screen.getByText('- View 2 less')
    expect(collapseLink).toBeInTheDocument()
    fireEvent.click(collapseLink)

    const collapsedTable = document.querySelector('[data-cy=dataset-list] table')
    expect(collapsedTable?.querySelectorAll('tr').length).toBe(6)
    expect(screen.getByText('+ View 2 more')).toBeInTheDocument()
  })

  it('Re-derives the visible datasets when props change', () => {
    const { rerender } = render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    expect(screen.getByText('(2)')).toBeInTheDocument()
    let datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-1')
    expect(datasetList?.textContent).toContain('DUOS-2')
    expect(datasetList?.textContent).not.toContain('DUOS-3')
    expect(document.querySelector('[data-cy=collapse-expand-link]')).not.toBeInTheDocument()

    // Changing dacDatasetIds should re-filter the list and re-introduce the expansion link.
    rerender(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    expect(screen.getByText('(7)')).toBeInTheDocument()
    datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-3')
    expect(datasetList?.textContent).not.toContain('DUOS-6')
    expect(screen.getByText('+ View 2 more')).toBeInTheDocument()
  })

  it('Keeps the expanded view when props change while expanded', () => {
    const { rerender } = render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    fireEvent.click(screen.getByText('+ View 2 more'))
    expect(document.querySelector('[data-cy=dataset-list]')?.textContent).toContain('DUOS-6')

    // A prop change while expanded should keep showing all datasets beyond the
    // collapsed capacity, not silently collapse the list.
    rerender(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).toContain('DUOS-6')
    expect(screen.getByText('- View 1 less')).toBeInTheDocument()
  })

  it('Renders filler dataset identifier if attribute is null', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={[
            {
              datasetId: 1,
              name: 'Dataset 1',
            } as Dataset,
          ]}
          dacDatasetIds={[1]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).not.toContain('DUOS-1')
    expect(screen.getByText('- -')).toBeInTheDocument()
    expect(screen.getByText('Dataset 1')).toBeInTheDocument()
  })

  it('Renders filler dataset name if attribute is null', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={[
            {
              datasetId: 1,
              datasetIdentifier: 'DUOS-1',
            } as Dataset,
          ]}
          dacDatasetIds={[1]}
          dacs={dacs}
          isLoading={false}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    expect(screen.getByText('DUOS-1')).toBeInTheDocument()
    const datasetList = document.querySelector('[data-cy=dataset-list]')
    expect(datasetList?.textContent).not.toContain('Dataset 1')
    expect(screen.getByText('- -')).toBeInTheDocument()
  })

  it('Renders skeleton text when loading', () => {
    render(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        isLoading={true}
        dacs={dacs}
        adminPage={false}
      />,
    )
    expect(document.querySelector('.text-placeholder')).toBeInTheDocument()
    expect(document.querySelector('[data-cy=dataset-list]')).not.toBeInTheDocument()
  })

  it('shows all datasets if the viewing on the admin page', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1]}
          isLoading={false}
          adminPage={true}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    const table = document.querySelector('[data-cy=dataset-list] table')
    expect(table?.querySelectorAll('tr').length).toBe(6)
    expect(screen.getByText('+ View 2 more')).toBeInTheDocument()
  })

  it('shows all DACs in bucket', () => {
    render(
      <BrowserRouter>
        <DatasetsRequestedPanel
          bucketDatasets={bucketDatasets}
          dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
          isLoading={false}
          dacs={dacs}
          adminPage={false}
        />
      </BrowserRouter>,
    )
    expect(document.querySelector('[data-cy=dataset-list]')).toBeInTheDocument()
    fireEvent.click(screen.getByText('+ View 2 more'))
    for (const dac of dacs) {
      expect(document.querySelector('[data-cy=dataset-list]')?.textContent).toContain(dac.dacName)
    }
  })
})
