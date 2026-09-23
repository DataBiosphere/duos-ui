import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import StudyAssetCountBadges from 'src/components/study_details/StudyAssetCountBadges'

describe('StudyAssetCountBadges', () => {
  /** Every badge read "1 Datasets" before the caller supplied both forms. */
  it('uses the singular for a count of one', () => {
    render(<StudyAssetCountBadges counts={[{ singular: 'Dataset', plural: 'Datasets', count: 1 }]} />)

    expect(screen.getByText('1 Dataset')).toBeInTheDocument()
    expect(screen.queryByText('1 Datasets')).not.toBeInTheDocument()
  })

  it('uses the plural for anything else', () => {
    render(<StudyAssetCountBadges counts={[{ singular: 'Model', plural: 'Models', count: 4 }]} />)

    expect(screen.getByText('4 Models')).toBeInTheDocument()
  })

  /** A section with nothing in it is not worth a badge saying so. */
  it('omits a badge with a count of zero', () => {
    render(
      <StudyAssetCountBadges
        counts={[
          { singular: 'Dataset', plural: 'Datasets', count: 2 },
          { singular: 'Workspace', plural: 'Workspaces', count: 0 },
        ]}
      />,
    )

    expect(screen.getByText('2 Datasets')).toBeInTheDocument()
    expect(screen.queryByText(/Workspace/)).not.toBeInTheDocument()
  })

  it('renders nothing at all when every count is zero', () => {
    const { container } = render(
      <StudyAssetCountBadges counts={[{ singular: 'Dataset', plural: 'Datasets', count: 0 }]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
