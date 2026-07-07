import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'

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

describe('IntellectualPropertyAddEdit', () => {
  it('prevents save until required fields are valid, then saves', async () => {
    const user = userEvent.setup()
    const collected: IntellectualProperty[] = []
    const { container } = render(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={vi.fn()}
        onIntellectualPropertyChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )

    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(0)

    fillForm(container)

    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].type).toBe('Patent')
    expect(collected[0].title).toBe('New IP')
  })

  it('does not save when URL format is invalid', async () => {
    const user = userEvent.setup()
    const onIntellectualPropertyChange = vi.fn()
    const { container } = render(
      <IntellectualPropertyAddEdit
        id={-1}
        intellectualProperty={undefined}
        intellectualProperties={[]}
        closeAction={vi.fn()}
        onIntellectualPropertyChange={onIntellectualPropertyChange}
      />,
    )
    fillForm(container)
    fireEvent.change(container.querySelector('#url')!, { target: { value: 'invalid-url' } })
    fireEvent.blur(container.querySelector('#url')!)

    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(onIntellectualPropertyChange).not.toHaveBeenCalled()
  })
})
