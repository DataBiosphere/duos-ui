import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HeroNetwork } from 'src/components/HeroNetwork'

const renderNetwork = (animated: boolean, paused: boolean) => {
  const { container } = render(<HeroNetwork animated={animated} paused={paused} />)
  return container.querySelector('svg')!
}

const driftStyles = (svg: SVGSVGElement) => [...svg.querySelectorAll('.drift')].map(el => getComputedStyle(el))

describe('HeroNetwork', () => {
  it('is decorative, so screen readers and keyboard focus skip it', () => {
    const svg = renderNetwork(true, false)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('fills the header at any width without stretching', () => {
    const svg = renderNetwork(true, false)
    expect(svg).toHaveAttribute('viewBox', '0 0 1440 440')
    expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid slice')
  })

  it('draws the same layout on every render', () => {
    const first = renderNetwork(true, false).innerHTML
    const second = renderNetwork(true, false).innerHTML
    expect(second).toBe(first)
  })

  it('drifts each cluster and dot while animated', () => {
    const styles = driftStyles(renderNetwork(true, false))
    expect(styles.length).toBeGreaterThan(0)
    styles.forEach((style) => {
      expect(style.animation).toMatch(/infinite alternate/)
      expect(style.animationPlayState).toBe('running')
    })
  })

  it('holds still when paused', () => {
    driftStyles(renderNetwork(true, true)).forEach(style => expect(style.animationPlayState).toBe('paused'))
  })

  it('draws a still frame when not animated', () => {
    driftStyles(renderNetwork(false, true)).forEach(style => expect(style.animation).toBe('none'))
  })
})
