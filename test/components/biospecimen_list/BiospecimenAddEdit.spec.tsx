import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BiospecimenAddEdit from 'src/components/biospecimen_list/BiospecimenAddEdit'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType, PostMortemIntervalUnit, Sex } from 'src/types/model'

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 7,
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}

type User = ReturnType<typeof userEvent.setup>

const countries = ['Canada', 'United States of America (the)']

const renderForm = (props: { biospecimen?: Biospecimen, biospecimens?: Biospecimen[], id?: number, readOnly?: boolean } = {}) => {
  const saved: Biospecimen[][] = []
  const closeAction = vi.fn()
  const { biospecimen } = props
  const view = render(
    <BiospecimenAddEdit
      id={props.id ?? (biospecimen ? 0 : -1)}
      biospecimen={biospecimen}
      biospecimens={props.biospecimens ?? (biospecimen ? [biospecimen] : [])}
      closeAction={closeAction}
      onBiospecimensChange={items => saved.push(items)}
      readOnly={props.readOnly}
      countries={countries}
    />,
  )
  return { ...view, saved, closeAction }
}

const field = (container: HTMLElement, id: string) => container.querySelector<HTMLInputElement>(`#${id}`)!

const choose = async (user: User, container: HTMLElement, id: string, label: string) => {
  await user.click(field(container, `${id} input`))
  await user.keyboard(label)
  await user.keyboard('{Enter}')
}

const fillRequired = async (user: User, container: HTMLElement) => {
  await user.type(field(container, 'donorId'), 'DONOR-9')
  await choose(user, container, 'specimenType', 'Plasma')
  await choose(user, container, 'preservationMethod', 'Cryopreserved')
  await user.type(field(container, 'organization'), 'Broad Biobank')
}

const save = (user: User, container: HTMLElement) =>
  user.click(container.querySelector('.collaborator-form-add-save-button')!)

