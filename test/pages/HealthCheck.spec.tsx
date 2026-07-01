import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthCheck } from 'src/pages/HealthCheck'

describe('HealthCheck', () => {
  it('renders the health message', () => {
    render(<HealthCheck />)
    expect(screen.getByText('DUOS is healthy!')).toBeInTheDocument()
  })
})
