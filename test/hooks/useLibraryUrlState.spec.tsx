import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
})