describe('BiospecimenAddEdit', () => {
  it('adds a new biospecimen without an id', async () => {
    const user = userEvent.setup()
    const { container, saved, closeAction } = renderForm({ biospecimens: [sampleBiospecimen] })
    expect(screen.getByRole('heading', { name: 'New Biospecimen' })).toBeInTheDocument()

    await fillRequired(user, container)
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0]).toHaveLength(2)
    expect(saved[0][0]).toBe(sampleBiospecimen)
    expect(saved[0][1]).toEqual({
      studyId: '',
      donorId: 'DONOR-9',
      specimenType: BioSpecimenType.PLASMA,
      preservationMethod: BioSpecimenPreservationMethod.CRYO_PRESERVED,
      organization: 'Broad Biobank',
    })
    expect(saved[0][1]).not.toHaveProperty('biospecimenId')
    expect(closeAction).toHaveBeenCalledTimes(1)
  })

  it('does not save until the required fields are set', async () => {
    const user = userEvent.setup()
    const { container, saved, closeAction } = renderForm()

    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(closeAction).not.toHaveBeenCalled()
    const errored = Array.from(container.querySelectorAll('label.errored'), label => label.getAttribute('for'))
    expect(errored).toEqual(['donorId', 'specimenType', 'preservationMethod', 'organization'])
  })

  it('does not save after a required select is cleared', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ biospecimen: sampleBiospecimen })
    await user.click(field(container, 'specimenType input'))
    await user.keyboard('{Backspace}')

    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container.querySelector('label.errored[for="specimenType"]')).toBeInTheDocument()
  })

  it('asks for a required field the stored biospecimen lacks', async () => {
    const user = userEvent.setup()
    const { organization: _organization, ...lacking } = sampleBiospecimen
    const { container, saved } = renderForm({ biospecimen: lacking as Biospecimen })

    await save(user, container)
    expect(saved).toHaveLength(0)
    expect(container.querySelector('label.errored[for="organization"]')).toBeInTheDocument()

    await user.type(field(container, 'organization'), 'Broad Biobank')
    await save(user, container)
    expect(saved[0][0]).toEqual({ ...sampleBiospecimen, organization: 'Broad Biobank' })
  })

  it('asks for a specimen type when the stored one is not listed', async () => {
    const user = userEvent.setup()
    const unlisted = { ...sampleBiospecimen, specimenType: 'blood' } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: unlisted })
    expect(container.querySelector('#specimenType')!.textContent).toBe('')

    await save(user, container)
    expect(saved).toHaveLength(0)
    expect(container.querySelector('label.errored[for="specimenType"]')).toBeInTheDocument()

    await choose(user, container, 'specimenType', 'Blood')
    await save(user, container)
    expect(saved[0][0].specimenType).toBe(BioSpecimenType.BLOOD)
  })

  it('does not save a donor id or organization of only spaces', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.clear(field(container, 'donorId'))
    await user.type(field(container, 'donorId'), '   ')
    await user.clear(field(container, 'organization'))
    await user.type(field(container, 'organization'), '   ')

    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container.querySelectorAll('label.errored[for="donorId"], label.errored[for="organization"]')).toHaveLength(2)
  })

  it('saves a biospecimen whose stored ids are numbers', async () => {
    const user = userEvent.setup()
    const numeric = { ...sampleBiospecimen, sampleId: 987, donorId: 12345 } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: numeric })
    expect(field(container, 'sampleId')).toHaveValue('987')
    expect(field(container, 'donorId')).toHaveValue('12345')

    await user.type(field(container, 'organization'), ' Lab')
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0][0]).toEqual({ ...sampleBiospecimen, sampleId: '987', donorId: '12345', organization: 'Johns Hopkins Hospital Lab' })
  })

  it('edits a biospecimen in place and keeps its biospecimenId', async () => {
    const user = userEvent.setup()
    const other = { ...sampleBiospecimen, biospecimenId: 8, donorId: 'DONOR-002' }
    const { container, saved } = renderForm({ biospecimen: other, biospecimens: [sampleBiospecimen, other], id: 1 })
    expect(screen.getByRole('heading', { name: 'Edit Biospecimen from donor DONOR-002' })).toBeInTheDocument()
    expect(field(container, 'donorId')).toHaveValue('DONOR-002')
    expect(container.querySelector('#specimenType')).toHaveTextContent('Blood')
    expect(container.querySelector('#preservationMethod')).toHaveTextContent('Fresh Frozen')

    await user.clear(field(container, 'donorId'))
    await user.type(field(container, 'donorId'), 'DONOR-003')
    await choose(user, container, 'specimenType', 'Serum')
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0][0]).toBe(sampleBiospecimen)
    expect(saved[0][1]).toEqual({ ...other, donorId: 'DONOR-003', specimenType: BioSpecimenType.SERUM })
  })

  it('keeps fields the form does not show', async () => {
    const user = userEvent.setup()
    const loaded = { ...sampleBiospecimen, unknownField: 'kept' } as Biospecimen
    const { container, saved } = renderForm({ biospecimen: loaded })

    await save(user, container)

    expect(saved[0][0]).toEqual(loaded)
  })

  it('does not save after cancel', async () => {
    const user = userEvent.setup()
    const { container, saved, closeAction } = renderForm({ biospecimen: sampleBiospecimen })
    await user.type(field(container, 'donorId'), '-x')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(closeAction).toHaveBeenCalledTimes(1)
    expect(saved).toHaveLength(0)
  })

  it('shows a biospecimen read-only', () => {
    const { container } = renderForm({ biospecimen: sampleBiospecimen, readOnly: true })

    expect(screen.getByRole('heading', { name: 'Biospecimen from donor DONOR-001' })).toBeInTheDocument()
    expect(field(container, 'donorId')).toBeDisabled()
    expect(field(container, 'organization')).toBeDisabled()
    expect(field(container, 'specimenType input')).toBeDisabled()
    expect(field(container, 'preservationMethod input')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).toBeNull()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})

