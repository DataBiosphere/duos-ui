import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PrincipalInvestigators } from 'src/pages/data_submission/v2/PrincipalInvestigators'
import { StudyPopulation } from 'src/pages/data_submission/v2/StudyPopulation'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { getPrincipalInvestigators, getStudyDataBag, getStudyPropertyValueByKey } from 'src/pages/data_submission/v2/v2-common-functions'
import { ThroughBioProfile } from 'src/pages/data_submission/v2/ThroughBioProfile'
import { DataCustodians } from 'src/pages/data_submission/v2/DataCustodians'
import { StudyReleaseSettings } from 'src/pages/data_submission/v2/StudyReleaseSettings'
import { AgeRangeSlider } from 'src/pages/data_submission/v2/AgeRangeSlider'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'

const initialStudy = (): Study => ({ piName: 'Ada Lovelace', piEmail: 'ada@example.org', data: {} })

/** Holds the study in state so the component sees its own updates, as it does in the form. */
const Harness = ({ onStudy, children }: { onStudy: (study: Study) => void, children: (props: { study: Study, setStudy: React.Dispatch<React.SetStateAction<Study>> }) => React.ReactNode }) => {
  const [study, setStudy] = useState<Study>(initialStudy)
  onStudy(study)
  return <>{children({ study, setStudy })}</>
}

describe('PrincipalInvestigators', () => {
  it('adds a PI as a new row and keeps piName on the first', () => {
    let latest = initialStudy()
    const capture = (study: Study) => {
      latest = study
    }
    render(<Harness onStudy={capture}>{props => <PrincipalInvestigators {...props} />}</Harness>)

    expect(screen.queryByLabelText('Remove PI 1')).toBeNull()
    fireEvent.click(document.getElementById('add-pi-btn')!)
    fireEvent.change(document.getElementById('pi-1-firstName')!, { target: { value: 'Alan' } })
    fireEvent.change(document.getElementById('pi-1-lastName')!, { target: { value: 'Turing' } })

    expect(getPrincipalInvestigators(latest).map(pi => pi.firstName)).toEqual(['Ada', 'Alan'])
    expect(latest.piName).toBe('Ada Lovelace')
    expect(document.querySelector('[data-cy="pi-row-1"]')).toBeInTheDocument()
  })

  it('titles the columns once, while each row keeps labels for assistive tech', () => {
    render(<Harness onStudy={() => {}}>{props => <PrincipalInvestigators {...props} />}</Harness>)
    fireEvent.click(document.getElementById('add-pi-btn')!)

    const headers = document.querySelectorAll('[data-cy="principal-investigators"] .dsf-person-header')
    expect(headers).toHaveLength(1)
    expect(headers[0]).toHaveAttribute('aria-hidden', 'true')
    expect(Array.from(headers[0].querySelectorAll('.control-label')).map(el => el.textContent))
      .toEqual(['First Name*', 'Last Name*', 'Email Address', 'ORCID iD'])
    expect(screen.getAllByLabelText(/^First Name/)).toHaveLength(2)
    expect(screen.getAllByLabelText(/^Email Address/)).toHaveLength(2)
  })

  it('removing the first PI makes the next one primary', () => {
    let latest = initialStudy()
    const capture = (study: Study) => {
      latest = study
    }
    render(<Harness onStudy={capture}>{props => <PrincipalInvestigators {...props} />}</Harness>)
    fireEvent.click(document.getElementById('add-pi-btn')!)
    fireEvent.change(document.getElementById('pi-1-firstName')!, { target: { value: 'Alan' } })
    fireEvent.change(document.getElementById('pi-1-lastName')!, { target: { value: 'Turing' } })
    fireEvent.click(screen.getByLabelText('Remove PI 1'))

    expect(latest.piName).toBe('Alan Turing')
    expect(latest.piEmail).toBeUndefined()
    expect((document.getElementById('pi-0-firstName') as HTMLInputElement).value).toBe('Alan')
  })
})

describe('DataCustodians', () => {
  it('lays custodians out like the PIs: column titles once, then First Name, Last Name and Email per row', () => {
    render(<Harness onStudy={() => {}}>{props => <DataCustodians {...props} />}</Harness>)
    fireEvent.click(screen.getByRole('button', { name: 'Add Data Custodian' }))

    const section = document.querySelector('[data-cy="data-custodians"]')!
    const headers = section.querySelectorAll('.dsf-person-header')
    expect(headers).toHaveLength(1)
    expect(Array.from(headers[0].querySelectorAll('.control-label')).map(el => el.textContent))
      .toEqual(['First Name', 'Last Name', 'Email Address'])
    expect(screen.getAllByLabelText(/^Email Address/)).toHaveLength(2)
    expect(section.querySelector('[id*="orcid"]')).toBeNull()
  })

  it('removes a custodian row', () => {
    let latest = initialStudy()
    const capture = (study: Study) => {
      latest = study
    }
    render(<Harness onStudy={capture}>{props => <DataCustodians {...props} />}</Harness>)
    fireEvent.change(document.getElementById('custodian-0-email')!, { target: { value: 'first@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Data Custodian' }))
    fireEvent.change(document.getElementById('custodian-1-email')!, { target: { value: 'second@example.org' } })
    fireEvent.click(screen.getByLabelText('Remove Data Custodian 1'))
    expect(getStudyDataBag(latest).dataCustodians).toEqual([{ email: 'second@example.org' }])
  })
})

