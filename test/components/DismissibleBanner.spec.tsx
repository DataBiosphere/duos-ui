import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DismissibleBanner } from 'src/components/DismissibleBanner'
import { dismissBanner } from 'src/libs/notificationService'
import type { Banner } from 'src/libs/notificationService'

vi.mock('src/libs/notificationService', () => ({ dismissBanner: vi.fn() }))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}))

const banner: Banner = { id: 'banner-1', active: true, message: 'Scheduled maintenance', level: 'info' }

describe('DismissibleBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no banner', () => {
    const { container } = render(<DismissibleBanner banner={null} onDismissed={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the banner message', () => {
    render(<DismissibleBanner banner={banner} onDismissed={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Scheduled maintenance')
  })

  it('records the dismissal and tells the page once the close button is used', async () => {
    const onDismissed = vi.fn()
    render(<DismissibleBanner banner={banner} onDismissed={onDismissed} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(dismissBanner).toHaveBeenCalledWith('banner-1')
    expect(onDismissed).toHaveBeenCalledOnce()
  })
})