describe('BiospecimenAddEdit collection fields', () => {
  const collected: Biospecimen = {
    ...sampleBiospecimen,
    sampleId: 'VIAL-1',
    preservationDetails: 'Stored at -80C',
    dateOfCollection: '2024-03-05',
    postMortemInterval: { value: 6, unit: PostMortemIntervalUnit.HOURS },
  }

  it('saves the sample id, preservation details, collection date and post-mortem interval', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(field(container, 'sampleId'), ' VIAL-2 ')
    await user.type(field(container, 'preservationDetails'), 'Stored at -80C')
    fireEvent.change(field(container, 'dateOfCollection'), { target: { value: '2024-03-05' } })
    await user.type(field(container, 'postMortemIntervalValue'), '1.5')
    await choose(user, container, 'postMortemIntervalUnit', 'Days')
    await save(user, container)

    expect(saved[0][0]).toMatchObject({
      sampleId: 'VIAL-2',
      preservationDetails: 'Stored at -80C',
      dateOfCollection: '2024-03-05',
      postMortemInterval: { value: 1.5, unit: PostMortemIntervalUnit.DAYS },
    })
  })

  it('leaves out the optional fields that are not set', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await save(user, container)

    for (const key of ['sampleId', 'preservationDetails', 'dateOfCollection', 'postMortemInterval']) {
      expect(saved[0][0]).not.toHaveProperty(key)
    }
  })

  it('loads a saved biospecimen\'s collection fields', () => {
    const { container } = renderForm({ biospecimen: collected })

    expect(field(container, 'sampleId')).toHaveValue('VIAL-1')
    expect(field(container, 'preservationDetails')).toHaveValue('Stored at -80C')
    expect(field(container, 'dateOfCollection')).toHaveValue('2024-03-05')
    expect(field(container, 'postMortemIntervalValue')).toHaveValue('6')
    expect(container.querySelector('#postMortemIntervalUnit')).toHaveTextContent('Hours')
  })

  it('sends a blank sample id to clear a stored sample id of 0', async () => {
    const user = userEvent.setup()
    const zero = { ...collected, sampleId: 0 } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: zero })
    expect(field(container, 'sampleId')).toHaveValue('0')

    await user.clear(field(container, 'sampleId'))
    await save(user, container)

    expect(saved[0][0].sampleId).toBe('')
  })

  it('asks for an interval unit when the stored one is not listed', async () => {
    const user = userEvent.setup()
    const unlisted = { ...collected, postMortemInterval: { value: 12, unit: 'SECONDS' } } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: unlisted })

    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container.querySelector('label.errored[for="postMortemIntervalUnit"]')).toBeInTheDocument()
  })

  it('drops cleared fields and sends a blank sample id to clear a saved one', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ biospecimen: collected })
    for (const id of ['sampleId', 'preservationDetails', 'postMortemIntervalValue']) {
      await user.clear(field(container, id))
    }
    await user.click(field(container, 'postMortemIntervalUnit input'))
    await user.keyboard('{Backspace}')
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0][0].sampleId).toBe('')
    expect(saved[0][0]).not.toHaveProperty('preservationDetails')
    expect(saved[0][0]).not.toHaveProperty('postMortemInterval')
    expect(saved[0][0].biospecimenId).toBe(collected.biospecimenId)
  })

  it.each([
    ['-1', 'Hours', 'Please enter a number of 0 or more'],
    ['soon', 'Hours', 'Please enter a number of 0 or more'],
    ['', 'Hours', 'Please enter the interval for the selected unit'],
  ])('does not save a post-mortem interval of "%s" %s', async (value, unit, message) => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    if (value) await user.type(field(container, 'postMortemIntervalValue'), value)
    await choose(user, container, 'postMortemIntervalUnit', unit)
    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container).toHaveTextContent(message)
  })

  it('needs a unit for a post-mortem interval', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(field(container, 'postMortemIntervalValue'), '4')
    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container.querySelector('label[for="postMortemIntervalUnit"]')).toHaveClass('errored')
  })

  it.each(['March 2024', ' March 2024 '])('keeps a stored collection date of "%s" in another format', async (stored) => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ biospecimen: { ...collected, dateOfCollection: stored } })
    await save(user, container)

    expect(saved[0][0].dateOfCollection).toBe('March 2024')
  })
})

