import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DismissibleBanner } from 'src/components/DismissibleBanner'
import { dismissBanner } from 'src/libs/notificationService'
import type { Banner } from 'src/libs/notificationService'
import { onBannerDismissed } from 'src/libs/notificationService'
import { bannerDismissalBus } from '../test-utils'

vi.mock('src/libs/notificationService', () => ({
  dismissBanner: vi.fn(),
  onBannerDismissed: vi.fn(() => () => {}),
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}))

const dismissalBus = bannerDismissalBus()

const banner: Banner = { id: 'banner-1', active: true, message: 'Scheduled maintenance', level: 'info' }

describe('DismissibleBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dismissalBus.reset()
    vi.mocked(onBannerDismissed).mockImplementation(dismissalBus.subscribe)
    vi.mocked(dismissBanner).mockImplementation(dismissalBus.publish)
  })

  it('renders nothing when there is no banner', () => {
    const { container } = render(<DismissibleBanner banner={null} isLogged={true} onDismissed={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the banner message', () => {
    render(<DismissibleBanner banner={banner} isLogged={true} onDismissed={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Scheduled maintenance')
  })

  // App mounts DuosHeader alongside the page, so the same banner can be on screen twice.
  it('drops the banner when the same one is dismissed somewhere else', async () => {
    const onDismissed = vi.fn()
    render(<DismissibleBanner banner={banner} isLogged={true} onDismissed={onDismissed} />)

    dismissalBus.publish('banner-1')

    expect(onDismissed).toHaveBeenCalledOnce()
  })

  it('ignores a dismissal of a different banner', async () => {
    const onDismissed = vi.fn()
    render(<DismissibleBanner banner={banner} isLogged={true} onDismissed={onDismissed} />)

    dismissalBus.publish('some-other-banner')

    expect(onDismissed).not.toHaveBeenCalled()
  })

  it('records the dismissal and tells the page once the close button is used', async () => {
    const onDismissed = vi.fn()
    render(<DismissibleBanner banner={banner} isLogged={true} onDismissed={onDismissed} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(dismissBanner).toHaveBeenCalledWith('banner-1', true)
    expect(onDismissed).toHaveBeenCalledOnce()
  })
})
