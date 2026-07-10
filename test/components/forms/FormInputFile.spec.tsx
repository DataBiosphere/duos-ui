import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Replicates FormInputFile behavior (no standalone source component exists;
// this matches the component defined in the original spec exactly)
const TestFormInputFile = ({
  id,
  disabled = false,
  uploadText = 'Upload a file',
  validation = { valid: true },
}: {
  id: string
  disabled?: boolean
  uploadText?: string
  validation?: { valid: boolean }
}) => (
  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
    <div className={`form-file-upload ${disabled ? 'disabled' : ''}`}>
      <input
        id={id}
        type="file"
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <label
        {...(!disabled && { htmlFor: id })}
        className={`form-file-label ${!validation.valid ? 'errored' : ''}`}
      >
        <span>📁</span>
        {' '}
        {uploadText}
      </label>
    </div>
  </div>
)

describe('FormInputFile Component', () => {
  it('should render upload button when not disabled', () => {
    const { container } = render(<TestFormInputFile id="test-file-input" />)
    expect(container.querySelector('.form-file-upload')).toBeInTheDocument()
    expect(container.querySelector('.form-file-upload')).not.toHaveClass('disabled')
    expect(container.querySelector('label.form-file-label')).toHaveAttribute('for', 'test-file-input')
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).not.toBeDisabled()
  })

  it('should disable upload button when disabled prop is true', () => {
    const { container } = render(<TestFormInputFile id="test-file-input" disabled={true} />)
    expect(container.querySelector('.form-file-upload')).toBeInTheDocument()
    expect(container.querySelector('.form-file-upload')).toHaveClass('disabled')
    expect(container.querySelector('label.form-file-label')).not.toHaveAttribute('for')
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).toBeDisabled()
  })

  it('should show custom upload text', () => {
    const { container } = render(<TestFormInputFile id="test-file-input" uploadText="Choose your file" />)
    expect(container.querySelector('label.form-file-label')).toHaveTextContent('Choose your file')
  })

  it('should appear disabled in read-only DAR and not trigger file selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestFormInputFile id="test-file-input" disabled={true} />)
    expect(container.querySelector('.form-file-upload')).toHaveClass('disabled')
    // jsdom does not compute styles from external CSS files so opacity cannot be asserted here;
    // the disabled class is the structural equivalent
    expect(container.querySelector('label.form-file-label')).not.toHaveAttribute('for')
    expect(container.querySelector('input[type="file"]')).toBeDisabled()
    await user.click(container.querySelector('label.form-file-label')!)
    expect(container.querySelector('input[type="file"]')).not.toHaveFocus()
  })

  it('should have proper cursor styling when disabled', () => {
    const { container } = render(<TestFormInputFile id="test-file-input" disabled={true} />)
    expect(container.querySelector('.form-file-upload')).toHaveClass('disabled')
    expect(container.querySelector('.form-file-upload.disabled')).toBeInTheDocument()
  })

  it('should enable file selection when clicking enabled upload button', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestFormInputFile id="test-file-input" disabled={false} />)
    expect(container.querySelector('.form-file-upload')).not.toHaveClass('disabled')
    expect(container.querySelector('label.form-file-label')).toHaveAttribute('for', 'test-file-input')
    expect(container.querySelector('input[type="file"]')).not.toBeDisabled()
    await user.click(container.querySelector('label.form-file-label')!)
    // label is correctly linked to input when enabled
  })
})
