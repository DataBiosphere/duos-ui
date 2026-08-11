import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import PrivacyPolicy from 'src/pages/PrivacyPolicy'

describe('Privacy Policy', () => {
  it('Renders the privacy policy page', () => {
    render(<BrowserRouter><PrivacyPolicy /></BrowserRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DUOS Privacy Policy')
    expect(screen.getByRole('heading', { level: 2, name: /Information DUOS May Collect From You/i })).toBeInTheDocument()
  })
})
