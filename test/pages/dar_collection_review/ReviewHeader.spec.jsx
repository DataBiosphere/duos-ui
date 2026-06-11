import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ReviewHeader from 'src/pages/dar_collection_review/ReviewHeader'

describe('ReviewHeader - Tests', () => {
  it('Renders the header with no datasets approved', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={[]}
      />,
    )

    expect(screen.getByText('DAR-100')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('No datasets approved')).toBeInTheDocument()
  })

  it('Renders the header with datasets approved', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={['Dataset1', 'Dataset2']}
      />,
    )

    expect(screen.getByText('2 Datasets approved: Dataset1, Dataset2')).toBeInTheDocument()
  })

  it('Renders read-only text in Review Header when readOnly prop is true', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
        approvedDatasets={[]}
      />,
    )

    expect(screen.getByText('Data Access Request Review (read-only)')).toBeInTheDocument()
  })

  it('Does not render read-only text in Review Header when readOnly prop is false', () => {
    render(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={false}
        approvedDatasets={[]}
      />,
    )

    expect(screen.getByText('Data Access Request Review')).toBeInTheDocument()
    expect(screen.queryByText(/read-only/)).not.toBeInTheDocument()
  })
})
