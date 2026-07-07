import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

// react-modal requires an app element; stub ModalWrapper to avoid modal portal issues
vi.mock('src/components/collaborator_list/ModalWrapper', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) =>
    isOpen ? <>{children}</> : null,
}))

import PresentationList from 'src/components/presentations_list/PresentationList'
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

const PresentationListHarness: React.FC<{ initial: Presentation[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Presentation[]>(initial)
  return (
    <PresentationList
      presentations={items}
      columnsToShow={['title', 'date', 'url', 'presenter', 'event']}
      onPresentationChange={setItems}
      disabled={false}
    />
  )
}

describe('PresentationList component', () => {
  it('renders existing presentations', () => {
    render(<PresentationListHarness initial={[samplePresentation]} />)
    expect(screen.getByText(samplePresentation.title)).toBeInTheDocument()
  })

  it('opens presentation in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<PresentationListHarness initial={[samplePresentation]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(samplePresentation.title)).toBeInTheDocument()
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('#date')).toBeDisabled()
    expect(container.querySelector('#date')).toHaveValue(samplePresentation.date)
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<PresentationListHarness initial={[samplePresentation]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#title')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a presentation through list harness', async () => {
    const user = userEvent.setup()
    const { container } = render(<PresentationListHarness initial={[]} />)
    await user.click(container.querySelector('#add-presentation-btn')!)
    expect(screen.getByText('New Presentation')).toBeInTheDocument()
    await user.type(container.querySelector('#title')!, 'Added Talk')
    const dateInput = container.querySelector('#date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } })
    await user.type(container.querySelector('#url')!, 'https://example.org/added')
    await user.type(container.querySelector('#authors')!, 'Auth A')
    await user.type(container.querySelector('#datasetCitation')!, 'Dataset Added')
    await user.click(container.querySelector('input[type="radio"]')!)
    await user.type(container.querySelector('#presenterName')!, 'Added Presenter')
    await user.type(container.querySelector('#presenterEmail')!, 'added.presenter@example.org')
    await user.type(container.querySelector('#event')!, 'Added Event')
    await user.type(container.querySelector('#location')!, 'Added City')
    await user.type(container.querySelector('#format')!, 'Poster')
    await user.type(container.querySelector('#access')!, 'Open')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(screen.getByText('Added Talk')).toBeInTheDocument()
  })

  it('edits a presentation', async () => {
    const user = userEvent.setup()
    const { container } = render(<PresentationListHarness initial={[samplePresentation]} />)
    await user.click(container.querySelector('.glyphicon-pencil')!)
    await user.clear(container.querySelector('#title')!)
    await user.type(container.querySelector('#title')!, 'Sample Talk Edited')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(screen.getByText('Sample Talk Edited')).toBeInTheDocument()
  })

  it('deletes a presentation via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<PresentationListHarness initial={[samplePresentation]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(container.querySelector('.delete-modal-primary-button')).toBeInTheDocument())
    const deleteBtn = container.querySelector('.delete-modal-primary-button')!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(samplePresentation.title)).not.toBeInTheDocument())
  })
})
