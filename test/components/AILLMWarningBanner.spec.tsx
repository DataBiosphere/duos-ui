import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AILLMWarningBanner from 'src/components/AILLMWarningBanner'

describe('AILLMWarningBanner Component', () => {
  it('should not render when aiLlmUse is false', () => {
    const { container } = render(<AILLMWarningBanner darInfo={{ aiLlmUse: false }} />)
    expect(container.querySelector('[data-cy="ai-llm-warning-banner"]')).toBeNull()
  })

  it('should not render when aiLlmUse is undefined in darInfo', () => {
    const { container } = render(<AILLMWarningBanner darInfo={{}} />)
    expect(container.querySelector('[data-cy="ai-llm-warning-banner"]')).toBeNull()
  })

  it('should not render when darInfo is undefined', () => {
    const { container } = render(<AILLMWarningBanner />)
    expect(container.querySelector('[data-cy="ai-llm-warning-banner"]')).toBeNull()
  })

  it('should render warning banner when aiLlmUse is true', () => {
    const { container } = render(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    expect(container.querySelector('[data-cy="ai-llm-warning-banner"]')).not.toBeNull()
    expect(screen.getByText(/This Data Access Request involves Artificial Intelligence \(AI\) or Large Language Model \(LLM\) research/)).toBeTruthy()
    expect(screen.getByText(/Please carefully review this request for compliance and ethical considerations before granting approval/)).toBeTruthy()
  })

  it('should have proper styling for warning banner', () => {
    const { container } = render(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    const banner = container.querySelector('[data-cy="ai-llm-warning-banner"]') as HTMLElement
    expect(banner).not.toBeNull()
    // TODO: no Vitest equivalent for CSS computed style assertions like cy.get().should('have.css', ...)
    // Inline styles are set directly on the element; check style attribute presence instead
    expect(banner.style.backgroundColor).toBe('rgb(255, 243, 205)')
    expect(banner.style.borderRadius).toBe('8px')
  })

  it('should display warning icon', () => {
    const { container } = render(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    const banner = container.querySelector('[data-cy="ai-llm-warning-banner"]')
    expect(banner).not.toBeNull()
    expect(banner!.querySelector('svg')).not.toBeNull()
  })
})
