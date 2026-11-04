import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataUseTermsFields, {
  DataUseTerms,
  applyTerms,
  dataUseFromTerms,
  dataUseTermsErrors,
  termsFromDataUse,
} from 'src/components/forms/DataUseTermsFields'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    findOntologyTerms: vi.fn().mockResolvedValue([]),
    searchOntologyTerm: vi.fn().mockResolvedValue([]),
  }
})

describe('dataUseTermsErrors', () => {
  it('requires an access management and, unless access is open, a primary term', () => {
    expect(Object.keys(dataUseTermsErrors({}))).toEqual(['accessManagement', 'primaryConsent'])
    expect(dataUseTermsErrors({ accessManagement: 'open' })).toEqual({})
    expect(dataUseTermsErrors({ accessManagement: 'controlled', hmb: true })).toEqual({})
  })

  it.each<[string, DataUseTerms, string]>([
    ['a disease-specific primary with no disease', { diseaseSpecificUse: [] }, 'diseaseSpecificUse'],
    ['an Other primary with no text', { otherPrimary: ' ' }, 'otherPrimary'],
    ['a checked geographic restriction with no text', { hmb: true, gs: '' }, 'gs'],
    ['a moratorium with no date', { hmb: true, mor: true }, 'mor'],
    ['a checked secondary Other with no text', { hmb: true, otherSecondary: '' }, 'otherSecondary'],
  ])('flags %s', (_label, terms, field) => {
    expect(Object.keys(dataUseTermsErrors({ accessManagement: 'controlled', ...terms }))).toEqual([field])
  })
})

describe('dataUseTermsErrors when the terms are optional', () => {
  it('needs neither an access management nor any term', () => {
    expect(dataUseTermsErrors({}, false)).toEqual({})
    expect(dataUseTermsErrors({ accessManagement: 'controlled' }, false)).toEqual({})
  })

  it('needs a primary term once a secondary term is set, unless access is open', () => {
    expect(Object.keys(dataUseTermsErrors({ npu: true }, false))).toEqual(['primaryConsent'])
    expect(Object.keys(dataUseTermsErrors({ accessManagement: 'external', npu: true }, false))).toEqual(['primaryConsent'])
    expect(dataUseTermsErrors({ accessManagement: 'external', hmb: true, npu: true }, false)).toEqual({})
  })

  it('needs a primary term when the data use sent keeps other fields', () => {
    expect(Object.keys(dataUseTermsErrors({ accessManagement: 'controlled' }, false, true))).toEqual(['primaryConsent'])
    expect(dataUseTermsErrors({ accessManagement: 'open' }, false, true)).toEqual({})
  })
})

describe('dataUseFromTerms and termsFromDataUse', () => {
  it('writes only the terms that are set', () => {
    expect(dataUseFromTerms({
      accessManagement: 'controlled', generalResearchUse: false, hmb: true, nmds: true, npu: true, gso: false, gs: ' ', mor: true,
    })).toEqual({ hmbResearch: true, methodsResearch: false, nonProfitUse: true })
  })

  it('writes nothing for terms that set nothing', () => {
    expect(dataUseFromTerms({ accessManagement: 'open', generalResearchUse: false, diseaseSpecificUse: [] })).toBeUndefined()
  })

  it('reads back what it writes', () => {
    const dataUse = {
      diseaseRestrictions: ['DOID_1'], methodsResearch: false, geographicalRestrictions: 'USA',
      publicationMoratorium: '2027-01-01', secondaryOther: 'No resale', publicationResults: true,
    }
    expect(dataUseFromTerms(termsFromDataUse(dataUse))).toEqual(dataUse)
  })

  it('reads a moratorium as checked with its date', () => {
    expect(termsFromDataUse({ hmbResearch: true, publicationMoratorium: '2027-01-01' }))
      .toMatchObject({ hmb: true, mor: true, morDate: '2027-01-01' })
  })
})

