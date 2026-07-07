import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { makeRenderCellHelper } from './columnTestUtils'
import { makeClinicalTrialColumns } from 'src/components/data_library/columns/clinicalTrialColumns'
import { ClinicalTrialAsset } from 'src/types/library'
import { ClinicalTrialInterventionType, ClinicalTrialPhase, ClinicalTrialStatus } from 'src/types/model'

const makeRow = (overrides: Partial<ClinicalTrialAsset> = {}): ClinicalTrialAsset => ({
  clinicalTrialId: 'NCT00000001',
  studyId: 42,
  studyName: 'Test Study',
  title: 'A Phase II Trial',
  registry: 'ClinicalTrials.gov',
  identifier: 'NCT00000001',
  status: ClinicalTrialStatus.RECRUITING,
  sponsor: 'NHGRI',
  startDate: '2024-01-01',
  interventionType: ClinicalTrialInterventionType.BIOLOGICAL,
  description: 'A test clinical trial',
  phase: ClinicalTrialPhase.PHASE2,
  url: 'https://clinicaltrials.gov/study/NCT00000001',
  tags: [],
  ...overrides,
})

const renderCell = makeRenderCellHelper<ClinicalTrialAsset>(makeClinicalTrialColumns, makeRow)

describe('makeClinicalTrialColumns — Trial Title column', () => {
  it('renders the title as a link when url is present', () => {
    const { container } = renderCell('title', 'Phase II Immunotherapy Study', { url: 'https://clinicaltrials.gov/study/NCT001' })
    expect(container.querySelector('a[href="https://clinicaltrials.gov/study/NCT001"]')).toBeInTheDocument()
    expect(screen.getByText('Phase II Immunotherapy Study')).toBeInTheDocument()
  })

  it('sets target="_blank" and rel="noopener noreferrer" on the title link', () => {
    const { container } = renderCell('title', 'Phase II Immunotherapy Study', { url: 'https://clinicaltrials.gov/study/NCT001' })
    const link = container.querySelector('a[href="https://clinicaltrials.gov/study/NCT001"]')!
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the title as plain text when url is absent', () => {
    const { container } = renderCell('title', 'No URL Trial', { url: '' })
    expect(screen.getByText('No URL Trial')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('renders an empty cell gracefully when title is absent', () => {
    const { container } = renderCell('title', '', { url: '' })
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Study column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(screen.getByText('Genome Atlas')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Genome Atlas', { studyId: 7 })
    expect(container.querySelector('a[href="/studies/7"]')).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Identifier column', () => {
  it('renders the identifier as a link when url is present', () => {
    const { container } = renderCell('identifier', 'NCT00000001', { url: 'https://clinicaltrials.gov/study/NCT00000001' })
    expect(container.querySelector('a[href="https://clinicaltrials.gov/study/NCT00000001"]')).toBeInTheDocument()
    expect(screen.getByText('NCT00000001')).toBeInTheDocument()
  })

  it('renders the identifier as plain text when url is absent', () => {
    const { container } = renderCell('identifier', 'NCT00000001', { url: '' })
    expect(screen.getByText('NCT00000001')).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('renders an empty cell gracefully when identifier is absent', () => {
    const { container } = renderCell('identifier', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Status column', () => {
  it('renders the status as a chip', () => {
    const { container } = renderCell('status', 'RECRUITING')
    expect(container.querySelector('.MuiChip-root')).toBeInTheDocument()
    expect(screen.getByText('Recruiting')).toBeInTheDocument()
  })

  it('converts ACTIVE_NOT_RECRUITING to title case with spaces', () => {
    renderCell('status', 'ACTIVE_NOT_RECRUITING')
    expect(screen.getByText('Active Not Recruiting')).toBeInTheDocument()
  })

  it('renders an empty chip when status is absent', () => {
    const { container } = renderCell('status', '')
    expect(container.querySelector('.MuiChip-root')).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Phase column', () => {
  it('renders PHASE2 as "PHASE2" with underscores replaced by spaces', () => {
    renderCell('phase', 'PHASE2')
    expect(screen.getByText('PHASE2')).toBeInTheDocument()
  })

  it('renders EARLY_PHASE1 with "Early" prefix lowercased', () => {
    renderCell('phase', 'EARLY_PHASE1')
    expect(screen.getByText('Early PHASE1')).toBeInTheDocument()
  })

  it('renders NA phase gracefully', () => {
    renderCell('phase', 'NA')
    expect(screen.getByText('NA')).toBeInTheDocument()
  })

  it('renders an empty cell when phase is absent', () => {
    const { container } = renderCell('phase', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Intervention Type column', () => {
  it('renders the intervention type in title case', () => {
    renderCell('interventionType', 'BIOLOGICAL')
    expect(screen.getByText('Biological')).toBeInTheDocument()
  })

  it('converts COMBINATION_PRODUCT to "Combination Product"', () => {
    renderCell('interventionType', 'COMBINATION_PRODUCT')
    expect(screen.getByText('Combination Product')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when interventionType is absent', () => {
    const { container } = renderCell('interventionType', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Sponsor column', () => {
  it('renders the sponsor name', () => {
    renderCell('sponsor', 'NIH/NHGRI')
    expect(screen.getByText('NIH/NHGRI')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when sponsor is absent', () => {
    const { container } = renderCell('sponsor', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — Start Date column', () => {
  it('renders the start date', () => {
    renderCell('startDate', '2024-03-15')
    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when startDate is absent', () => {
    const { container } = renderCell('startDate', '')
    expect(container).toBeInTheDocument()
  })
})

describe('makeClinicalTrialColumns — column structure', () => {
  it('returns 8 column definitions', () => {
    expect(makeClinicalTrialColumns()).toHaveLength(8)
  })

  it('defines expected fields in order', () => {
    const fields = makeClinicalTrialColumns().map(c => c.field)
    expect(fields).toEqual(['title', 'studyName', 'identifier', 'status', 'phase', 'interventionType', 'sponsor', 'startDate'])
  })
})
