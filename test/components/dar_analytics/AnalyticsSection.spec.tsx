import React from 'react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'

const baseProps = {
  title: 'Decision funnel',
  isLoading: false,
  isEmpty: false,
  emptyText: 'Nothing here.',
}

describe('AnalyticsSection', () => {
  it('renders its figures under a labelled heading', () => {
    render(<AnalyticsSection {...baseProps}><p>Figures</p></AnalyticsSection>)

    expect(screen.getByRole('region', { name: 'Decision funnel' })).toBeInTheDocument()
    expect(screen.getByText('Figures')).toBeInTheDocument()
  })

  it('shows the empty text instead of the figures', () => {
    render(<AnalyticsSection {...baseProps} isEmpty><p>Figures</p></AnalyticsSection>)

    expect(screen.getByText('Nothing here.')).toBeInTheDocument()
    expect(screen.queryByText('Figures')).not.toBeInTheDocument()
  })

  it('shows a loading indicator while loading', () => {
    render(<AnalyticsSection {...baseProps} isLoading><p>Figures</p></AnalyticsSection>)

    expect(screen.getByLabelText('Loading Decision funnel')).toBeInTheDocument()
    expect(screen.queryByText('Figures')).not.toBeInTheDocument()
  })

  it('shows the error consent sent', () => {
    render(
      <AnalyticsSection {...baseProps} error={{ message: 'to must not be before from', code: 400 }}>
        <p>Figures</p>
      </AnalyticsSection>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('to must not be before from')
  })

  it('keeps showing the figures, marked busy, while a new range loads', () => {
    render(<AnalyticsSection {...baseProps} isRefreshing><p>Figures</p></AnalyticsSection>)

    expect(screen.getByText('Figures').parentElement).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps caveats visible when the section is empty', () => {
    render(
      <AnalyticsSection {...baseProps} isEmpty caveats={['Institution is read live before May 2026.']}>
        <p>Figures</p>
      </AnalyticsSection>,
    )

    expect(screen.getByText('Institution is read live before May 2026.')).toBeInTheDocument()
  })
})
