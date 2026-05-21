import React from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import CookiePolicy from 'src/pages/CookiePolicy'
import { renderWithRouter } from '../test-utils'

describe('Cookie Policy', () => {
  it('renders the cookie policy page', () => {
    renderWithRouter(<CookiePolicy />)

    expect(screen.getByRole('heading', { level: 1, name: 'Cookie Policy' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'What are cookies?' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'What cookies do we use?' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'Cookies consent and changing preferences' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'Controlling all cookies' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'Changes to this Policy' })).not.to.equal(null)
    expect(screen.getByRole('heading', { level: 2, name: 'Contact Us' })).not.to.equal(null)
  })
})
