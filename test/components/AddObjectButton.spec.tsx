import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddObjectButton from 'src/components/AddObjectButton'

describe('AddObjectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with required props', () => {
    const onClickSpy = vi.fn()

    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    expect(screen.getByRole('button', { name: /Add Test/i })).toBeInTheDocument()
    expect(screen.getByText('Add Test')).toBeInTheDocument()
    expect(document.querySelector('#test-button svg')).not.toBeNull() // AddIcon
  })

  it('calls onClick when clicked', () => {
    const onClickSpy = vi.fn()

    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Add Test/i }))
    expect(onClickSpy).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClickSpy = vi.fn()

    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
        disabled={true}
      />,
    )

    const button = screen.getByRole('button', { name: /Add Test/i })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClickSpy).not.toHaveBeenCalled()
  })

  it('applies correct styling when disabled', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        disabled={true}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.style.cursor).toBe('not-allowed')
  })

  it('shows validation error styling', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={true}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.style.border).toBe('1px solid red')
    expect(button.style.boxShadow).toContain('red')
  })

  it('shows default styling without validation error', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={false}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.style.border).toContain('rgb(9, 72, 183)')
    expect(button.style.boxShadow).toBe('none')
  })

  it('applies button-white class', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.classList.contains('button')).toBe(true)
    expect(button.classList.contains('button-white')).toBe(true)
  })

  it('applies correct layout styles', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.style.display).toBe('flex')
    expect(button.style.alignItems).toBe('center')
    expect(button.style.marginTop).toBe('0px')
    expect(button.style.marginBottom).toBe('5px')
  })

  it('renders with custom icon', () => {
    const CustomIcon = () => <span data-testid="custom-icon">★</span>

    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        icon={<CustomIcon />}
      />,
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    expect(screen.getByTestId('custom-icon')).toHaveTextContent('★')
  })

  it('renders with default AddIcon when icon prop not provided', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    expect(document.querySelector('#test-button svg')).not.toBeNull()
    expect(document.querySelector('#test-button [data-testid="AddIcon"]')).not.toBeNull()
  })

  it('applies custom className', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        className="custom-class another-class"
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.classList.contains('custom-class')).toBe(true)
    expect(button.classList.contains('another-class')).toBe(true)
  })

  it('applies default className when not provided', () => {
    render(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    const button = document.getElementById('test-button')!
    expect(button.classList.contains('button')).toBe(true)
    expect(button.classList.contains('button-white')).toBe(true)
  })
})
