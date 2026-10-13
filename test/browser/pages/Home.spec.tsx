import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { page } from 'vitest/browser'
import 'src/styles/bootstrap_replacement.css'
import Home from 'src/pages/Home'
import { getLibraryVersions } from 'src/libs/libraryVersions'

const featuredLibraryCount = Object.values(getLibraryVersions(null, null))
  .filter(library => library.featured).length

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: ({ showModal }: { showModal: boolean }) =>
    showModal ? React.createElement('div', { 'data-testid': 'support-modal' }) : null,
}))

vi.mock('src/libs/signInUtils', () => ({ handleSignIn: vi.fn() }))

describe('Home Page - Responsive Layout (browser)', () => {
  it.each([
    { label: 'desktop', width: 1200, height: 800, expected: { flexDirection: 'row', display: 'flex', justifyContent: 'center' } },
    { label: 'tablet', width: 768, height: 1024, expected: { display: 'flex' } },
    { label: 'mobile', width: 480, height: 800, expected: { display: 'flex', flexWrap: 'wrap' } },
  ])('logo grid has correct CSS at $label viewport ($width×$height)', async ({ width, height, expected }) => {
    const { container } = render(
      <MemoryRouter>
        <Home isLogged={true} />
      </MemoryRouter>,
    )
    await page.viewport(width, height)
    const logoGrid = container.querySelector('.logo-grid')!
    for (const [prop, value] of Object.entries(expected)) {
      expect(window.getComputedStyle(logoGrid)[prop as keyof CSSStyleDeclaration]).toBe(value)
    }
    expect(container.querySelectorAll('.logo-card')).toHaveLength(featuredLibraryCount)
  })

  it('keeps guide link colours and removes the global underline on focus', async () => {
    await page.viewport(1200, 800)
    const { container } = render(
      <MemoryRouter>
        <Home isLogged={false} />
      </MemoryRouter>,
    )
    // bootstrap_replacement.css sets a:focus { color: #23527c; text-decoration: underline }.
    const soButton = container.querySelector<HTMLElement>('#blog-support-so-link')!
    soButton.focus()
    expect(document.activeElement).toBe(soButton)
    expect(getComputedStyle(soButton).color).toBe('rgb(255, 255, 255)')
    expect(getComputedStyle(soButton).textDecorationLine).toBe('none')

    const dacLink = container.querySelector<HTMLElement>('#blog-support-dac-link')!
    dacLink.focus()
    expect(getComputedStyle(dacLink).color).toBe('rgb(31, 59, 80)')
    expect(getComputedStyle(dacLink).textDecorationLine).toBe('none')
  })

  it('renders every library card at the same height, even when a name wraps', async () => {
    await page.viewport(1200, 800)
    const { container } = render(
      <MemoryRouter>
        <Home isLogged={true} />
      </MemoryRouter>,
    )
    const heights = [...container.querySelectorAll('.logo-grid .MuiCard-root')]
      .map(card => Math.round(card.getBoundingClientRect().height))
    expect(heights).toHaveLength(featuredLibraryCount)
    expect(new Set(heights).size).toBe(1)
  })
})
