import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ClinicalTrialSummary from 'src/components/clinical_trial_list/ClinicalTrialSummary'
import {
  ClinicalTrial,
  ClinicalTrialStatus,
  ClinicalTrialInterventionType,
  ClinicalTrialPhase,
} from 'src/types/model'

const sampleTrial: ClinicalTrial = {
  clinicalTrialId: 'ct1',
  studyId: 's1',
  title: 'Baseline Trial',
  registry: 'ClinicalTrials.gov',
  identifier: 'NCT00000001',
  status: ClinicalTrialStatus.COMPLETED,
  sponsor: 'NIH',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  interventionType: ClinicalTrialInterventionType.DRUG,
  description: 'Desc',
  phase: ClinicalTrialPhase.PHASE2,
  url: 'https://example.com/trial',
  tags: ['oncology', 'phase2'],
}

describe('ClinicalTrialSummary', () => {
  it('renders tags and date range', () => {
    render(
      <ClinicalTrialSummary
        clinicalTrial={sampleTrial}
        columnsToShow={[
          'title',
          'registry',
          'identifier',
          'status',
          'sponsor',
          'dateRange',
          'interventionType',
          'phase',
          'url',
          'tags',
        ]}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleTrial.title)).toBeInTheDocument()
    expect(screen.getByText(sampleTrial.registry)).toBeInTheDocument()
    expect(screen.getByText(sampleTrial.identifier)).toBeInTheDocument()
    expect(screen.getByText(/Completed/i)).toBeInTheDocument()
    expect(screen.getByText(sampleTrial.sponsor)).toBeInTheDocument()
    expect(screen.getByText('2024-01-01 → 2025-12-31')).toBeInTheDocument()
    expect(screen.getByText(/Drug/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase II|Phase 2/i)).toBeInTheDocument()
    expect(screen.getByText(sampleTrial.url)).toBeInTheDocument()
    expect(screen.getByText('oncology, phase2')).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <ClinicalTrialSummary
        clinicalTrial={sampleTrial}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={viewFn}
        disabled={false}
      />,
    )
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
