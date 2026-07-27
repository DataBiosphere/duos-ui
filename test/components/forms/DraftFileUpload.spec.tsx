import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { DraftFileUpload } from 'src/components/forms/DraftFileUpload'
import { FileStorageObject } from 'src/types/model'

const baseProps = {
  defaultValue: undefined,
  description: 'An important file description.',
  draftId: '',
  async onAddFile() {
  },
  async onDeleteFile() {
  },
  id: 'testFileUpload',
  title: 'File Upload Test',
  required: false,
}

const baseFso = {
  fileStorageObjectId: 1234,
  entityId: 'abcd',
  fileName: 'blank.pdf',
  category: 'draftUploadedFile',
  mediaType: 'application/pdf',
  createUserId: 1,
  createDate: 1,
  updateUserId: 1,
  updateDate: 1,
  deleteUserId: -1,
  deleteDate: -1,
  deleted: false,
} as FileStorageObject

describe('Draft File Upload - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a draft file upload control', () => {
    render(<DraftFileUpload {...baseProps} />)
    expect(document.querySelector('#lbl_testFileUpload')).not.toBeNull()
    expect(screen.getByText('File Upload Test')).toBeInTheDocument()
    expect(screen.getByText('An important file description.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload a file/i })).toBeInTheDocument()
  })

  it('should render a draft file upload control with a required indicator', () => {
    const customProps = { ...baseProps, required: true }
    render(<DraftFileUpload {...customProps} />)
    expect(screen.getByText('File Upload Test*')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload a file/i })).toBeInTheDocument()
  })

  it('should trigger onAddFile when file is added.', async () => {
    const onAddFileSpy = vi.fn().mockResolvedValue(undefined)
    const customProps = { ...baseProps, onAddFile: onAddFileSpy }

    render(<DraftFileUpload {...customProps} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const mockFile = new File(['dummy content'], 'blank.pdf', { type: 'application/pdf' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } })
    })

    expect(onAddFileSpy).toHaveBeenCalled()
  })

  it('should display file name when defaultValue is FSO.', () => {
    const customProps = { ...baseProps, defaultValue: baseFso }
    render(
      <BrowserRouter>
        <DraftFileUpload {...customProps} />
      </BrowserRouter>,
    )
    expect(screen.getByRole('button', { name: /Upload a file/i })).toBeDisabled()
    expect(screen.getByText('blank.pdf')).toBeInTheDocument()
    expect(document.querySelector('a.glyphicon.glyphicon-trash')).not.toBeNull()
  })

  it('should trigger onDelete when file is removed.', async () => {
    const onDeleteFileSpy = vi.fn().mockResolvedValue(undefined)
    const customProps = { ...baseProps, defaultValue: baseFso, onDeleteFile: onDeleteFileSpy }

    render(
      <BrowserRouter>
        <DraftFileUpload {...customProps} />
      </BrowserRouter>,
    )

    const deleteLink = document.querySelector('a.glyphicon.glyphicon-trash')!
    await act(async () => {
      fireEvent.click(deleteLink)
    })

    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    await act(async () => {
      fireEvent.click(confirmButton)
    })

    expect(onDeleteFileSpy).toHaveBeenCalled()
  })
})
