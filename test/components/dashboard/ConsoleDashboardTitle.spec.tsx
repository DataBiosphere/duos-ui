import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ConsoleDashboardTitle from 'src/components/dashboard/ConsoleDashboardTitle'

describe('ConsoleDashboardTitle', () => {
  it('renders its children as the page level one heading', () => {
    render(<ConsoleDashboardTitle>Researcher Console</ConsoleDashboardTitle>)

    expect(screen.getByRole('heading', { level: 1, name: 'Researcher Console' })).toBeInTheDocument()
  })

  it('accepts markup rather than only a string', () => {
    render(<ConsoleDashboardTitle><span>Signing Official</span> Console</ConsoleDashboardTitle>)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Signing Official Console')
  })
})
