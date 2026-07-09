import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PublicationSummary from 'src/components/publications_list/PublicationSummary'
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

describe('PublicationSummary', () => {
  it('renders columns including authors list', () => {
    const { container } = render(
      <PublicationSummary
        publication={samplePublication}
        columnsToShow={['title', 'journal', 'authors', 'url', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(samplePublication.title)).toBeInTheDocument()
    expect(screen.getByText(samplePublication.journal)).toBeInTheDocument()
    expect(container.textContent).toContain(samplePublication.authors[0].name)
    expect(container.querySelector(`a[href="${samplePublication.url}"]`)).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <PublicationSummary
        publication={samplePublication}
        columnsToShow={['title', 'publishedDate']}
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
})
