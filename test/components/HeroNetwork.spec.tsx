import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HeroNetwork } from 'src/components/HeroNetwork'

const renderNetwork = (animated: boolean, paused: boolean) => {
  const { container } = render(<HeroNetwork animated={animated} paused={paused} />)
  return container.querySelector('svg')!
}

const motionStyles = (svg: SVGSVGElement, selector = '.drift, .morph') =>
  [...svg.querySelectorAll(selector)].map(el => getComputedStyle(el))

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

  it('animates every cluster and dot while animated', () => {
    const styles = motionStyles(renderNetwork(true, false))
    expect(styles.length).toBeGreaterThan(0)
    styles.forEach((style) => {
      expect(style.animationName).toMatch(/^animation-/)
      expect(style.animationIterationCount).toBe('infinite')
      expect(style.animationDirection).toBe('alternate')
      expect(style.animationPlayState).toBe('running')
    })
  })

  it('slowly reshapes every cluster', () => {
    const svg = renderNetwork(true, false)
    const morphs = [...svg.querySelectorAll('.morph')]
    expect(morphs.length).toBe(svg.querySelectorAll('g.drift').length)
    morphs.forEach((el) => {
      expect(getComputedStyle(el).animationName).not.toBe(getComputedStyle(el.parentElement!).animationName)
      expect((el as SVGGElement).style.getPropertyValue('--skew')).toMatch(/deg$/)
    })
  })

  it('softens only the foreground clusters', () => {
    const svg = renderNetwork(true, false)
    expect(svg.querySelector('#hero-network-soften feGaussianBlur')).toHaveAttribute('stdDeviation', '0.8')
    const blurred = svg.querySelectorAll('g.drift[filter="url(#hero-network-soften)"]')
    expect(blurred.length).toBeGreaterThan(0)
    expect(blurred.length).toBeLessThan(svg.querySelectorAll('g.drift').length)
  })

  it('holds still when paused', () => {
    motionStyles(renderNetwork(true, true)).forEach(style => expect(style.animationPlayState).toBe('paused'))
  })

  it('draws a still frame when not animated', () => {
    motionStyles(renderNetwork(false, true)).forEach(style => expect(style.animationName).toBe('none'))
  })
})
