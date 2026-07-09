import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyList from 'src/components/intellectual_property_list/IntellectualPropertyList'

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, defaultValue, onChange, disabled }: {
    id: string
    defaultValue?: string | null
    onChange: (v: string) => void
    disabled?: boolean
  }) => (
    <input
      id={id}
      type="date"
      value={defaultValue != null ? String(defaultValue) : ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}))

const sampleIp: IntellectualProperty = {
  ipId: 'ip-1',
  studyId: 'study-1',
  type: 'Patent',
  title: 'Test Patent',
  assignee: 'Inventor A',
  patentNumber: 'App123',
  filingDate: '2023-01-01',
  status: 'Filed',
  url: 'https://example.com/ip',
  contact: 'contact@example.com',
  tags: ['tag1', 'tag2'],
}

const IntellectualPropertyListHarness: React.FC<{ initial: IntellectualProperty[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<IntellectualProperty[]>(initial)
  return (
    <IntellectualPropertyList
      intellectualProperties={items}
      columnsToShow={['title', 'type']}
      onIntellectualPropertyChange={setItems}
      disabled={false}
    />
  )
}

const fillForm = (container: Element, overrides: Partial<IntellectualProperty> = {}) => {
  fireEvent.change(container.querySelector('#type')!, { target: { value: overrides.type ?? 'Patent' } })
  fireEvent.blur(container.querySelector('#type')!)
  fireEvent.change(container.querySelector('#title')!, { target: { value: overrides.title ?? 'New IP' } })
  fireEvent.blur(container.querySelector('#title')!)
  fireEvent.change(container.querySelector('#assignee')!, { target: { value: overrides.assignee ?? 'Assignee Name' } })
  fireEvent.blur(container.querySelector('#assignee')!)
  fireEvent.change(container.querySelector('#patentNumber')!, { target: { value: overrides.patentNumber ?? 'PAT123' } })
  fireEvent.blur(container.querySelector('#patentNumber')!)
  fireEvent.change(container.querySelector('#filingDate')!, { target: { value: '2023-01-15' } })
  fireEvent.change(container.querySelector('#status')!, { target: { value: overrides.status ?? 'Pending' } })
  fireEvent.blur(container.querySelector('#status')!)
  fireEvent.change(container.querySelector('#url')!, { target: { value: overrides.url ?? 'https://example.com' } })
  fireEvent.blur(container.querySelector('#url')!)
  fireEvent.change(container.querySelector('#contact')!, { target: { value: overrides.contact ?? 'contact@example.com' } })
  fireEvent.blur(container.querySelector('#contact')!)
}

beforeAll(() => Modal.setAppElement(document.body))

describe('IntellectualPropertyList', () => {
  it('adds a new intellectual property', async () => {
    const user = userEvent.setup()
    const state: IntellectualProperty[] = []
    const { container } = render(
      <IntellectualPropertyList
        intellectualProperties={state}
        columnsToShow={['title', 'type']}
        onIntellectualPropertyChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('#add-intellectual-property-btn')!)
    fillForm(container)
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(state).toHaveLength(1)
    expect(state[0].title).toBe('New IP')
  })

  it('deletes an intellectual property via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<IntellectualPropertyListHarness initial={[sampleIp]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleIp.title)).not.toBeInTheDocument())
    expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })

  it('opens intellectual property in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<IntellectualPropertyListHarness initial={[sampleIp]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleIp.title)).toBeInTheDocument()
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(container.querySelector('.collaborator-form-cancel-button')).toHaveTextContent('Close')
    expect(container.querySelector('#filingDate')).toHaveValue(sampleIp.filingDate)
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<IntellectualPropertyListHarness initial={[sampleIp]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#title')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })
})
