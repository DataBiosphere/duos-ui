import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, onChange, defaultValue, disabled }: {
    id?: string
    onChange: (value: string | undefined) => void
    defaultValue?: string | null
    disabled?: boolean
  }) => (
    <input
      id={id}
      type="text"
      defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}))

import PublicationRow from 'src/components/publications_list/PublicationRow'
import { Publication, Author } from 'src/types/model'

const authorsSample: Author[] = [
  { name: 'Author One', orcId: '0000-0000-0000-0001' },
  { name: 'Author Two', orcId: '0000-0000-0000-0002' },
]

const samplePublication: Publication = {
  title: 'Sample Publication',
  pubmedId: '123456',
  publishedDate: '2024-06-01',
  authors: authorsSample,
  bibliographicCitation: 'Sample Citation',
  datasetCitation: 'Sample Dataset Citation',
  citation: true,
  publicationId: 'pub-1',
  studyId: 'study-1',
  journal: 'Journal Name',
  doi: '10.1000/sample.doi',
  url: 'https://example.org/pub',
  access: 'Open',
  tags: ['tag1', 'tag2'],
}

describe('PublicationRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <PublicationRow
        id={0}
        editMode={false}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title', 'journal']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onPublicationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(samplePublication.title)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <PublicationRow
        id={0}
        editMode={true}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onPublicationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(samplePublication.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <PublicationRow
        id={0}
        editMode={false}
        viewMode={true}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onPublicationChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(samplePublication.title)
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <PublicationRow
        id={0}
        editMode={false}
        viewMode={false}
        publication={samplePublication}
        publications={[samplePublication]}
        columnsToShow={['title', 'journal']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onPublicationChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
