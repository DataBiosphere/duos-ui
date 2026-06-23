import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import LibraryCard from 'src/pages/user_profile/LibraryCard'

describe('LibraryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Yes", the issued-on date, and the issued-by name', () => {
    render(<LibraryCard issuedOn="2024-01-15" issuedBy="Jane SO" />)

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Issued on: 2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('Issued by: Jane SO')).toBeInTheDocument()
  })

  it('renders different prop values correctly', () => {
    render(<LibraryCard issuedOn="2025-06-23" issuedBy="John Admin" />)

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Issued on: 2025-06-23')).toBeInTheDocument()
    expect(screen.getByText('Issued by: John Admin')).toBeInTheDocument()
  })

  it('renders empty string props without crashing', () => {
    render(<LibraryCard issuedOn="" issuedBy="" />)

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText(/Issued on:/)).toBeInTheDocument()
    expect(screen.getByText(/Issued by:/)).toBeInTheDocument()
  })
})
