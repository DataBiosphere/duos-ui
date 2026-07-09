import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, onChange, defaultValue, disabled }: {
    id?: string
    onChange: (value: string | undefined) => void
    defaultValue?: string | null
    disabled?: boolean
  }) => (
    <input
      id={id}
      type="text"
      defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}))

import ClinicalTrialRow from 'src/components/clinical_trial_list/ClinicalTrialRow'
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

describe('ClinicalTrialRow', () => {
  it('shows summary when not in edit mode and triggers edit', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title', 'status']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onClinicalTrialChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleTrial.title)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <ClinicalTrialRow
        id={0}
        editMode={true}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onClinicalTrialChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(sampleTrial.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        viewMode={true}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onClinicalTrialChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(sampleTrial.title)
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        viewMode={false}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title', 'status']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onClinicalTrialChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
