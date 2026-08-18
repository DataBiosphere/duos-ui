import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType } from 'src/types/library'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const TestComponent = () => {
  const [state, updateState] = useLibraryUrlState()
  return (
    <div>
      <div id="library">{state.library}</div>
      <div id="tab">{state.tab}</div>
      <div id="filters">{JSON.stringify(state.filters)}</div>
      <div id="page">{state.page}</div>
      <div id="pageSize">{state.pageSize}</div>
      <div id="sortField">{state.sortField || 'none'}</div>
      <div id="sortOrder">{state.sortOrder || 'none'}</div>
      <button id="update-tab" onClick={() => updateState({ tab: AssetType.DATASETS })}>Update Tab</button>
      <button id="update-library" onClick={() => updateState({ library: 'test' })}>Update Library</button>
      <button id="clear-library" onClick={() => updateState({ library: '' })}>Clear Library</button>
      <button id="update-pagination" onClick={() => updateState({ page: 1, pageSize: 50 })}>Update Pagination</button>
      <button id="update-sort" onClick={() => updateState({ sortField: 'studyName', sortOrder: 'asc' })}>Update Sort</button>
      <button id="clear-sort" onClick={() => updateState({ sortField: undefined, sortOrder: undefined })}>Clear Sort</button>
      <button
        id="update-filters"
        onClick={() => updateState({
          filters: {
            ...EMPTY_FILTERS,
            accessManagement: ['controlled'],
            clinicalTrialStatus: ['Active, not recruiting'],
            participantCount: { min: 10 },
          },
        })}
      >Update Filters
      </button>
    </div>
  )
}

