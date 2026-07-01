import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NIHPilotInfo from 'src/pages/NIHPilotInfo'

describe('NIHPilotInfo', () => {
  it('renders the page heading', () => {
    render(<NIHPilotInfo />)
    expect(screen.getByRole('heading', { level: 1, name: 'NIH DUOS Pilot' })).toBeInTheDocument()
  })

  it('renders the Background section heading', () => {
    render(<NIHPilotInfo />)
    expect(screen.getByRole('heading', { level: 3, name: 'Background' })).toBeInTheDocument()
  })

  it('renders the Milestones section heading', () => {
    render(<NIHPilotInfo />)
    expect(screen.getByRole('heading', { level: 3, name: 'Milestones' })).toBeInTheDocument()
  })

  it('renders the Related Information section heading', () => {
    render(<NIHPilotInfo />)
    expect(screen.getByRole('heading', { level: 3, name: 'Related Information' })).toBeInTheDocument()
  })

  it('renders milestone dates', () => {
    render(<NIHPilotInfo />)
    expect(screen.getByText(/Integration of RAS - to begin Q2 2021/)).toBeInTheDocument()
    expect(screen.getByText(/NIH DUOS Pilot Phase II - to begin Q1 2021/)).toBeInTheDocument()
    expect(screen.getByText(/NIH DUOS Pilot Phase I - Completed July 2020/)).toBeInTheDocument()
  })
})
