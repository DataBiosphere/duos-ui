import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import BiospecimenRow from 'src/components/biospecimen_list/BiospecimenRow'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 'SPEC-001',
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}

describe('BiospecimenRow', () => {
  it('shows summary when not in edit mode', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <BiospecimenRow
        id={0}
        editMode={false}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['donorId', 'specimenType']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onBiospecimensChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleBiospecimen.specimenType)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('does not render edit form when editMode true (redirects)', async () => {
    const { container } = render(
      <MemoryRouter>
        <BiospecimenRow
          id={0}
          editMode={true}
          biospecimen={sampleBiospecimen}
          biospecimens={[sampleBiospecimen]}
          columnsToShow={['specimenType']}
          editAction={vi.fn()}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          onBiospecimensChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="biospecimen-add-edit"]')).not.toBeInTheDocument()
  })

  it('does not render view form when viewMode true (redirects)', async () => {
    const { container } = render(
      <MemoryRouter>
        <BiospecimenRow
          id={0}
          editMode={false}
          viewMode={true}
          biospecimen={sampleBiospecimen}
          biospecimens={[sampleBiospecimen]}
          columnsToShow={['specimenType']}
          editAction={vi.fn()}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          viewAction={vi.fn()}
          onBiospecimensChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="biospecimen-add-edit"]')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <BiospecimenRow
        id={0}
        editMode={false}
        viewMode={false}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['donorId', 'specimenType']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onBiospecimensChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