describe('useLibraryUrlState', () => {
  it('initializes with default values when no search params are present', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )
    expect(screen.getByText('duos')).toBeInTheDocument()
    expect(screen.getByText(AssetType.DATASETS)).toBeInTheDocument()
    const filtersEl = document.getElementById('filters')!
    const filters = JSON.parse(filtersEl.textContent!)
    expect(filters.accessManagement).toHaveLength(0)
    expect(filters.participantCount.min).toBeUndefined()
  })

  it('initializes with values from search params', () => {
    render(
      <MemoryRouter initialEntries={['/?library=test&tab=datasets&access=controlled,open&minParticipants=5']}>
        <TestComponent />
      </MemoryRouter>,
    )
    expect(document.getElementById('library')!.textContent).toBe('test')
    expect(document.getElementById('tab')!.textContent).toBe(AssetType.DATASETS)
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.accessManagement).toEqual(['controlled', 'open'])
    expect(filters.participantCount.min).toBe(5)
  })

  it('reads primary and secondary data use codes from their own params', () => {
    render(
      <MemoryRouter initialEntries={['/?dataUse=HMB&dataUseModifiers=NPU,IRB']}>
        <TestComponent />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.dataUse).toEqual(['HMB'])
    expect(filters.dataUseModifiers).toEqual(['NPU', 'IRB'])
  })

  it('updates state via updateState', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Update Tab'))
    expect(document.getElementById('tab')!.textContent).toBe(AssetType.DATASETS)

    fireEvent.click(screen.getByText('Update Library'))
    expect(document.getElementById('library')!.textContent).toBe('test')

    fireEvent.click(screen.getByText('Update Filters'))
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.accessManagement).toEqual(['controlled'])
    expect(filters.clinicalTrialStatus).toEqual(['Active, not recruiting'])
    expect(filters.participantCount.min).toBe(10)

    // Test clearing a value (deleting from params)
    fireEvent.click(screen.getByText('Clear Library'))
    expect(document.getElementById('library')!.textContent).toBe('duos') // back to default
  })

  it('initializes with pagination and sort from search params', () => {
    render(
      <MemoryRouter initialEntries={['/?page=2&pageSize=100&sort=studyName&order=desc']}>
        <TestComponent />
      </MemoryRouter>,
    )
    expect(document.getElementById('page')!.textContent).toBe('2')
    expect(document.getElementById('pageSize')!.textContent).toBe('100')
    expect(document.getElementById('sortField')!.textContent).toBe('studyName')
    expect(document.getElementById('sortOrder')!.textContent).toBe('desc')
  })

  it('updates pagination via updateState', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Update Pagination'))
    expect(document.getElementById('page')!.textContent).toBe('1')
    expect(document.getElementById('pageSize')!.textContent).toBe('50')
  })

  it('sets sort state via updateState', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Update Sort'))
    expect(document.getElementById('sortField')!.textContent).toBe('studyName')
    expect(document.getElementById('sortOrder')!.textContent).toBe('asc')
  })

  it('clears sort state when sortField and sortOrder are set to undefined', () => {
    render(
      <MemoryRouter initialEntries={['/?sort=studyName&order=asc']}>
        <TestComponent />
      </MemoryRouter>,
    )

    // Verify sort is initially set from URL params
    expect(document.getElementById('sortField')!.textContent).toBe('studyName')
    expect(document.getElementById('sortOrder')!.textContent).toBe('asc')

    // Clear the sort
    fireEvent.click(screen.getByText('Clear Sort'))
    expect(document.getElementById('sortField')!.textContent).toBe('none')
    expect(document.getElementById('sortOrder')!.textContent).toBe('none')
  })

  it('parses comma-containing array values as single filter values', () => {
    render(
      <MemoryRouter initialEntries={['/?clinicalTrialStatus=Active,%20not%20recruiting']}>
        <TestComponent />
      </MemoryRouter>,
    )

    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.clinicalTrialStatus).toEqual(['Active, not recruiting'])
  })

  it('parses repeated array params without splitting comma-containing values', () => {
    render(
      <MemoryRouter initialEntries={['/?clinicalTrialStatus=Recruiting&clinicalTrialStatus=Active,%20not%20recruiting']}>
        <TestComponent />
      </MemoryRouter>,
    )

    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.clinicalTrialStatus).toEqual(['Recruiting', 'Active, not recruiting'])
  })

  // NaN from a malformed param would serialize to null in the query JSON, and
  // Elasticsearch rejects null range bounds / from / size — one bad hand-edited
  // param would break every tab via the shared tab-counts query.
  it('treats malformed numeric range params as unset instead of NaN', () => {
    render(
      <MemoryRouter initialEntries={['/?minParticipants=abc&maxParticipants=12']}>
        <TestComponent />
      </MemoryRouter>,
    )

    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.participantCount.min).toBeUndefined()
    expect(filters.participantCount.max).toBe(12)
  })

  it('falls back to default pagination for malformed or out-of-range page params', () => {
    render(
      <MemoryRouter initialEntries={['/?page=abc&pageSize=xyz']}>
        <TestComponent />
      </MemoryRouter>,
    )
    expect(document.getElementById('page')!.textContent).toBe('0')
    expect(document.getElementById('pageSize')!.textContent).toBe('25')
  })

  it('falls back to default pagination for negative or zero pagination params', () => {
    render(
      <MemoryRouter initialEntries={['/?page=-3&pageSize=0']}>
        <TestComponent />
      </MemoryRouter>,
    )
    expect(document.getElementById('page')!.textContent).toBe('0')
    expect(document.getElementById('pageSize')!.textContent).toBe('25')
  })
})

const BooleanFilterHarness = () => {
  const [state, updateState] = useLibraryUrlState()
  const location = useLocation()
  return (
    <div>
      <div id="filters">{JSON.stringify(state.filters)}</div>
      <div id="search">{location.search}</div>
      <button
        id="set-both"
        onClick={() => updateState({
          filters: { ...EMPTY_FILTERS, datasetsCited: true, publicationsDatasetsCited: false },
        })}
      >Set Both
      </button>
      <button
        id="clear-both"
        onClick={() => updateState({ filters: EMPTY_FILTERS })}
      >Clear Both
      </button>
    </div>
  )
}

