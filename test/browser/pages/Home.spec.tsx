import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { page } from 'vitest/browser'
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
})
