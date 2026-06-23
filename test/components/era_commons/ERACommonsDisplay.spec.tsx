import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ERACommonsDisplay } from 'src/components/era_commons/ERACommonsDisplay'

describe('ERA Commons Display - Component Tests', () => {
  it('renders the component correctly when an eRA Commons Id is passed', () => {
    render(<ERACommonsDisplay eraCommonsId="scoobydoo" />)
    expect(screen.getByText('scoobydoo')).toBeInTheDocument()
  })

  it('renders the component correctly when undefined is passed.', () => {
    render(<ERACommonsDisplay eraCommonsId={undefined} />)
    expect(screen.getByText('(not recorded at time of submission)')).toBeInTheDocument()
  })
})
