import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SpinnerComponent } from 'src/components/SpinnerComponent'

describe('SpinnerComponent', () => {
  it('renders a div with fixed overlay positioning', () => {
    const { container } = render(<SpinnerComponent loadingImage="spinner.svg" />)
    const div = container.querySelector('div') as HTMLElement
    expect(div.style.position).toBe('fixed')
    expect(div.style.zIndex).toBe('10000')
  })

  it('renders the loading image with alt text when loadingImage is provided', () => {
    const { container } = render(<SpinnerComponent loadingImage="spinner.svg" />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'spinner.svg')
    expect(img).toHaveAttribute('alt', 'spinner')
  })

  it('does not render an img when loadingImage is omitted', () => {
    const { container } = render(<SpinnerComponent><span>Loading</span></SpinnerComponent>)
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('renders children', () => {
    const { getByText } = render(
      <SpinnerComponent>
        <span>Loading...</span>
      </SpinnerComponent>,
    )
    expect(getByText('Loading...')).toBeInTheDocument()
  })

  it('renders both image and children when both are provided', () => {
    const { container, getByText } = render(
      <SpinnerComponent loadingImage="spinner.svg">
        <span>Loading...</span>
      </SpinnerComponent>,
    )
    expect(container.querySelector('img')).toBeInTheDocument()
    expect(getByText('Loading...')).toBeInTheDocument()
  })

  it('renders an empty div when neither loadingImage nor children are provided', () => {
    const { container } = render(<SpinnerComponent />)
    expect(container.querySelector('div')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