describe('applyTerms', () => {
  it('replaces the fields the editor sets and keeps any other', () => {
    expect(applyTerms({ generalUse: true, aiLlmUse: true }, { hmb: true })).toEqual({ aiLlmUse: true, hmbResearch: true })
  })

  it('leaves a data use the terms describe exactly as stored', () => {
    const stored = { generalUse: true, methodsResearch: true, nonProfitUse: false }
    expect(applyTerms(stored, termsFromDataUse(stored))).toEqual(stored)
  })

  it('keeps stored values the editor cannot show when another term changes', () => {
    const stored = { generalUse: true, methodsResearch: true, nonProfitUse: false }
    expect(applyTerms(stored, { ...termsFromDataUse(stored), gso: true }))
      .toEqual({ generalUse: true, methodsResearch: true, nonProfitUse: false, geneticStudiesOnly: true })
  })

  it('replaces a stored value the editor cannot show once its term is set', () => {
    expect(applyTerms({ hmbResearch: true, methodsResearch: true, nonProfitUse: false }, { hmb: true, nmds: true, npu: true }))
      .toEqual({ hmbResearch: true, methodsResearch: false, nonProfitUse: true })
  })

  it('leaves no data use when the terms clear the only fields it had', () => {
    expect(applyTerms({ generalUse: true, nonProfitUse: true }, { accessManagement: 'open' })).toBeUndefined()
  })
})

/** Holds the terms the way a form does, merging each change into its state. */
function Harness({ initial = {}, onTerms, ...rest }: {
  initial?: DataUseTerms
  onTerms?: (terms: DataUseTerms) => void
  required?: boolean
  subject?: string
}) {
  const [terms, setTerms] = useState<DataUseTerms>(initial)
  return (
    <DataUseTermsFields
      terms={terms}
      onChange={(changed) => {
        const next = { ...terms, ...changed }
        setTerms(next)
        onTerms?.(next)
      }}
      validation={{}}
      {...rest}
    />
  )
}

describe('DataUseTermsFields', () => {
  it('marks the terms required and names a dataset by default', () => {
    const { container } = render(<Harness />)
    expect(container).toHaveTextContent('Data Access Management*')
    expect(container).toHaveTextContent('Primary Data Use Terms*')
    expect(container).toHaveTextContent('data use permissions for your dataset')
  })

  it('drops the required marker and names its subject when told to', () => {
    const { container } = render(<Harness required={false} subject="model" />)
    expect(container).not.toHaveTextContent('Data Access Management*')
    expect(container).not.toHaveTextContent('Primary Data Use Terms*')
    expect(container).toHaveTextContent('data use permissions for your model')
  })

  it('clears access management and every term when the terms are optional', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(
      <Harness initial={{ accessManagement: 'controlled', hmb: true, npu: true }} onTerms={onTerms} required={false} />,
    )

    await user.click(container.querySelector('#clearDataUseTerms')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ accessManagement: undefined, hmb: false, npu: false }))
    expect(container.querySelector<HTMLInputElement>('#accessManagement_controlled')!.checked).toBe(false)
    expect(container.querySelector<HTMLInputElement>('#primaryConsent_hmb')!.checked).toBe(false)
  })

  it('offers no clear control when the terms are required', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('#clearDataUseTerms')).not.toBeInTheDocument()
  })

  it('keeps one primary term at a time', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(<Harness onTerms={onTerms} />)

    await user.click(container.querySelector('#primaryConsent_hmb')!)
    await user.click(container.querySelector('#primaryConsent_poa')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ hmb: false, poa: true, generalResearchUse: false }))
  })

  it('keeps a legacy record\'s Other text when Other is selected over another primary', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(
      <Harness initial={{ accessManagement: 'controlled', hmb: true, otherPrimary: 'Bespoke' }} onTerms={onTerms} />,
    )

    await user.click(container.querySelector('#primaryConsent_otherPrimary')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ hmb: false, otherPrimary: 'Bespoke' }))
  })

  it('holds a checked text option as an empty string until its text is entered', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(<Harness initial={{ accessManagement: 'controlled' }} onTerms={onTerms} />)

    await user.click(container.querySelector('#gs')!)
    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ gs: '' }))

    await user.type(container.querySelector('#gsText')!, 'USA')
    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ gs: 'USA' }))

    await user.click(container.querySelector('#gs')!)
    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ gs: undefined }))
    expect(container.querySelector('#gsText')).not.toBeInTheDocument()
  })

  it('drops the moratorium date when the moratorium is unchecked', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(
      <Harness initial={{ accessManagement: 'controlled', mor: true, morDate: '2027-01-01' }} onTerms={onTerms} />,
    )

    await user.click(container.querySelector('#mor')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ mor: false, morDate: undefined }))
  })

  it('clears every term when access becomes open', async () => {
    const user = userEvent.setup()
    const onTerms = vi.fn()
    const { container } = render(
      <Harness initial={{ accessManagement: 'controlled', hmb: true, gs: 'USA', npu: true }} onTerms={onTerms} />,
    )

    await user.click(container.querySelector('#accessManagement_open')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ accessManagement: 'open', hmb: false, gs: undefined, npu: false }))
    expect(container.querySelector('#primaryConsent_hmb')).not.toBeInTheDocument()
  })
})
