import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BrowserRouter } from 'react-router-dom'
import { CookieBanner } from 'src/components/CookieBanner'
import { CookieUtils } from 'src/utils/CookieUtils'

vi.mock('src/utils/CookieUtils', () => ({
  CookieUtils: {
    setAcknowledged: vi.fn(),
  },
}))

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the banner text and close button', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <CookieBanner visible={true} onDismiss={() => {}} />
        </BrowserRouter>,
      )
    })

    expect(screen.getByText('We care about your privacy')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('hides banner and sets accepted when close button is clicked', async () => {
    const onDismiss = vi.fn()
    await act(async () => {
      render(
        <BrowserRouter>
          <CookieBanner visible={true} onDismiss={onDismiss} />
        </BrowserRouter>,
      )
    })

    const banner = document.querySelector('#cookie_banner') as HTMLElement
    expect(banner).toBeVisible()

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(banner).not.toBeVisible()
    expect(CookieUtils.setAcknowledged).toHaveBeenCalledOnce()
  })

  it('does not render the banner text when visible is set false', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <CookieBanner visible={false} onDismiss={() => {}} />
        </BrowserRouter>,
      )
    })

    const banner = document.querySelector('#cookie_banner') as HTMLElement
    expect(banner).not.toBeVisible()
  })
})
