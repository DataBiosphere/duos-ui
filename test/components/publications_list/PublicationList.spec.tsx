import React from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import PublicationList from 'src/components/publications_list/PublicationList'
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

const PublicationListHarness: React.FC<{ initial: Publication[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Publication[]>(initial)
  return (
    <PublicationList
      publications={items}
      columnsToShow={['title', 'publishedDate', 'journal', 'url', 'access']}
      onPublicationChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

describe('PublicationList component', () => {
  it('renders existing publications', () => {
    render(<PublicationListHarness initial={[samplePublication]} />)
    expect(screen.getByText(samplePublication.title)).toBeInTheDocument()
    expect(screen.getByText(samplePublication.journal)).toBeInTheDocument()
  })

  it('opens publication in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<PublicationListHarness initial={[samplePublication]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(samplePublication.title)).toBeInTheDocument()
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('#publishedDate')).toBeDisabled()
    expect(container.querySelector('#publishedDate')).toHaveValue(samplePublication.publishedDate)
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(container.querySelector('.collaborator-form-cancel-button')).toHaveTextContent('Close')
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<PublicationListHarness initial={[samplePublication]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#title')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })
})

describe('Publication delete flow', () => {
  it('deletes a publication via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<PublicationListHarness initial={[samplePublication]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(samplePublication.title)).not.toBeInTheDocument())
    expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })
})
