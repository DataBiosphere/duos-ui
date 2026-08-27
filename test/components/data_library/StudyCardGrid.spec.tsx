import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test-utils'
import StudyCardGrid from 'src/components/data_library/StudyCardGrid'
import { AssetType, LibraryDataGridProps, StudyAggregation } from 'src/types/library'

const buildStudy = (studyId: number, datasetIds: number[], overrides: Partial<StudyAggregation> = {}): StudyAggregation => ({
  studyId,
  studyName: `Study ${studyId}`,
  piName: 'Dr. Example',
  species: 'Human',
  phenotype: 'Various',
  dataCustodianEmail: [],
  dataTypes: [],
  dataUseCodes: [],
  accessTypes: [],
  datasetCount: datasetIds.length,
  totalParticipants: 10,
  datasetIds,
  modelCount: 0,
  workspaceCount: 0,
  ...overrides,
})

const STUDIES = [buildStudy(1, [10, 11]), buildStudy(2, [20])]

const renderGrid = (overrides: Partial<LibraryDataGridProps> = {}) => {
  const props: LibraryDataGridProps = {
    assetType: AssetType.STUDIES,
    data: STUDIES,
    loading: false,
    total: 2,
    paginationModel: { page: 0, pageSize: 25 },
    onPaginationChange: vi.fn(),
    sortModel: [],
    onSortChange: vi.fn(),
    selectedDatasetIds: [],
    onSelectionChange: vi.fn(),
    ...overrides,
  }
  renderWithRouter(<StudyCardGrid {...props} />)
  return props
}

describe('StudyCardGrid', () => {
  it('renders a card per study', () => {
    renderGrid()
    expect(screen.getByRole('link', { name: 'Study 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Study 2' })).toBeInTheDocument()
  })

  it('selects every dataset belonging to a study', async () => {
    const props = renderGrid()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Study 1' }))
    expect(props.onSelectionChange).toHaveBeenCalledWith([10, 11])
  })

  it('deselects a study without disturbing the others', async () => {
    const props = renderGrid({ selectedDatasetIds: [10, 11, 20] })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Study 1' }))
    expect(props.onSelectionChange).toHaveBeenCalledWith([20])
  })

  it('checks a study whose datasets are already selected', () => {
    renderGrid({ selectedDatasetIds: [20] })
    expect(screen.getByRole('checkbox', { name: 'Select Study 2' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Study 1' })).not.toBeChecked()
  })

  it('selects every study on the page at once', async () => {
    const props = renderGrid()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all on page' }))
    expect(props.onSelectionChange).toHaveBeenCalledWith([10, 11, 20])
  })

  it('clears the page when select-all is already on', async () => {
    const props = renderGrid({ selectedDatasetIds: [10, 11, 20] })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all on page' }))
    expect(props.onSelectionChange).toHaveBeenCalledWith([])
  })

  it('reports a chosen sort as a sort model', async () => {
    const props = renderGrid()
    await userEvent.click(screen.getByLabelText('Sort studies'))
    await userEvent.click(screen.getByRole('option', { name: 'Most Participants' }))
    expect(props.onSortChange).toHaveBeenCalledWith([{ field: 'totalParticipants', sort: 'desc' }])
  })

  it('clears the sort model when returning to relevance', async () => {
    const props = renderGrid({ sortModel: [{ field: 'studyName', sort: 'asc' }] })
    await userEvent.click(screen.getByLabelText('Sort studies'))
    await userEvent.click(screen.getByRole('option', { name: 'Relevance' }))
    expect(props.onSortChange).toHaveBeenCalledWith([])
  })

  it('pages using a one-based control over a zero-based model', async () => {
    const props = renderGrid({ total: 60 })
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(props.onPaginationChange).toHaveBeenCalledWith({ page: 1, pageSize: 25 })
  })

  it('returns to the first page when the page size changes', async () => {
    const props = renderGrid({ total: 60 })
    await userEvent.click(screen.getByLabelText('Studies per page'))
    await userEvent.click(screen.getByRole('option', { name: '50 per page' }))
    expect(props.onPaginationChange).toHaveBeenCalledWith({ page: 0, pageSize: 50 })
  })

  it('shows a spinner only while first loading', () => {
    renderGrid({ data: [], loading: true })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('says so when nothing matched', () => {
    renderGrid({ data: [], loading: false, total: 0 })
    expect(screen.getByText('No studies match your search.')).toBeInTheDocument()
  })
})
