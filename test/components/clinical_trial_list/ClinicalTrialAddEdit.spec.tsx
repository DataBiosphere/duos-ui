import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
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

import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
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

describe('ClinicalTrialAddEdit component', () => {
  it('opens add form and enforces validation disabling save then adds', async () => {
    const user = userEvent.setup()
    const added: ClinicalTrial[] = []
    const { container } = render(
      <ClinicalTrialAddEdit
        id={-1}
        clinicalTrial={undefined}
        clinicalTrials={[]}
        closeAction={vi.fn()}
        onClinicalTrialChange={(cts) => { added.splice(0, added.length, ...cts) }}
      />,
    )
    await user.type(container.querySelector('#title')!, 'My Trial')
    await user.type(container.querySelector('#registry')!, 'Registry X')
    await user.type(container.querySelector('#identifier')!, 'ID123')
    await user.click(container.querySelector('#status input') as HTMLInputElement)
    await user.keyboard('Completed{Enter}')
    await user.type(container.querySelector('#sponsor')!, 'Sponsor Y')
    const startDateInput = container.querySelector('#startDate') as HTMLInputElement
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } })
    await user.click(container.querySelector('#interventionType input') as HTMLInputElement)
    await user.keyboard('Drug{Enter}')
    await user.click(container.querySelector('#phase input') as HTMLInputElement)
    await user.keyboard('Phase 2{Enter}')
    await user.type(container.querySelector('#url')!, 'https://trial.example.com')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(added).toHaveLength(1)
    expect(added[0].title).toBe('My Trial')
    expect(added[0].identifier).toBe('ID123')
    expect(added[0].status).toBe(ClinicalTrialStatus.COMPLETED)
  })

  it('edits existing trial and saves changes', async () => {
    const user = userEvent.setup()
    const trials: ClinicalTrial[] = [sampleTrial]
    const onChangeFn = vi.fn((updated: ClinicalTrial[]) => {
      expect(updated[0].title).toBe('Baseline Trial Edited')
      expect(updated[0].phase).toBe(ClinicalTrialPhase.PHASE2)
    })
    const { container } = render(
      <ClinicalTrialAddEdit
        id={0}
        clinicalTrial={sampleTrial}
        clinicalTrials={trials}
        closeAction={vi.fn()}
        onClinicalTrialChange={onChangeFn}
      />,
    )
    await user.clear(container.querySelector('#title')!)
    await user.type(container.querySelector('#title')!, 'Baseline Trial Edited')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
  })
})
