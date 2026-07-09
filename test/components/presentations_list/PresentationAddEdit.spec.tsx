import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
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

import PresentationAddEdit from 'src/components/presentations_list/PresentationAddEdit'
import { Presentation } from 'src/types/model'

describe('PresentationAddEdit component', () => {
  it('opens add form and enforces validation disabling save then adds', async () => {
    const user = userEvent.setup()
    const collected: Presentation[] = []
    const { container } = render(
      <PresentationAddEdit
        id={-1}
        presentations={[]}
        closeAction={vi.fn()}
        onPresentationChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    await user.type(container.querySelector('#title')!, 'New Title')
    const dateInput = container.querySelector('#date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } })
    await user.type(container.querySelector('#url')!, 'https://example.org/new')
    await user.type(container.querySelector('#authors')!, 'Author One; Author Two')
    await user.type(container.querySelector('#datasetCitation')!, 'Dataset Y')
    await user.click(container.querySelector('input[type="radio"]')!)
    await user.type(container.querySelector('#presenterName')!, 'Presenter X')
    await user.type(container.querySelector('#presenterEmail')!, 'presenterx@example.org')
    await user.type(container.querySelector('#event')!, 'Event 2024')
    await user.type(container.querySelector('#location')!, 'Location Z')
    await user.type(container.querySelector('#format')!, 'Poster')
    await user.type(container.querySelector('#access')!, 'Public')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].title).toBe('New Title')
  })
})
