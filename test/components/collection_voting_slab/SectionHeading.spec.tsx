import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionHeading from 'src/components/collection_voting_slab/SectionHeading'

describe('SectionHeading', () => {
  it('renders the heading text', () => {
    render(<SectionHeading isLoading={false} datasetCount={5} />)
    expect(screen.getByText('Datasets Requested')).toBeInTheDocument()
  })

  it('shows the dataset count when not loading', () => {
    render(<SectionHeading isLoading={false} datasetCount={7} />)
    expect(screen.getByText('(7)')).toBeInTheDocument()
  })

  it('does not show the dataset count when loading', () => {
    render(<SectionHeading isLoading={true} datasetCount={3} />)
    expect(document.querySelector('[data-cy="dataset-count"]')).toBeNull()
  })
})
