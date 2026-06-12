import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SearchSelect } from 'src/components/SearchSelect'

const options = [
  { key: '1', displayText: 'Option One' },
  { key: '2', displayText: 'Option Two' },
  { key: '3', displayText: 'Option Three' },
]

describe('<SearchSelect />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with empty value', () => {
    const onSelection = vi.fn()
    render(
      <SearchSelect
        onSelection={onSelection}
        placeholder="Select an option"
        options={options}
        value=""
        isClearable={true}
      />,
    )
    const input = document.querySelector('input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('preselects option when value matches', () => {
    const onSelection = vi.fn()
    render(
      <SearchSelect
        onSelection={onSelection}
        placeholder="Select an option"
        options={options}
        value="2"
        isClearable={true}
      />,
    )
    expect(screen.getByText('Option Two')).toBeInTheDocument()
  })

  it('calls onSelection when user selects an option', async () => {
    const onSelection = vi.fn()
    render(
      <SearchSelect
        onSelection={onSelection}
        placeholder="Select an option"
        options={options}
        value=""
        isClearable={true}
      />,
    )
    const input = document.querySelector('input') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Option One' } })
    })
    const option = await screen.findByText('Option One')
    await act(async () => {
      fireEvent.click(option)
    })
    expect(onSelection).toHaveBeenCalledOnce()
  })

  it('does not allow interaction when disabled', () => {
    const onSelection = vi.fn()
    render(
      <SearchSelect
        onSelection={onSelection}
        placeholder="Disabled select"
        options={options}
        value=""
        isClearable={true}
        disabled={true}
      />,
    )
    const input = document.querySelector('input')
    expect(input).toBeDisabled()
  })
})