describe('useLibraryUrlState — datasets-cited boolean params', () => {
  it('parses datasetsCited and publicationsDatasetsCited independently', () => {
    render(
      <MemoryRouter initialEntries={['/?datasetsCited=true&publicationsDatasetsCited=false']}>
        <BooleanFilterHarness />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.datasetsCited).toBe(true)
    expect(filters.publicationsDatasetsCited).toBe(false)
  })

  it('treats the legacy presentationsDatasetsCited param as datasetsCited', () => {
    render(
      <MemoryRouter initialEntries={['/?presentationsDatasetsCited=true']}>
        <BooleanFilterHarness />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.datasetsCited).toBe(true)
    // The legacy param must NOT leak into the new, independent publications filter.
    expect(filters.publicationsDatasetsCited).toBeUndefined()
  })

  it('leaves both undefined when neither param is present', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BooleanFilterHarness />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.datasetsCited).toBeUndefined()
    expect(filters.publicationsDatasetsCited).toBeUndefined()
  })

  it('serializes both citation filters to their own params and clears the legacy one', () => {
    render(
      <MemoryRouter initialEntries={['/?presentationsDatasetsCited=true']}>
        <BooleanFilterHarness />
      </MemoryRouter>,
    )
    fireEvent.click(document.getElementById('set-both')!)

    const search = document.getElementById('search')!.textContent!
    expect(search).toContain('datasetsCited=true')
    expect(search).toContain('publicationsDatasetsCited=false')
    // The legacy alias is dropped once the canonical params are written.
    expect(search).not.toContain('presentationsDatasetsCited')
  })

  it('removes the citation params from the URL when the filters are cleared', () => {
    render(
      <MemoryRouter initialEntries={['/?datasetsCited=true&publicationsDatasetsCited=false']}>
        <BooleanFilterHarness />
      </MemoryRouter>,
    )
    fireEvent.click(document.getElementById('clear-both')!)

    const search = document.getElementById('search')!.textContent!
    expect(search).not.toContain('datasetsCited')
    expect(search).not.toContain('publicationsDatasetsCited')
  })
})

describe('useLibraryUrlState — new asset filter params', () => {
  it('parses every new array filter key from its own param, defaulting the rest to empty arrays', () => {
    render(
      <MemoryRouter initialEntries={['/?modelFormat=ONNX,PyTorch&workspaceCloud=AWS&ipType=Patent&presentationEvent=ASHG&publicationJournal=Nature&fundingFunderName=NIH']}>
        <TestComponent />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.modelFormat).toEqual(['ONNX', 'PyTorch'])
    expect(filters.modelLicense).toEqual([])
    expect(filters.workspaceCloud).toEqual(['AWS'])
    expect(filters.ipType).toEqual(['Patent'])
    expect(filters.presentationEvent).toEqual(['ASHG'])
    expect(filters.publicationJournal).toEqual(['Nature'])
    expect(filters.fundingFunderName).toEqual(['NIH'])
  })

  it('parses the presentationDate and publicationPublishedDate ranges from their own params', () => {
    render(
      <MemoryRouter initialEntries={['/?presentedAfter=2020-01-01&presentedBefore=2023-12-31&publishedAfter=2019-01-01&publishedBefore=2022-06-30']}>
        <TestComponent />
      </MemoryRouter>,
    )
    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.presentationDate).toEqual({ after: '2020-01-01', before: '2023-12-31' })
    expect(filters.publicationPublishedDate).toEqual({ after: '2019-01-01', before: '2022-06-30' })
  })

  it('round-trips a new array filter and a new date filter through updateState', () => {
    const NewFilterHarness = () => {
      const [state, updateState] = useLibraryUrlState()
      const location = useLocation()
      return (
        <div>
          <div id="filters">{JSON.stringify(state.filters)}</div>
          <div id="search">{location.search}</div>
          <button
            onClick={() => updateState({
              filters: {
                ...EMPTY_FILTERS,
                modelFormat: ['ONNX'],
                presentationDate: { after: '2020-01-01' },
              },
            })}
          >Update New Filters
          </button>
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <NewFilterHarness />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Update New Filters'))

    const filters = JSON.parse(document.getElementById('filters')!.textContent!)
    expect(filters.modelFormat).toEqual(['ONNX'])
    expect(filters.presentationDate).toEqual({ after: '2020-01-01' })

    const search = document.getElementById('search')!.textContent!
    expect(search).toContain('modelFormat=ONNX')
    expect(search).toContain('presentedAfter=2020-01-01')
  })
})
