import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DuosFooter from 'src/components/DuosFooter'
import { CookieUtils } from 'src/utils/CookieUtils'

afterEach(() => vi.restoreAllMocks())

describe('DuosFooter', () => {
  it('renders the Broad Institute logo', () => {
    vi.spyOn(CookieUtils, 'getAcknowledged').mockReturnValue(true)
    const { container } = render(<BrowserRouter><DuosFooter /></BrowserRouter>)
    expect(container.querySelector('#cookie_banner')).not.toBeVisible()
    expect(screen.getByAltText('Broad Institute logo')).toBeInTheDocument()
  })

  it('renders all footer links', () => {
    vi.spyOn(CookieUtils, 'getAcknowledged').mockReturnValue(true)
    const { container } = render(<BrowserRouter><DuosFooter /></BrowserRouter>)
    expect(container.querySelector('#cookie_banner')).not.toBeVisible()
    expect(screen.getByText('© Broad Institute')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/tos')
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookie_policy')
    expect(screen.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '/status')
  })

  it('shows Cookie Banner when cookies have not been acknowledged', () => {
    vi.spyOn(CookieUtils, 'getAcknowledged').mockReturnValue(false)
    const { container } = render(<BrowserRouter><DuosFooter /></BrowserRouter>)
    expect(container.querySelector('#cookie_banner')).toBeVisible()
  })
})
