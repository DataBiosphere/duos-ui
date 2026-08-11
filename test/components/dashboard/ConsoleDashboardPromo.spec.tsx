import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: ({ showModal, url, onCloseRequest }: {
    showModal: boolean
    url?: string
    onCloseRequest: () => void
  }) => showModal
    ? (
        <div data-testid="support-modal" data-url={url}>
          <button type="button" onClick={onCloseRequest}>Close support</button>
        </div>
      )
    : null,
}))

const paragraphs = [
  'Researchers can use DUOS to discover controlled-access datasets.',
  'Reach out if you\'d like to learn more.',
]

const renderPromo = (props: Partial<React.ComponentProps<typeof ConsoleDashboardPromo>> = {}) => render(
  <ConsoleDashboardPromo heading="Get more out of DUOS" paragraphs={paragraphs} {...props} />,
)

describe('ConsoleDashboardPromo', () => {
  it('renders the heading and every paragraph', () => {
    renderPromo()

    expect(screen.getByRole('heading', { level: 2, name: 'Get more out of DUOS' })).toBeInTheDocument()
    paragraphs.forEach(text => expect(screen.getByText(text)).toBeInTheDocument())
  })

  it('labels the button Contact Us unless told otherwise', () => {
    renderPromo()

    expect(screen.getByRole('button', { name: 'Contact Us' })).toBeInTheDocument()
  })

  it('uses a caller supplied button label', () => {
    renderPromo({ buttonLabel: 'Talk to the DUOS team' })

    expect(screen.getByRole('button', { name: 'Talk to the DUOS team' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Contact Us' })).not.toBeInTheDocument()
  })

  it('keeps the support modal closed until the button is pressed', () => {
    renderPromo()

    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('opens the support request modal prepopulated with the current page URL', () => {
    renderPromo()

    fireEvent.click(screen.getByRole('button', { name: 'Contact Us' }))

    expect(screen.getByTestId('support-modal')).toHaveAttribute('data-url', window.location.href)
  })

  it('closes the support modal again when the modal asks it to', () => {
    renderPromo()

    fireEvent.click(screen.getByRole('button', { name: 'Contact Us' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close support' }))

    expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
  })

  it('renders no paragraphs when none are supplied', () => {
    const { container } = renderPromo({ paragraphs: [] })

    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
