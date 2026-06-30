import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import UsgOmbText from 'src/components/UsgOmbText'

describe('UsgOmbText', () => {
  it('renders the OMB number', () => {
    render(<UsgOmbText />)
    expect(screen.getByText(/OMB No\.: 0925-7775/)).toBeInTheDocument()
  })

  it('renders the expiration date', () => {
    render(<UsgOmbText />)
    expect(screen.getByText(/Expiration Date:/)).toBeInTheDocument()
  })

  it('renders the public reporting burden text', () => {
    render(<UsgOmbText />)
    expect(screen.getByText(/Public reporting burden/)).toBeInTheDocument()
  })

  it('renders within a styled container', () => {
    const { container } = render(<UsgOmbText />)
    const div = container.firstChild as HTMLElement
    expect(div.style.background).toBe('rgb(238, 238, 238)')
    expect(div.style.padding).toBe('20px')
  })
})
