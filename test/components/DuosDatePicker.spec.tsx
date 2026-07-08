import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DuosDatePicker } from 'src/components/DuosDatePicker'

describe('DuosDatePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a formatted initial value from a string default', () => {
    render(
      <DuosDatePicker
        inputFormat="YYYY-MM-DD"
        defaultValue="2026-04-30"
        onChange={vi.fn()}
        onError={vi.fn()}
        readOnly={false}
      />,
    )
    const hiddenInput = document.querySelector('input.MuiPickersInputBase-input') as HTMLInputElement
    expect(hiddenInput).not.toBeNull()
    expect(hiddenInput.value).toBe('2026-04-30')
  })

  it('renders the input as read-only when requested', () => {
    render(
      <DuosDatePicker
        inputFormat="YYYY-MM-DD"
        defaultValue="2026-04-30"
        onChange={vi.fn()}
        onError={vi.fn()}
        readOnly={true}
      />,
    )
    const hiddenInput = document.querySelector('input.MuiPickersInputBase-input') as HTMLInputElement
    expect(hiddenInput).not.toBeNull()
    expect(hiddenInput).toHaveAttribute('readonly')
  })

  it('renders the calendar trigger button when not read-only', () => {
    render(
      <DuosDatePicker
        inputFormat="YYYY-MM-DD"
        defaultValue="2026-04-30"
        onChange={vi.fn()}
        onError={vi.fn()}
        readOnly={false}
      />,
    )
    expect(screen.getByRole('button', { name: /Choose date/i })).toBeInTheDocument()
  })

  it('calls onChange with the formatted date string when a calendar day is selected and accepted', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DuosDatePicker
        inputFormat="YYYY-MM-DD"
        defaultValue="2026-04-30"
        onChange={onChange}
        onError={vi.fn()}
        readOnly={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: /choose date/i }))

    // Calendar opens to April 2026; select the 15th (role="gridcell", text="15")
    const day15 = await screen.findByRole('gridcell', { name: '15' })
    await user.click(day15)
    await user.click(screen.getByRole('button', { name: 'Select' }))

    expect(onChange).toHaveBeenCalledWith('2026-04-15')
  })
})
