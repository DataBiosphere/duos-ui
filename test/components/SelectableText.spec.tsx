import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SelectableText from 'src/components/SelectableText'

const renderTab = (overrides = {}) =>
  render(
    <SelectableText
      label="Reviews"
      setSelected={vi.fn()}
      selectedType=""
      {...overrides}
    />,
  )

describe('SelectableText', () => {
  it('renders the label text', () => {
    renderTab()
    expect(screen.getByText('Reviews')).toBeInTheDocument()
  })

  it('applies the tab-selection class based on label', () => {
    const { container } = renderTab()
    expect(container.firstChild).toHaveClass('tab-selection-Reviews')
  })

  it('applies the selected style when selectedType matches label', () => {
    const { container } = renderTab({ selectedType: 'Reviews' })
    const div = container.firstChild as HTMLElement
    expect(div.style.borderBottomColor).toBe('green')
  })

  it('does not apply the selected border when selectedType does not match label', () => {
    const { container } = renderTab({ selectedType: 'Other' })
    const btn = container.firstChild as HTMLElement
    expect(btn.style.borderBottomColor).not.toBe('green')
  })

  it('applies hover style on mouse enter and reverts on mouse leave', () => {
    const { container } = renderTab({ selectedType: 'Other' })
    const div = container.firstChild as HTMLElement

    fireEvent.mouseEnter(div)
    expect(div.style.cursor).toBe('pointer')

    fireEvent.mouseLeave(div)
    expect(div.style.cursor).toBe('')
  })

  it('calls setSelected with the label when clicked', () => {
    const setSelected = vi.fn()
    renderTab({ setSelected })
    fireEvent.click(screen.getByText('Reviews'))
    expect(setSelected).toHaveBeenCalledWith('Reviews')
  })

  it('is a native button element', () => {
    renderTab()
    expect(screen.getByRole('button', { name: 'Reviews' })).toBeInTheDocument()
  })

  it('is disabled and does not call setSelected when isDisabled is true', () => {
    const setSelected = vi.fn()
    renderTab({ setSelected, isDisabled: true })
    const btn = screen.getByRole('button', { name: 'Reviews' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(setSelected).not.toHaveBeenCalled()
  })

  it('applies styleOverride baseStyle on top of defaults', () => {
    const { container } = renderTab({
      styleOverride: { baseStyle: { color: 'red' } },
    })
    const div = container.firstChild as HTMLElement
    expect(div.style.color).toBe('red')
  })

  it('uses custom tabSelected style when provided and selected', () => {
    const { container } = renderTab({
      selectedType: 'Reviews',
      styleOverride: { tabSelected: { borderBottomColor: 'blue' } },
    })
    const div = container.firstChild as HTMLElement
    expect(div.style.borderBottomColor).toBe('blue')
  })

  it('uses custom tabUnselected style when provided and not selected', () => {
    const { container } = renderTab({
      selectedType: 'Other',
      styleOverride: { tabUnselected: { color: 'purple' } },
    })
    const div = container.firstChild as HTMLElement
    expect(div.style.color).toBe('purple')
  })
})
