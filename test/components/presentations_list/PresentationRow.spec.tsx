import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PresentationRow from 'src/components/presentations_list/PresentationRow'
import { Presentation } from 'src/types/model'

const samplePresentation: Presentation = {
  presentationId: 'p1',
  studyId: 's1',
  title: 'Sample Talk',
  date: '2024-06-01',
  url: 'https://example.org/presentation',
  authors: 'Author A; Author B',
  datasetCitation: 'Dataset X',
  citation: true,
  presenter: { name: 'Dr. Presenter', email: 'presenter@example.org' },
  event: 'Conference 2024',
  location: 'City',
  format: 'Oral',
  access: 'Open',
  tags: ['tagA', 'tagB'],
}

describe('PresentationRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <PresentationRow
        id={0}
        editMode={false}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title', 'event']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onPresentationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(samplePresentation.title)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <PresentationRow
        id={0}
        editMode={true}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onPresentationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(samplePresentation.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <PresentationRow
        id={0}
        editMode={false}
        viewMode={true}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onPresentationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(samplePresentation.title)
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <PresentationRow
        id={0}
        editMode={false}
        viewMode={false}
        presentation={samplePresentation}
        presentations={[samplePresentation]}
        columnsToShow={['title', 'event']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onPresentationChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
