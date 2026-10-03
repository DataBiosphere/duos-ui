import React, { useState } from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MarkdownEditor } from 'src/components/blog/MarkdownEditor'
import { Blog } from 'src/libs/ajax/Blog'
import type { BlogImage } from 'src/types/blog'
import { renderWithRouter } from '../../test-utils'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { getImageUrlResolver: vi.fn() },
}))

const uploadedImage: BlogImage = { imageId: 'img-9', contentType: 'image/png', fileName: 'chart.png', sizeBytes: 3 }

const Harness = ({ initial, onUploadImage, onUploadError }: {
  initial: string
  onUploadImage: (file: File) => Promise<BlogImage>
  onUploadError: (error: unknown) => void
}) => {
  const [value, setValue] = useState(initial)
  return (
    <MarkdownEditor
      id="content"
      label="Content"
      value={value}
      onChange={setValue}
      onUploadImage={onUploadImage}
      onUploadError={onUploadError}
    />
  )
}

const textarea = () => screen.getByLabelText('Content') as HTMLTextAreaElement

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.getImageUrlResolver).mockResolvedValue(() => undefined)
  })

  it('applies a toolbar action to the selected text', () => {
    renderWithRouter(<Harness initial="make bold" onUploadImage={vi.fn()} onUploadError={vi.fn()} />)
    textarea().setSelectionRange(5, 9)

    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))

    expect(textarea().value).toBe('make **bold**')
  })

  it('uploads a chosen image and inserts it as a duos-image reference', async () => {
    const onUploadImage = vi.fn().mockResolvedValue(uploadedImage)
    renderWithRouter(<Harness initial="Intro" onUploadImage={onUploadImage} onUploadError={vi.fn()} />)
    textarea().setSelectionRange(5, 5)
    const file = new File(['png'], 'chart.png', { type: 'image/png' })

    fireEvent.change(screen.getByTestId('markdown-image-input'), { target: { files: [file] } })

    await vi.waitFor(() => expect(textarea().value).toBe('Intro\n\n![chart](duos-image:img-9)\n\n'))
    expect(onUploadImage).toHaveBeenCalledWith(file)
  })

  it('reports a failed upload and leaves the content alone', async () => {
    const failure = new Error('too big')
    const onUploadError = vi.fn()
    renderWithRouter(<Harness initial="Intro" onUploadImage={vi.fn().mockRejectedValue(failure)} onUploadError={onUploadError} />)

    fireEvent.change(screen.getByTestId('markdown-image-input'), { target: { files: [new File(['x'], 'x.png', { type: 'image/png' })] } })

    await vi.waitFor(() => expect(onUploadError).toHaveBeenCalledWith(failure))
    expect(textarea().value).toBe('Intro')
  })

  it('renders a live preview of the content', () => {
    renderWithRouter(<Harness initial="## Preview heading" onUploadImage={vi.fn()} onUploadError={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Preview heading' })).toBeInTheDocument()
  })
})
