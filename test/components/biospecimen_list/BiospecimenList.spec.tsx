import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import BiospecimenList from 'src/components/biospecimen_list/BiospecimenList'
import BiospecimenSummary from 'src/components/biospecimen_list/BiospecimenSummary'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 1,
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}

const BiospecimenListHarness: React.FC<{ initial: Biospecimen[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Biospecimen[]>(initial)
  return (
    <BiospecimenList
      biospecimens={items}
      columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
      onBiospecimenChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

vi.mock('src/libs/ajax/Countries', () => ({
  Countries: { getCountries: vi.fn().mockResolvedValue([]) },
}))

const renderHarness = (initial: Biospecimen[]) => {
  const changes: Biospecimen[][] = []
  const Harness = () => {
    const [items, setItems] = React.useState<Biospecimen[]>(initial)
    return (
      <BiospecimenList
        biospecimens={items}
        columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
        onBiospecimenChange={(next) => {
          changes.push(next)
          setItems(next)
        }}
        disabled={false}
      />
    )
  }
  return { ...render(<Harness />), changes }
}

const secondBiospecimen: Biospecimen = { ...sampleBiospecimen, biospecimenId: 2, donorId: 'DONOR-002' }

describe('BiospecimenList component', () => {
  it('lists the study\'s biospecimens', () => {
    render(<BiospecimenListHarness initial={[sampleBiospecimen, secondBiospecimen]} />)
    expect(screen.getByText('DONOR-001')).toBeInTheDocument()
    expect(screen.getByText('DONOR-002')).toBeInTheDocument()
  })

  it('offers an add button', () => {
    const { container } = render(<BiospecimenListHarness initial={[]} />)
    const button = container.querySelector('#add-biospecimen-btn')
    expect(button).toHaveTextContent('Add Biospecimen')
    expect(button).not.toBeDisabled()
  })

  it('adds a biospecimen without an id beside the stored ones', async () => {
    const user = userEvent.setup()
    const { container, changes } = renderHarness([sampleBiospecimen])
    await user.click(container.querySelector('#add-biospecimen-btn')!)
    await user.type(container.querySelector('#donorId')!, 'DONOR-NEW')
    await user.click(container.querySelector('#specimenType input')!)
    await user.click(await screen.findByText('Saliva', { selector: '[class*="option"]' }))
    await user.click(container.querySelector('#preservationMethod input')!)
    await user.click(await screen.findByText('Ffpe', { selector: '[class*="option"]' }))
    await user.type(container.querySelector('#organization')!, 'Biobank')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(changes).toHaveLength(1)
    expect(changes[0]).toHaveLength(2)
    expect(changes[0][0]).toBe(sampleBiospecimen)
    expect(changes[0][1].biospecimenId).toBeUndefined()
    expect(screen.getByText('DONOR-NEW')).toBeInTheDocument()
  })

  it('edits a biospecimen and keeps its biospecimenId', async () => {
    const user = userEvent.setup()
    const { container, changes } = renderHarness([sampleBiospecimen, secondBiospecimen])
    await user.click(screen.getAllByRole('button', { name: 'Edit Biospecimen' })[1])
    await user.clear(container.querySelector('#donorId')!)
    await user.type(container.querySelector('#donorId')!, 'DONOR-EDITED')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(changes).toHaveLength(1)
    expect(changes[0].map(b => b.biospecimenId)).toEqual([1, 2])
    expect(changes[0][1].donorId).toBe('DONOR-EDITED')
    expect(screen.getByText('DONOR-EDITED')).toBeInTheDocument()
  })

  it('removes a biospecimen', async () => {
    const user = userEvent.setup()
    const { changes } = renderHarness([sampleBiospecimen, secondBiospecimen])
    await user.click(screen.getAllByRole('button', { name: 'Delete Biospecimen' })[0])
    const modal = await waitFor(() => document.querySelector('.ReactModal__Content')!)
    await user.click(Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual([secondBiospecimen])
    expect(screen.queryByText('DONOR-001')).toBeNull()
  })

  it('deletes a biospecimen via modal confirmation', async () => {
    const user = userEvent.setup()
    const deleteAction = vi.fn()
    render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
        editAction={vi.fn()}
        deleteAction={deleteAction}
        disabled={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Delete Biospecimen' }))
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    expect(deleteAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument())
  })
})
