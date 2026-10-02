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
  it('renders its figures under a labelled heading, marked busy while a new range loads', () => {
    render(<AnalyticsSection {...baseProps} isRefreshing><p>Figures</p></AnalyticsSection>)

    expect(screen.getByRole('region', { name: 'Decision funnel' })).toBeInTheDocument()
    expect(screen.getByText('Figures').closest('[aria-busy="true"]')).not.toBeNull()
  })

  it('shows the empty text instead of the figures, keeping caveats visible', () => {
    render(<AnalyticsSection {...baseProps} isEmpty caveats={['Read live before May 2026.']}><p>Figures</p></AnalyticsSection>)

    expect(screen.getByText('Nothing here.')).toBeInTheDocument()
    expect(screen.getByText('Read live before May 2026.')).toBeInTheDocument()
    expect(screen.queryByText('Figures')).not.toBeInTheDocument()
  })

  it('shows the error consent sent', () => {
    render(<AnalyticsSection {...baseProps} error={{ message: 'to must not be before from', code: 400 }}><p>Figures</p></AnalyticsSection>)

    expect(screen.getByRole('alert')).toHaveTextContent('to must not be before from')
  })
})