describe('BiospecimenAddEdit donor fields', () => {
  const donor: Biospecimen = {
    ...sampleBiospecimen,
    sex: Sex.FEMALE,
    age: 54,
    race: 'Asian',
    countryOfOrigin: 'Canada',
    extractedDiagnoses: ['Alzheimer\'s disease'],
    pathology: 'Braak stage IV',
    sourceSite: 'Toronto General',
    optionalDataUse: 'No commercial use',
  }

  it('saves the donor and origin fields', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await choose(user, container, 'sex', 'Not Reported')
    await user.type(field(container, 'age'), '0')
    await user.type(field(container, 'race'), 'White')
    await choose(user, container, 'countryOfOrigin', 'United States')
    await choose(user, container, 'extractedDiagnoses', 'Parkinson\'s disease')
    await user.type(field(container, 'pathology'), 'Lewy bodies')
    await user.type(field(container, 'sourceSite'), 'MGH')
    await user.type(field(container, 'optionalDataUse'), 'Academic use only')
    await save(user, container)

    expect(saved[0][0]).toMatchObject({
      sex: Sex.NOT_REPORTED,
      age: 0,
      race: 'White',
      countryOfOrigin: 'United States of America (the)',
      extractedDiagnoses: ['Parkinson\'s disease'],
      pathology: 'Lewy bodies',
      sourceSite: 'MGH',
      optionalDataUse: 'Academic use only',
    })
  })

  it('loads a saved biospecimen\'s donor fields', () => {
    const { container } = renderForm({ biospecimen: donor })

    expect(container.querySelector('#sex')).toHaveTextContent('Female')
    expect(field(container, 'age')).toHaveValue('54')
    expect(field(container, 'race')).toHaveValue('Asian')
    expect(container.querySelector('#countryOfOrigin')).toHaveTextContent('Canada')
    expect(container.querySelector('#extractedDiagnoses')).toHaveTextContent('Alzheimer\'s disease')
    expect(field(container, 'pathology')).toHaveValue('Braak stage IV')
    expect(field(container, 'sourceSite')).toHaveValue('Toronto General')
    expect(field(container, 'optionalDataUse')).toHaveValue('No commercial use')
  })

  it('does not save a diagnosis twice', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ biospecimen: { ...donor, extractedDiagnoses: ['Flu'] } })

    await choose(user, container, 'extractedDiagnoses', 'Flu ')
    await save(user, container)

    expect(saved[0][0].extractedDiagnoses).toEqual(['Flu'])
  })

  it('adds to diagnoses stored as numbers', async () => {
    const user = userEvent.setup()
    const stored = { ...donor, extractedDiagnoses: [42, 'Flu'] } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: stored })
    expect(container.querySelector('#extractedDiagnoses')).toHaveTextContent('42')

    await choose(user, container, 'extractedDiagnoses', 'Asthma')
    await save(user, container)

    expect(saved[0][0].extractedDiagnoses).toEqual(['42', 'Flu', 'Asthma'])
  })

  it('loads a single diagnosis stored as text', async () => {
    const user = userEvent.setup()
    const stored = { ...donor, extractedDiagnoses: 'Cancer' } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: stored })
    expect(container.querySelector('#extractedDiagnoses')).toHaveTextContent('Cancer')

    await save(user, container)

    expect(saved[0][0].extractedDiagnoses).toEqual(['Cancer'])
  })

  it('drops a stored sex that is not listed', async () => {
    const user = userEvent.setup()
    const unlisted = { ...donor, sex: 'F' } as unknown as Biospecimen
    const { container, saved } = renderForm({ biospecimen: unlisted })
    expect(container.querySelector('#sex')).not.toHaveTextContent('F')

    await save(user, container)

    expect(saved[0][0]).not.toHaveProperty('sex')
  })

  it('drops the donor fields that are cleared', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({ biospecimen: donor })
    for (const id of ['age', 'race', 'pathology', 'sourceSite', 'optionalDataUse']) {
      await user.clear(field(container, id))
    }
    for (const id of ['sex', 'countryOfOrigin', 'extractedDiagnoses']) {
      await user.click(field(container, `${id} input`))
      await user.keyboard('{Backspace}')
    }
    await save(user, container)

    expect(saved[0][0]).toStrictEqual(sampleBiospecimen)
  })

  it.each(['-3', 'old'])('does not save an age of "%s"', async (age) => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(field(container, 'age'), age)
    await save(user, container)

    expect(saved).toHaveLength(0)
    expect(container).toHaveTextContent('Please enter an age of 0 or more')
  })
})
