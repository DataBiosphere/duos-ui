import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test-utils'
import StudyCard from 'src/components/data_library/StudyCard'
import { StudyAggregation } from 'src/types/library'

const buildStudy = (overrides: Partial<StudyAggregation> = {}): StudyAggregation => ({
  studyId: 1,
  studyName: 'Synthetic Minimal Study',
  piName: 'Dr. Example',
  species: 'Human',
  phenotype: 'Various',
  dataCustodianEmail: [],
  dataTypes: ['RNA-Seq'],
  dataUseCodes: ['HMB'],
  accessTypes: ['controlled'],
  datasetCount: 3,
  totalParticipants: 5567,
  datasetIds: [10, 11, 12],
  modelCount: 0,
  workspaceCount: 0,
  ...overrides,
})

const renderCard = (study: StudyAggregation, selected = false, onToggle = vi.fn()) => {
  renderWithRouter(<StudyCard study={study} selected={selected} onToggle={onToggle} />)
  return onToggle
}

describe('StudyCard', () => {
  it('links the study name to its detail page', () => {
    renderCard(buildStudy())
    expect(screen.getByRole('link', { name: 'Synthetic Minimal Study' })).toHaveAttribute('href', '/studies/1')
  })

  it('renders the metadata a researcher scans for', () => {
    renderCard(buildStudy())
    expect(screen.getByText(/Dr. Example/)).toBeInTheDocument()
    expect(screen.getByText(/Human/)).toBeInTheDocument()
    expect(screen.getByText(/Various/)).toBeInTheDocument()
    expect(screen.getByText('RNA-Seq')).toBeInTheDocument()
  })

  it('formats participant counts with separators', () => {
    renderCard(buildStudy({ totalParticipants: 4444444 }))
    expect(screen.getByText('4,444,444')).toBeInTheDocument()
  })

  it('singularises a one-dataset study', () => {
    renderCard(buildStudy({ datasetCount: 1 }))
    expect(screen.getByText('Dataset')).toBeInTheDocument()
    expect(screen.queryByText('Datasets')).not.toBeInTheDocument()
  })

  it('omits metadata rows the study does not carry', () => {
    renderCard(buildStudy({ species: '', phenotype: '' }))
    expect(screen.queryByText(/Species:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Phenotype:/)).not.toBeInTheDocument()
  })

  it('omits model and workspace stats when there are none', () => {
    renderCard(buildStudy())
    expect(screen.queryByText('Models')).not.toBeInTheDocument()
    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument()
  })

  it('shows model and workspace stats when the study has them', () => {
    renderCard(buildStudy({ modelCount: 2, workspaceCount: 1 }))
    expect(screen.getByText('Models')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
  })

  it('collapses data types past the third into a count', () => {
    renderCard(buildStudy({ dataTypes: ['Hybrid Capture', 'RNA-Seq', 'Spatial Transcriptomics', 'WGS'] }))
    expect(screen.getByText('Hybrid Capture')).toBeInTheDocument()
    expect(screen.getByText('Spatial Transcriptomics')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.queryByText('WGS')).not.toBeInTheDocument()
  })

  it('labels access types the way the Datasets grid does', () => {
    renderCard(buildStudy({ accessTypes: ['controlled', 'open', 'external'] }))
    expect(screen.getByText('via DUOS')).toBeInTheDocument()
    expect(screen.getByText('Open Access')).toBeInTheDocument()
    expect(screen.getByText('External to DUOS')).toBeInTheDocument()
  })

  it('reports the study id when its checkbox is toggled', async () => {
    const onToggle = renderCard(buildStudy({ studyId: 42 }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Synthetic Minimal Study' }))
    expect(onToggle).toHaveBeenCalledWith(42)
  })

  it('reflects the selected state it is given', () => {
    renderCard(buildStudy(), true)
    expect(screen.getByRole('checkbox', { name: 'Select Synthetic Minimal Study' })).toBeChecked()
  })
})
