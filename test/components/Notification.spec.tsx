import React from 'react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Notification } from 'src/components/Notification'
import type { Banner } from 'src/libs/notificationService'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}))

const makeBanner = (overrides: Partial<Banner> = {}): Banner => ({
  id: 'test-banner',
  active: true,
  message: 'Test notification message',
  level: 'info',
  ...overrides,
})

const alertRoot = (): HTMLElement => screen.getByRole('alert')

describe('Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when notificationData is undefined', () => {
    const { container } = render(<Notification />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when notificationData is null', () => {
    const { container } = render(<Notification notificationData={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the banner carries no message', () => {
    const { container } = render(<Notification notificationData={makeBanner({ message: '' })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the banner message in an alert', () => {
    render(<Notification notificationData={makeBanner({ message: 'Hello world' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Hello world')
  })

  it.each([
    ['info', 'MuiAlert-colorInfo'],
    ['success', 'MuiAlert-colorSuccess'],
    ['warning', 'MuiAlert-colorWarning'],
    ['danger', 'MuiAlert-colorError'],
  ] as const)('maps the %s level onto its MUI severity', (level, expectedClass) => {
    render(<Notification notificationData={makeBanner({ level })} />)
    expect(alertRoot()).toHaveClass(expectedClass)
  })

  it('falls back to info when the banner carries no level', () => {
    render(<Notification notificationData={makeBanner({ level: undefined })} />)
    expect(alertRoot()).toHaveClass('MuiAlert-colorInfo')
  })

  // The feed is ops-authored, so a level outside the four known ones can reach the component.
  it('falls back to info when the banner carries an unknown level', () => {
    render(
      <Notification notificationData={{ message: 'odd level', level: 'critical' as Banner['level'] }} />,
    )
    expect(alertRoot()).toHaveClass('MuiAlert-colorInfo')
  })

  // SEVERITY is a plain object, so an inherited key must not reach MUI as a severity.
  it('falls back to info for a level that names an Object prototype member', () => {
    render(
      <Notification notificationData={{ message: 'inherited', level: 'toString' as Banner['level'] }} />,
    )
    expect(alertRoot()).toHaveClass('MuiAlert-colorInfo')
  })

  it('does not render a close button when onDismiss is omitted', () => {
    render(<Notification notificationData={makeBanner()} />)
    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument()
  })

  it('renders a close button and calls onDismiss when clicked', () => {
    const onDismiss = vi.fn()
    render(<Notification notificationData={makeBanner()} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
