import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PresentationSummary from 'src/components/presentations_list/PresentationSummary'
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

describe('PresentationSummary', () => {
  it('renders columns including presenter composite', () => {
    const { container } = render(
      <PresentationSummary
        presentation={samplePresentation}
        columnsToShow={['title', 'event', 'presenter', 'url', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(samplePresentation.title)).toBeInTheDocument()
    expect(container.querySelector(`a[href="${samplePresentation.url}"]`)).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <PresentationSummary
        presentation={samplePresentation}
        columnsToShow={['title']}
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
