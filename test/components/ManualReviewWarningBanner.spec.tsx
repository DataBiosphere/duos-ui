import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ManualReviewWarningBanner from 'src/components/ManualReviewWarningBanner'

const bannerSelector = '[data-cy="manual-review-warning-banner"]'

describe('ManualReviewWarningBanner Component', () => {
  it('does not render when no data use term requires manual review', () => {
    const { container } = render(<ManualReviewWarningBanner darInfo={{ hmb: true, methods: true }} />)
    expect(container.querySelector(bannerSelector)).toBeNull()
  })

  it('does not render when darInfo is empty', () => {
    const { container } = render(<ManualReviewWarningBanner darInfo={{}} />)
    expect(container.querySelector(bannerSelector)).toBeNull()
  })

  it('does not render when darInfo is undefined', () => {
    const { container } = render(<ManualReviewWarningBanner />)
    expect(container.querySelector(bannerSelector)).toBeNull()
  })

  it('renders the banner for an AI/LLM request', () => {
    const { container } = render(<ManualReviewWarningBanner darInfo={{ hmb: true, aiLlmUse: true }} />)

    expect(container.querySelector(bannerSelector)).not.toBeNull()
    expect(screen.getByText(/includes a data use term that requires manual review/)).toBeInTheDocument()
    expect(screen.getByText(/Please carefully review this request for compliance and ethical considerations before granting approval/)).toBeInTheDocument()
    expect(screen.getByText(/The research involves the use of Artificial Intelligence \(AI\) or Large Language Models \(LLMs\)/)).toBeInTheDocument()
  })

  it('lists every manual-review term across primary and secondary data uses', () => {
    const { container } = render(
      <ManualReviewWarningBanner
        darInfo={{
          other: true,
          otherText: 'Some other primary purpose',
          methods: true,
          aiLlmUse: true,
          illegalBehavior: true,
          stigmatizedDiseases: true,
          vulnerablePopulation: true,
        }}
      />,
    )

    expect(screen.getByText(/includes 5 data use terms that require manual review/)).toBeInTheDocument()

    const terms = container.querySelector('[data-cy="manual-review-term-list"]') as HTMLElement
    expect(terms).not.toBeNull()
    expect(within(terms).getAllByRole('listitem')).toHaveLength(5)
    expect(terms).toHaveTextContent('Some other primary purpose')
    expect(terms).toHaveTextContent('The research involves the use of Artificial Intelligence (AI) or Large Language Models (LLMs).')
    expect(terms).toHaveTextContent('The dataset will be used for the study of illegal behaviors')
    expect(terms).toHaveTextContent('The dataset will be used for the study of stigmatizing illnesses.')
    expect(terms).toHaveTextContent('The dataset will be used for a study targeting a vulnerable population')
    // Terms that do not require review stay out of the banner.
    expect(terms).not.toHaveTextContent('develop and/or validate new methods')
  })

  it('lists descriptions without the DUO code, which most manual-review terms share', () => {
    const { container } = render(
      <ManualReviewWarningBanner darInfo={{ hmb: true, aiLlmUse: true, stigmatizedDiseases: true }} />,
    )
    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[data-cy="manual-review-term-list"] li'),
    )

    expect(items.map(item => item.textContent)).toEqual([
      'The research involves the use of Artificial Intelligence (AI) or Large Language Models (LLMs).',
      'The dataset will be used for the study of stigmatizing illnesses.',
    ])
  })

  it('renders as a MUI warning alert with an icon', () => {
    const { container } = render(<ManualReviewWarningBanner darInfo={{ hmb: true, aiLlmUse: true }} />)

    const banner = container.querySelector(bannerSelector) as HTMLElement
    expect(banner).not.toBeNull()
    expect(banner).toHaveClass('MuiAlert-root', 'MuiAlert-colorWarning')
    expect(screen.getByRole('alert')).toBe(banner)
    expect(banner.querySelector('.MuiAlert-icon svg')).not.toBeNull()
  })
})
