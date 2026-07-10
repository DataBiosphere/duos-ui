import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('BiospecimenSummary', () => {
  it('renders biospecimen details', async () => {
    render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['donorId', 'specimenType', 'preservationMethod', 'organization']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleBiospecimen.donorId)).toBeInTheDocument()
    expect(screen.getByText(sampleBiospecimen.specimenType)).toBeInTheDocument()
    expect(screen.getByText(sampleBiospecimen.preservationMethod)).toBeInTheDocument()
    expect(screen.getByText(sampleBiospecimen.organization)).toBeInTheDocument()
  })

  it('renders only specified columns', async () => {
    render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType', 'donorId']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleBiospecimen.specimenType)).toBeInTheDocument()
    expect(screen.getByText(sampleBiospecimen.donorId)).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={viewFn}
        disabled={false}
      />,
    )
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit button and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType']}
        editAction={editFn}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('.glyphicon-pencil')).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })
})
