import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BiospecimenAddEdit from 'src/components/biospecimen_list/BiospecimenAddEdit'
import {
  Biospecimen,
  BioSpecimenPreservationMethod,
  BioSpecimenType,
  PostMortemIntervalUnit,
  Sex,
} from 'src/types/model'

type User = ReturnType<typeof userEvent.setup>

const storedBiospecimen: Biospecimen = {
  biospecimenId: 7,
  sampleId: 'VIAL-7',
  studyId: '12',
  donorId: 'DONOR-1',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  dateOfCollection: '2024-03-01',
  postMortemInterval: { value: 6, unit: PostMortemIntervalUnit.HOURS },
  sex: Sex.FEMALE,
  age: 61,
  organization: 'Brain Bank',
}

const renderForm = (biospecimen?: Biospecimen, biospecimens: Biospecimen[] = biospecimen ? [biospecimen] : []) => {
  const saved: Biospecimen[][] = []
  const closeAction = vi.fn()
  const view = render(
    <BiospecimenAddEdit
      id={biospecimen ? biospecimens.indexOf(biospecimen) : -1}
      biospecimen={biospecimen}
      biospecimens={biospecimens}
      closeAction={closeAction}
      onBiospecimensChange={items => saved.push(items)}
    />,
  )
  return { ...view, saved, closeAction }
}

const choose = async (user: User, container: HTMLElement, id: string, option: string) => {
  await user.click(container.querySelector(`#${id} input`)!)
  await user.click(await screen.findByText(option, { selector: '[class*="option"]' }))
}

const fillRequired = async (user: User, container: HTMLElement) => {
  await user.type(container.querySelector('#donorId')!, 'DONOR-9')
  await choose(user, container, 'specimenType', 'Normal Adjacent')
  await choose(user, container, 'preservationMethod', 'Rna Later')
  await user.type(container.querySelector('#organization')!, 'Biobank')
}

const save = (user: User, container: HTMLElement) =>
  user.click(container.querySelector('.collaborator-form-add-save-button')!)

describe('BiospecimenAddEdit', () => {
  it('adds a biospecimen without an id', async () => {
    const user = userEvent.setup()
    const { container, saved, closeAction } = renderForm()
    expect(screen.getByRole('heading', { name: 'New Biospecimen' })).toBeInTheDocument()
    await fillRequired(user, container)
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0]).toHaveLength(1)
    expect(saved[0][0]).toMatchObject({
      donorId: 'DONOR-9',
      specimenType: BioSpecimenType.NORMAL_ADJACENT,
      preservationMethod: BioSpecimenPreservationMethod.RNA_LATER,
      organization: 'Biobank',
    })
    expect(saved[0][0].biospecimenId).toBeUndefined()
    expect(saved[0][0].age).toBeUndefined()
    expect(saved[0][0].postMortemInterval).toBeUndefined()
    expect(closeAction).toHaveBeenCalledTimes(1)
  })

  it('appends to the biospecimens already in the study', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm(undefined, [storedBiospecimen])
    await fillRequired(user, container)
    await save(user, container)

    expect(saved[0]).toHaveLength(2)
    expect(saved[0][0]).toBe(storedBiospecimen)
    expect(saved[0][1].biospecimenId).toBeUndefined()
  })

  it('saves the optional fields that are filled in', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(container.querySelector('#sampleId')!, 'VIAL-1')
    await user.type(container.querySelector('#preservationDetails')!, '-80C')
    await user.type(container.querySelector('#postMortemIntervalValue')!, '2.5')
    await choose(user, container, 'postMortemIntervalUnit', 'Days')
    await choose(user, container, 'sex', 'Not Reported')
    await user.type(container.querySelector('#age')!, '0')
    await save(user, container)

    expect(saved[0][0]).toMatchObject({
      sampleId: 'VIAL-1',
      preservationDetails: '-80C',
      postMortemInterval: { value: 2.5, unit: PostMortemIntervalUnit.DAYS },
      sex: Sex.NOT_REPORTED,
      age: 0,
    })
  })

  it('does not save without the required fields', async () => {
    const user = userEvent.setup()
    const { container, saved, closeAction } = renderForm()
    await user.type(container.querySelector('#donorId')!, 'DONOR-9')
    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(closeAction).not.toHaveBeenCalled()
  })

  it('does not save a post-mortem interval without its unit', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(container.querySelector('#postMortemIntervalValue')!, '4')
    await save(user, container)

    expect(saved).toHaveLength(0)
  })

  it('does not save a negative age', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(container.querySelector('#age')!, '-3')
    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container).toHaveTextContent('Please enter a number of zero or more')
  })

  it('keeps the biospecimenId and stored fields of an edited biospecimen', async () => {
    const user = userEvent.setup()
    const other = { ...storedBiospecimen, biospecimenId: 8, sampleId: 'VIAL-8' }
    const { container, saved } = renderForm(storedBiospecimen, [other, storedBiospecimen])
    expect(screen.getByRole('heading', { name: 'Edit VIAL-7' })).toBeInTheDocument()
    await user.clear(container.querySelector('#donorId')!)
    await user.type(container.querySelector('#donorId')!, 'DONOR-2')
    await save(user, container)

    expect(saved[0]).toHaveLength(2)
    expect(saved[0][0]).toBe(other)
    expect(saved[0][1]).toEqual({ ...storedBiospecimen, donorId: 'DONOR-2' })
  })

  it('shows and saves a dropdown value changed on edit', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm(storedBiospecimen)
    await choose(user, container, 'specimenType', 'Plasma')
    await user.type(container.querySelector('#donorId')!, '2')

    expect(container.querySelector('#specimenType')).toHaveTextContent('Plasma')
    await save(user, container)
    expect(saved[0][0].specimenType).toBe(BioSpecimenType.PLASMA)
  })

  it('removes the optional fields that are cleared on edit', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm(storedBiospecimen)
    await user.clear(container.querySelector('#age')!)
    await user.clear(container.querySelector('#postMortemIntervalValue')!)
    await user.click(container.querySelector('#postMortemIntervalUnit input')!)
    await user.keyboard('{Backspace}{Escape}')
    await save(user, container)

    expect(saved[0][0].biospecimenId).toBe(7)
    expect(saved[0][0].age).toBeUndefined()
    expect(saved[0][0].postMortemInterval).toBeUndefined()
  })

  it('sends a cleared biospecimen ID as blank, so it is not kept', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm(storedBiospecimen)
    await user.clear(container.querySelector('#sampleId')!)
    await save(user, container)

    expect(saved[0][0].sampleId).toBe('')
  })

  it('shows a stored biospecimen read only', async () => {
    render(
      <BiospecimenAddEdit
        id={0}
        biospecimen={storedBiospecimen}
        biospecimens={[storedBiospecimen]}
        closeAction={vi.fn()}
        onBiospecimensChange={vi.fn()}
        readOnly={true}
      />,
    )
    expect(screen.getByRole('heading', { name: 'VIAL-7' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('DONOR-1')).toBeDisabled()
    expect(screen.getByText('Fresh Frozen')).toBeInTheDocument()
    expect(screen.getByDisplayValue('61')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument())
  })
})
