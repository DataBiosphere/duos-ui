import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'

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

import ClinicalTrialList from 'src/components/clinical_trial_list/ClinicalTrialList'
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

const ClinicalTrialListHarness: React.FC<{ initial: ClinicalTrial[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<ClinicalTrial[]>(initial)
  return (
    <ClinicalTrialList
      clinicalTrials={items}
      columnsToShow={['title', 'registry']}
      onClinicalTrialChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

describe('ClinicalTrialList component', () => {
  it('renders existing trials', () => {
    render(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    expect(screen.getByText(sampleTrial.title)).toBeInTheDocument()
    expect(screen.getByText(sampleTrial.registry)).toBeInTheDocument()
  })

  it('opens trial in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleTrial.title)).toBeInTheDocument()
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('#registry')).toBeDisabled()
    expect(container.querySelector('#startDate')).toHaveValue(sampleTrial.startDate)
    expect(container.querySelector('#endDate')).toHaveValue(sampleTrial.endDate)
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(container.querySelector('.collaborator-form-cancel-button')?.textContent).toContain('Close')
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#title')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a new clinical trial', async () => {
    const user = userEvent.setup()
    const state: ClinicalTrial[] = []
    const { container } = render(
      <ClinicalTrialList
        clinicalTrials={state}
        columnsToShow={['title', 'status']}
        onClinicalTrialChange={(cts) => { state.splice(0, state.length, ...cts) }}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('#add-clinical-trial-btn')!)
    await user.type(container.querySelector('#title')!, 'Added Trial')
    await user.type(container.querySelector('#registry')!, 'Reg A')
    await user.type(container.querySelector('#identifier')!, 'ID999')
    await user.click(container.querySelector('#status input') as HTMLInputElement)
    await user.keyboard('Completed{Enter}')
    await user.type(container.querySelector('#sponsor')!, 'Org Z')
    const startDateInput = container.querySelector('#startDate') as HTMLInputElement
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } })
    await user.click(container.querySelector('#interventionType input') as HTMLInputElement)
    await user.keyboard('Device{Enter}')
    await user.click(container.querySelector('#phase input') as HTMLInputElement)
    await user.keyboard('Phase 3{Enter}')
    await user.type(container.querySelector('#url')!, 'https://added.example.com')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(state).toHaveLength(1)
    expect(state[0].title).toBe('Added Trial')
    expect(state[0].status).toBe(ClinicalTrialStatus.COMPLETED)
  })

  it('deletes a clinical trial via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeInTheDocument())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleTrial.title)).not.toBeInTheDocument())
  })
})
