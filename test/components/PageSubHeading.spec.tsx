import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PageSubHeading } from 'src/components/PageSubHeading'

describe('PageSubHeading', () => {
  it('renders the title with the correct id and color class', () => {
    const { container } = render(
      <PageSubHeading id="test" title="My Heading" color="common" />,
    )
    const title = container.querySelector('#test_title') as HTMLElement
    expect(title).toBeInTheDocument()
    expect(title.textContent).toBe('My Heading')
    expect(title).toHaveClass('common-color')
  })

  it('renders the description with the correct id', () => {
    const { container } = render(
      <PageSubHeading id="test" title="T" description="Some description" />,
    )
    const desc = container.querySelector('#test_description') as HTMLElement
    expect(desc).toBeInTheDocument()
    expect(desc.textContent).toBe('Some description')
  })

  it('renders the icon image when imgSrc is provided', () => {
    const { container } = render(
      <PageSubHeading id="test" title="T" imgSrc="/icon.png" />,
    )
    const img = container.querySelector('#test_icon') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('/icon.png')
    expect(img.alt).toBe('T')
  })

  it('does not render an icon when imgSrc is omitted', () => {
    const { container } = render(
      <PageSubHeading id="test" title="T" />,
    )
    expect(container.querySelector('#test_icon')).toBeNull()
  })

  it('applies no left margin when iconSize is "none"', () => {
    const { container } = render(
      <PageSubHeading id="test" title="T" iconSize="none" />,
    )
    const inner = container.querySelector('div > div > div') as HTMLElement
    expect(inner.style.marginLeft).toBe('0px')
  })

  it('applies large left margin when iconSize is "large"', () => {
    const { container } = render(
      <PageSubHeading id="test" title="T" iconSize="large" />,
    )
    const inner = container.querySelector('div > div > div') as HTMLElement
    expect(inner.style.marginLeft).toBe('55px')
  })

  it('applies medium left margin when iconSize is "medium" or omitted', () => {
    const { container: c1 } = render(<PageSubHeading id="test" title="T" iconSize="medium" />)
    const { container: c2 } = render(<PageSubHeading id="test" title="T" />)
    expect((c1.querySelector('div > div > div') as HTMLElement).style.marginLeft).toBe('45px')
    expect((c2.querySelector('div > div > div') as HTMLElement).style.marginLeft).toBe('45px')
  })
})
