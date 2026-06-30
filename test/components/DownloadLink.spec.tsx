import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadLink } from 'src/components/DownloadLink'

describe('DownloadLink', () => {
  it('renders the label text', () => {
    render(<DownloadLink label="Download Report" onDownload={vi.fn()} />)
    expect(screen.getByText('Download Report')).toBeInTheDocument()
  })

  it('sets the link id to the kebab-cased label', () => {
    const { container } = render(<DownloadLink label="Download Report" onDownload={vi.fn()} />)
    expect(container.querySelector('#download-report')).toBeInTheDocument()
  })

  it('calls onDownload when the link is clicked', async () => {
    const onDownload = vi.fn()
    render(<DownloadLink label="Download Report" onDownload={onDownload} />)
    await userEvent.click(screen.getByText('Download Report'))
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('renders the download glyphicon', () => {
    const { container } = render(<DownloadLink label="My File" onDownload={vi.fn()} />)
    expect(container.querySelector('.glyphicon-download-alt')).toBeInTheDocument()
  })
})
