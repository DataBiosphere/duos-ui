import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'

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

describe('IntellectualPropertyRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onIntellectualPropertyChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleIp.title)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <IntellectualPropertyRow
        id={0}
        editMode={true}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onIntellectualPropertyChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(sampleIp.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        viewMode={true}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onIntellectualPropertyChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#title')).toHaveValue(sampleIp.title)
    expect(container.querySelector('#title')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <IntellectualPropertyRow
        id={0}
        editMode={false}
        intellectualProperty={sampleIp}
        intellectualProperties={[sampleIp]}
        columnsToShow={['title', 'type']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onIntellectualPropertyChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
