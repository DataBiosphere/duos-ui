import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import DarCollectionAdminReviewLink from 'src/components/dar_collection_table/DarCollectionAdminReviewLink'

const darCollectionId = 42
const darCode = 'DAR-42'

function renderLink(overrides: { darCollectionId?: number, darCode?: string } = {}) {
  return render(
    <MemoryRouter>
      <DarCollectionAdminReviewLink
        darCollectionId={darCollectionId}
        darCode={darCode}
        {...overrides}
      />
    </MemoryRouter>,
  )
}

describe('DarCollectionAdminReviewLink', () => {
  it('renders the dar code as link text', () => {
    renderLink()
    expect(screen.getByText(darCode)).toBeInTheDocument()
  })

  it('links to the admin review collection page', () => {
    renderLink()
    expect(screen.getByRole('link', { name: darCode })).toHaveAttribute('href', `/admin_review_collection/${darCollectionId}`)
  })

  it('sets the correct id on the link', () => {
    const { container } = renderLink()
    expect(container.querySelector(`[id="/collection-review-${darCollectionId}"]`)).not.toBeNull()
  })
})
