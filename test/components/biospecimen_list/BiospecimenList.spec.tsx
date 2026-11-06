import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import BiospecimenList from 'src/components/biospecimen_list/BiospecimenList'
import BiospecimenSummary from 'src/components/biospecimen_list/BiospecimenSummary'
import { Countries } from 'src/libs/ajax/Countries'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'

vi.mock('src/libs/ajax/Countries', () => ({ Countries: { getCountries: vi.fn() } }))

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 1,
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}

const BiospecimenListHarness: React.FC<{ initial: Biospecimen[], onChange?: (items: Biospecimen[]) => void }> = ({ initial, onChange }) => {
  const [items, setItems] = React.useState<Biospecimen[]>(initial)
  return (
    <BiospecimenList
      biospecimens={items}
      columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
      onBiospecimenChange={(next) => {
        setItems(next)
        onChange?.(next)
      }}
      disabled={false}
    />
  )
}

type User = ReturnType<typeof userEvent.setup>

const choose = async (user: User, container: HTMLElement, id: string, label: string) => {
  await user.click(container.querySelector(`#${id} input`)!)
  await user.keyboard(label)
  await user.keyboard('{Enter}')
}

beforeAll(() => Modal.setAppElement(document.body))

beforeEach(() => {
  vi.mocked(Countries.getCountries).mockReset().mockResolvedValue(['Canada'])
})

describe('BiospecimenList component', () => {
  it('lists the study\'s biospecimens', () => {
    render(<BiospecimenListHarness initial={[sampleBiospecimen, { ...sampleBiospecimen, biospecimenId: 2, donorId: 'DONOR-002' }]} />)

    expect(screen.getByText('DONOR-001')).toBeInTheDocument()
    expect(screen.getByText('DONOR-002')).toBeInTheDocument()
  })

  it('adds a biospecimen without an id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<BiospecimenListHarness initial={[sampleBiospecimen]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Add Biospecimen/ }))
    await user.type(container.querySelector('#donorId')!, 'DONOR-NEW')
    await choose(user, container, 'specimenType', 'Saliva')
    await choose(user, container, 'preservationMethod', 'FFPE')
    await user.type(container.querySelector('#organization')!, 'Broad')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('DONOR-NEW')).toBeInTheDocument()
    const [items] = onChange.mock.calls[0] as [Biospecimen[]]
    expect(items).toHaveLength(2)
    expect(items[0]).toBe(sampleBiospecimen)
    expect(items[1]).not.toHaveProperty('biospecimenId')
    expect(items[1]).toMatchObject({ donorId: 'DONOR-NEW', specimenType: BioSpecimenType.SALIVA })
  })

  it('edits a biospecimen and keeps its biospecimenId', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<BiospecimenListHarness initial={[sampleBiospecimen]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Edit Biospecimen' }))
    await user.clear(container.querySelector('#donorId')!)
    await user.type(container.querySelector('#donorId')!, 'DONOR-EDITED')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('DONOR-EDITED')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith([{ ...sampleBiospecimen, donorId: 'DONOR-EDITED' }])
  })

  it('removes a biospecimen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const other = { ...sampleBiospecimen, biospecimenId: 2, donorId: 'DONOR-002' }
    render(<BiospecimenListHarness initial={[sampleBiospecimen, other]} onChange={onChange} />)

    await user.click(screen.getAllByRole('button', { name: 'Delete Biospecimen' })[0])
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    await user.click(Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!)

    expect(onChange).toHaveBeenCalledWith([other])
    expect(screen.queryByText('DONOR-001')).toBeNull()
  })

  it('offers the ISO-3166 countries as countries of origin', async () => {
    const user = userEvent.setup()
    const { container } = render(<BiospecimenListHarness initial={[]} />)
    await waitFor(() => expect(Countries.getCountries).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: /Add Biospecimen/ }))
    await user.click(container.querySelector('#countryOfOrigin input')!)

    expect(await screen.findByText('Canada')).toBeInTheDocument()
  })

  it('still opens the form when the countries do not load', async () => {
    const user = userEvent.setup()
    vi.mocked(Countries.getCountries).mockRejectedValue(new Error('offline'))
    const { container } = render(<BiospecimenListHarness initial={[]} />)

    await user.click(screen.getByRole('button', { name: /Add Biospecimen/ }))

    expect(container.querySelector('#donorId')).toBeInTheDocument()
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
