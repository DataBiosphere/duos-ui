import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import BiospecimenList from 'src/components/biospecimen_list/BiospecimenList'
import BiospecimenSummary from 'src/components/biospecimen_list/BiospecimenSummary'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 'SPEC-001',
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

describe('BiospecimenList component', () => {
  it('renders custom button label with count', async () => {
    const { container } = render(<BiospecimenListHarness initial={[sampleBiospecimen]} />)
    expect(container.querySelector('#add-biospecimen-btn')?.textContent).toContain('1')
  })

  it('renders button label with zero count when empty', async () => {
    const { container } = render(<BiospecimenListHarness initial={[]} />)
    expect(container.querySelector('#add-biospecimen-btn')?.textContent).toContain('0')
  })

  it('renders button without default icon', async () => {
    const { container } = render(<BiospecimenListHarness initial={[]} />)
    expect(container.querySelector('#add-biospecimen-btn .glyphicon-plus')).not.toBeInTheDocument()
  })

  it('updates button label when biospecimens count changes', async () => {
    const state: Biospecimen[] = [sampleBiospecimen]
    const { container } = render(
      <BiospecimenList
        biospecimens={state}
        columnsToShow={['donorId']}
        onBiospecimenChange={(b) => { state.splice(0, state.length, ...b) }}
        disabled={false}
      />,
    )
    expect(container.querySelector('#add-biospecimen-btn')?.textContent).toContain('1')
  })

  it('shows all default columns when none are provided', async () => {
    const state: Biospecimen[] = []
    const { container } = render(
      <BiospecimenList
        biospecimens={state}
        onBiospecimenChange={(b) => { state.splice(0, state.length, ...b) }}
        disabled={false}
      />,
    )
    expect(container.querySelector('#add-biospecimen-btn')).toBeInTheDocument()
  })

  it('deletes a biospecimen via modal confirmation', async () => {
    const user = userEvent.setup()
    const deleteAction = vi.fn()
    const { container } = render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
        editAction={vi.fn()}
        deleteAction={deleteAction}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    expect(deleteAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument())
  })
})
