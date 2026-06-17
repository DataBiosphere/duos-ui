import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FileInput } from 'src/components/forms/FileInput'

const baseProps = {
  defaultValue: undefined,
  description: 'An important file description.',
  async onAddFile() {
  },
  async onDeleteFile() {
  },
  id: 'testFileUpload',
  title: 'File Upload Test',
  required: false,
}

describe('File Input - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a file input control', () => {
    render(<FileInput {...baseProps} />)
    expect(screen.getByText('File Upload Test')).toBeInTheDocument()
    expect(screen.getByText('An important file description.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add a file/i })).toBeInTheDocument()
  })

  it('should render a file input control with a required indicator', () => {
    const customProps = { ...baseProps, required: true }
    render(<FileInput {...customProps} />)
    expect(screen.getByText('File Upload Test*')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add a file/i })).toBeInTheDocument()
  })

  it('should trigger onAddFile when file is added.', async () => {
    const onAddFileSpy = vi.fn()
    const onDeleteFileSpy = vi.fn()
    const customProps = { ...baseProps, onAddFile: onAddFileSpy, onDeleteFile: onDeleteFileSpy }

    render(
      <BrowserRouter>
        <FileInput {...customProps} />
      </BrowserRouter>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const mockFile = new File(['dummy content'], 'blank.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } })
    })

    expect(onAddFileSpy).toHaveBeenCalled()
    expect(screen.getByText('blank.pdf')).toBeInTheDocument()

    const deleteLink = document.querySelector('a.glyphicon.glyphicon-trash')
    expect(deleteLink).not.toBeNull()

    await act(async () => {
      fireEvent.click(deleteLink!)
    })

    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    await act(async () => {
      fireEvent.click(confirmButton)
    })

    expect(onDeleteFileSpy).toHaveBeenCalled()
  })
})