describe('StudyPopulation', () => {
  it('puts the inheritance checkbox directly under the Population heading', () => {
    render(<StudyPopulation study={initialStudy()} setStudy={vi.fn()} />)
    const section = document.querySelector('[data-cy="study-population"]')!
    const heading = section.querySelector('h3')!
    expect(heading.nextElementSibling).toHaveClass('dsf-section-toggle')
    expect(heading.nextElementSibling).toHaveTextContent('My population is the same across all assets in this Study.')
    expect(heading.nextElementSibling).toHaveClass('dsf-section-toggle--subtle')
  })
})

describe('ThroughBioProfile', () => {
  it('is titled Link to Through.bio Profile, with help text directly under the title', () => {
    render(<ThroughBioProfile study={initialStudy()} setStudy={vi.fn()} onRequestProfile={vi.fn()} />)
    const title = screen.getByRole('heading', { level: 3, name: 'Link to Through.bio Profile' })
    const help = title.nextElementSibling!
    expect(help).toHaveTextContent('represents the Study as a whole, not its individual datasets or other assets')
    expect(help).toHaveTextContent('the part of the profile\'s address after through.bio/')
  })

  it('shows the through.bio/ slug inline, inside the field', () => {
    render(<ThroughBioProfile study={initialStudy()} setStudy={vi.fn()} />)
    const input = screen.getByLabelText('Profile ID')
    const prefix = input.previousElementSibling!
    expect(prefix).toHaveTextContent('through.bio/')
    expect(prefix.parentElement).toHaveClass('dsf-prefixed-input')
  })

  it('stores just the ID from a pasted link, and clears it when the field is emptied', () => {
    let latest = initialStudy()
    const capture = (study: Study) => {
      latest = study
    }
    render(<Harness onStudy={capture}>{props => <ThroughBioProfile {...props} />}</Harness>)
    const input = screen.getByLabelText('Profile ID') as HTMLInputElement
    for (const pasted of ['https://through.bio/my-study', 'through.bio/my-study', 'my-study']) {
      fireEvent.change(input, { target: { value: pasted } })
      expect(getStudyPropertyValueByKey(latest, 'throughBioId')).toBe('my-study')
    }
    fireEvent.change(input, { target: { value: 'https://through.bio/my-study' } })
    fireEvent.blur(input)
    expect(input.value).toBe('my-study')
    expect(screen.getByRole('link', { name: 'View through.bio/my-study' })).toHaveAttribute('href', 'https://through.bio/my-study')

    fireEvent.change(input, { target: { value: '' } })
    expect(getStudyPropertyValueByKey(latest, 'throughBioId')).toBeFalsy()
  })

  it('rejects a link to another site', () => {
    render(<ThroughBioProfile study={initialStudy()} setStudy={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Profile ID'), { target: { value: 'https://example.org/my-study' } })
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a Through.bio profile ID')
    expect(screen.getByLabelText('Profile ID')).toHaveAttribute('aria-invalid', 'true')
  })

  it('offers a request only when no profile is linked', () => {
    const linked: Study = { ...initialStudy(), properties: [{ key: 'throughBioId', type: 'String', value: 'my-study' }] as Study['properties'] }
    const { rerender } = render(<ThroughBioProfile study={linked} setStudy={vi.fn()} onRequestProfile={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Request a Through.bio Profile' })).toBeNull()
    rerender(<ThroughBioProfile study={initialStudy()} setStudy={vi.fn()} onRequestProfile={vi.fn()} />)
    const request = screen.getByRole('button', { name: 'Request a Through.bio Profile' })
    expect(request).toHaveClass('dsf-text-link')
    expect(request).not.toHaveClass('button')
    expect(request.parentElement).toHaveTextContent('Don\'t have a Through.bio profile yet? Request a Through.bio Profile')
  })

  it('warns that publications are required before the request is made', () => {
    const onRequestProfile = vi.fn()
    render(<ThroughBioProfile study={initialStudy()} setStudy={vi.fn()} onRequestProfile={onRequestProfile} />)
    fireEvent.click(screen.getByRole('button', { name: 'Request a Through.bio Profile' }))
    expect(screen.getByRole('note')).toHaveTextContent('Publications are required to create a Through.bio profile.')
    expect(onRequestProfile).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to request' }))
    expect(onRequestProfile).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('note')).toBeNull()
  })
})

describe('StudyReleaseSettings', () => {
  it('puts target dates and visibility in separate boxes, each with a quiet apply-to-all checkbox after its fields', () => {
    render(<StudyReleaseSettings study={initialStudy()} setStudy={vi.fn()} />)
    const dates = document.querySelector('[data-cy="study-release-dates"]')!
    const visibility = document.querySelector('[data-cy="study-visibility"]')!
    expect(dates).toHaveClass('dsf-group')
    expect(visibility).toHaveClass('dsf-group')
    expect(dates.contains(visibility)).toBe(false)
    for (const box of [dates, visibility]) {
      const toggle = box.querySelector('.dsf-section-toggle')!
      expect(toggle).toHaveClass('dsf-section-toggle--subtle')
      expect(box.lastElementChild).toBe(toggle)
    }
  })

  it('explains each target date and what Public Visibility controls', () => {
    render(<StudyReleaseSettings study={initialStudy()} setStudy={vi.fn()} />)
    expect(document.querySelector('.formField-alternativeDataSharingPlanTargetDeliveryDate'))
      .toHaveTextContent('The date you expect the data to be submitted and in place at its data location')
    expect(document.querySelector('.formField-alternativeDataSharingPlanTargetPublicReleaseDate'))
      .toHaveTextContent('The date you expect researchers to be able to request access to the data')
    expect(document.querySelector('.formField-publicVisibility'))
      .toHaveTextContent('searchable and visible in DUOS data libraries')
  })

  it('offers an apply-to-all checkbox beside each of target dates and visibility', () => {
    render(<StudyReleaseSettings study={initialStudy()} setStudy={vi.fn()} />)
    expect(screen.getAllByText('Apply to all assets in this Study')).toHaveLength(2)
    expect(document.getElementById('alternativeDataSharingPlanTargetDeliveryDate')).toBeTruthy()
    expect(document.querySelector('.formField-publicVisibility')).toBeInTheDocument()
  })

  it('hides the study-level fields once they are set per dataset', () => {
    let latest = initialStudy()
    const capture = (study: Study) => {
      latest = study
    }
    render(<Harness onStudy={capture}>{props => <StudyReleaseSettings {...props} />}</Harness>)
    fireEvent.click(document.getElementById('targetDatesSameAcrossAssets')!)
    fireEvent.click(document.getElementById('publicVisibilitySameAcrossAssets')!)
    expect(getStudyDataBag(latest)).toMatchObject({ targetDatesSameAcrossAssets: false, publicVisibilitySameAcrossAssets: false })
    expect(document.querySelector('.formField-publicVisibility')).toBeNull()
    expect(document.querySelector('.formField-alternativeDataSharingPlanTargetDeliveryDate')).toBeNull()
  })
})

describe('AgeRangeSlider', () => {
  it('reads Not set until moved, then reports the range', () => {
    const onChange = vi.fn()
    const { rerender } = render(<AgeRangeSlider id="age" title="Age Range" value={undefined} onChange={onChange} />)
    expect(screen.getByText('Not set')).toBeInTheDocument()
    const [minThumb] = screen.getAllByRole('slider')
    fireEvent.change(minThumb, { target: { value: 18 } })
    expect(onChange).toHaveBeenCalledWith({ min: 18, max: 90 })

    rerender(<AgeRangeSlider id="age" title="Age Range" value={{ min: 18, max: 90 }} onChange={onChange} />)
    expect(screen.getByText('18 and over')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
})

describe('Add PI button', () => {
  it('uses the in-form add-row style rather than the page-level add button', () => {
    render(<PrincipalInvestigators study={initialStudy()} setStudy={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Add PI' })
    expect(button).toHaveClass('add-row-button')
    expect(button).not.toHaveClass('button-white')
    expect(button.getAttribute('style')).toBeNull()
  })
})

describe('GeneralStudyInformation layout', () => {
  it('calls the DOI field Study DOI', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    expect(document.querySelector('.formField-doi')).toHaveTextContent('Study DOI')
  })

  it('tells users how to add a tag', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    expect(document.querySelector('.formField-tags')).toHaveTextContent('Type a tag, then press Enter or Tab to add it.')
  })

  it('places Data Types directly below Data Collection Modality', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    const order = Array.from(document.querySelectorAll('.formField-container'))
      .map(el => Array.from(el.classList).find(c => c.startsWith('formField-') && c !== 'formField-container'))
    expect(order[order.indexOf('formField-dataCollectionModality') + 1]).toBe('formField-dataTypes')
  })

  it('frames every field in a box', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    const unboxed = Array.from(document.querySelectorAll('.formField-container'))
      .filter(field => !field.closest('.dsf-group'))
      .map(field => field.className)
    expect(unboxed).toEqual([])
  })
})

describe('GeneralStudyInformation data types', () => {
  it('offers Blended Genome Exome (BGE)', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Blended Genome Exome (BGE)' })).toBeInTheDocument()
  })
})

describe('GeneralStudyInformation data collection fields', () => {
  it('places Data Collection Method and then Modality directly below Study Type', () => {
    render(<GeneralStudyInformation study={initialStudy()} setStudy={vi.fn()} />)
    const order = Array.from(document.querySelectorAll('.formField-container'))
      .map(el => Array.from(el.classList).find(c => c.startsWith('formField-') && c !== 'formField-container'))
    const studyType = order.indexOf('formField-studyType')
    expect(order.slice(studyType, studyType + 3)).toEqual([
      'formField-studyType', 'formField-dataCollectionMethod', 'formField-dataCollectionModality',
    ])
  })
})
