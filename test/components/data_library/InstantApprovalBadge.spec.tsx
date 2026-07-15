import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InstantApprovalBadge } from 'src/components/data_library/InstantApprovalBadge'

describe('InstantApprovalBadge', () => {
  it('renders the label and bolt icon', () => {
    const { container } = render(<InstantApprovalBadge />)

    expect(screen.getByText('Instant approval eligible')).toBeInTheDocument()
    expect(container.querySelector('svg[data-testid="BoltIcon"]')).toBeInTheDocument()
  })

  it('shows an explanatory tooltip on hover', async () => {
    render(<InstantApprovalBadge />)

    fireEvent.mouseOver(screen.getByText('Instant approval eligible'))

    expect(await screen.findByText(/eligible for automatic, instant access approvals/)).toBeInTheDocument()
  })
})
