import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Notification } from 'src/components/Notification'
import type { Banner } from 'src/libs/notificationService'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}))

vi.mock('./Notification.module.css', () => ({ default: { underlined: 'underlined' } }))

const makeBanner = (overrides: Partial<Banner> = {}): Banner => ({
  id: 'test-banner',
  active: true,
  message: 'Test notification message',
  level: 'info',
  ...overrides,
})

describe('Notification', () => {
  it('renders nothing visible when notificationData is undefined', () => {
    const { container } = render(<Notification />)
    const div = container.querySelector('div') as HTMLElement
    expect(div.style.display).toBe('none')
  })

  it('renders nothing visible when notificationData is null', () => {
    const { container } = render(<Notification notificationData={null} />)
    const div = container.querySelector('div') as HTMLElement
    expect(div.style.display).toBe('none')
  })

  it('renders the banner message', () => {
    render(<Notification notificationData={makeBanner({ message: 'Hello world' })} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('applies the correct alert class for each level', () => {
    const levels: Banner['level'][] = ['success', 'info', 'warning', 'danger']
    for (const level of levels) {
      const { container } = render(<Notification notificationData={makeBanner({ level })} />)
      const alertDiv = container.querySelector('.alert') as HTMLElement
      expect(alertDiv).toHaveClass(`alert-${level}`)
    }
  })

  it('merges customStyle into the container', () => {
    const { container } = render(
      <Notification
        notificationData={makeBanner()}
        customStyle={{ backgroundColor: 'rgb(255, 0, 0)' }}
      />,
    )
    const alertDiv = container.querySelector('.alert') as HTMLElement
    expect(alertDiv.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })
})
