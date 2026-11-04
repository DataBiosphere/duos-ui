import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataUseTermsFields, { DataUseTerms, dataUseTermsErrors } from 'src/components/forms/DataUseTermsFields'
import { findOntologyTerms } from 'src/libs/utils'

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

/** Holds the terms the way a form does, merging each change into its state. */
function Harness({ initial = {}, onTerms }: {
  initial?: DataUseTerms
  onTerms?: (terms: DataUseTerms) => void
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
    />
  )
}

describe('DataUseTermsFields', () => {
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

  it('ignores a disease lookup that finishes after the terms were cleared', async () => {
    const user = userEvent.setup()
    let resolveLookup: (found: { displayText: string, id: string }[]) => void = () => {}
    vi.mocked(findOntologyTerms).mockReturnValueOnce(new Promise((resolve) => {
      resolveLookup = resolve
    }))
    const onTerms = vi.fn()
    const { container } = render(
      <Harness initial={{ accessManagement: 'controlled', diseaseSpecificUse: ['DOID_1'] }} onTerms={onTerms} />,
    )

    await user.click(container.querySelector('#accessManagement_open')!)
    await act(async () => resolveLookup([{ displayText: 'Cancer', id: 'DOID_1' }]))
    await user.click(container.querySelector('#accessManagement_controlled')!)
    await user.click(container.querySelector('#primaryConsent_diseaseSpecificUse')!)

    expect(onTerms).toHaveBeenLastCalledWith(expect.objectContaining({ diseaseSpecificUse: [] }))
  })
})
