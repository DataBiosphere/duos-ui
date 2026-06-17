import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeading } from 'src/components/PageHeading'

describe('PageHeading', () => {
  it('renders title and description', () => {
    const { container } = render(
      <PageHeading id="test" title="My Title" description="My Description" />,
    )
    expect(container.querySelector('#test_heading')).not.toBeNull()
    expect(screen.getByText('My Title')).toBeTruthy()
    expect(screen.getByText('My Description')).toBeTruthy()
  })

  it('does not render an icon when imgSrc is not provided', () => {
    const { container } = render(
      <PageHeading id="test" title="No Icon" />,
    )
    expect(container.querySelector('#test_icon')).toBeNull()
  })

  it('renders an icon when imgSrc is provided', () => {
    const { container } = render(
      <PageHeading id="test" title="With Icon" imgSrc="/logo.png" />,
    )
    const icon = container.querySelector('#test_icon') as HTMLImageElement
    expect(icon).not.toBeNull()
    expect(icon.getAttribute('src')).toBe('/logo.png')
    expect(icon.getAttribute('alt')).toBe('With Icon')
  })

  it('applies the color class to the title', () => {
    const { container } = render(
      <PageHeading id="test" title="Colored" color="common" />,
    )
    const title = container.querySelector('#test_title')
    expect(title).not.toBeNull()
    expect(title!.classList.contains('common-color')).toBe(true)
  })

  it('applies medium margin by default', () => {
    const { container } = render(
      <PageHeading id="test" title="Default Margin" />,
    )
    const heading = container.querySelector('#test_heading')
    expect(heading).not.toBeNull()
    const inner = heading!.querySelector('div') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.style.marginLeft).toBe('55px')
  })

  it('applies large margin when iconSize is large', () => {
    const { container } = render(
      <PageHeading id="test" title="Large Margin" iconSize="large" />,
    )
    const heading = container.querySelector('#test_heading')
    expect(heading).not.toBeNull()
    const inner = heading!.querySelector('div') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.style.marginLeft).toBe('70px')
  })

  it('applies no margin when iconSize is none', () => {
    const { container } = render(
      <PageHeading id="test" title="No Margin" iconSize="none" />,
    )
    const heading = container.querySelector('#test_heading')
    expect(heading).not.toBeNull()
    const inner = heading!.querySelector('div') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.style.marginLeft).toBe('0px')
  })

  it('uses custom descriptionStyle when provided', () => {
    const customStyle = { color: 'rgb(255, 0, 0)', fontSize: '24px' }
    const { container } = render(
      <PageHeading
        id="test"
        title="Custom Style"
        description="Styled"
        descriptionStyle={customStyle}
      />,
    )
    const description = container.querySelector('#test_description') as HTMLElement
    expect(description).not.toBeNull()
    expect(description.style.color).toBe('rgb(255, 0, 0)')
    expect(description.style.fontSize).toBe('24px')
  })

  it('uses default description style when descriptionStyle is not provided', () => {
    const { container } = render(
      <PageHeading id="test" title="Default Style" description="Default" />,
    )
    const description = container.querySelector('#test_description') as HTMLElement
    expect(description).not.toBeNull()
    expect(description.style.fontSize).toBe('19px')
  })
})
