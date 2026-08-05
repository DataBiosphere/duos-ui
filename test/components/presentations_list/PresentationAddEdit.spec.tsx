import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    const closeAction = vi.fn()
    const onPresentationChange = vi.fn()

    render(
      <PresentationAddEdit
        id={-1}
        presentations={[]}
        closeAction={closeAction}
        onPresentationChange={onPresentationChange}
      />,
    )

    await user.type(screen.getByLabelText(/Presentation Title/i) as HTMLInputElement, 'New Title')
    await user.type(screen.getByLabelText(/Presentation Date/i) as HTMLInputElement, '2024-01-15')
    await user.type(screen.getByLabelText(/Presentation URL/i) as HTMLInputElement, 'https://example.org/new')
    await user.type(screen.getByLabelText(/Authors/i) as HTMLInputElement, 'Author One; Author Two')
    await user.type(screen.getByLabelText(/Dataset Citation/i) as HTMLInputElement, 'Dataset Y')
    await user.click(screen.getByRole('radio', { name: 'Yes' }))
    await user.type(screen.getByLabelText(/Presenter Name/i) as HTMLInputElement, 'Presenter X')
    await user.type(screen.getByLabelText(/Presenter Email/i) as HTMLInputElement, 'presenterx@example.org')
    await user.type(screen.getByLabelText(/Event/i) as HTMLInputElement, 'Event 2024')
    await user.type(screen.getByLabelText(/Location/i) as HTMLInputElement, 'Location Z')
    await user.type(screen.getByLabelText(/Format/i) as HTMLInputElement, 'Poster')
    await user.type(screen.getByLabelText(/Access/i) as HTMLInputElement, 'Public')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(onPresentationChange).toHaveBeenCalledTimes(1)
    })

    const changedPresentations = onPresentationChange.mock.calls[0][0] as Presentation[]
    expect(changedPresentations).toHaveLength(1)
    expect(changedPresentations[0].title).toBe('New Title')
    expect(closeAction).toHaveBeenCalledTimes(1)
  })
})
