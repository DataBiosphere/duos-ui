import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import StudyRecommendationCarousel from 'src/components/study_details/StudyRecommendationCarousel'
import { StudyRecommendation } from 'src/types/model'

vi.mock('src/components/study_details/StudyPageSection', () => ({
  default: ({ heading, children }: { heading: string, children: React.ReactNode }) => (
    <section><h2>{heading}</h2>{children}</section>
  ),
}))

const recommendation = (studyId: number, overrides: Partial<StudyRecommendation> = {}): StudyRecommendation => ({
  studyId,
  studyName: `Study ${studyId}`,
  studyDescription: `Description ${studyId}`,
  piName: `PI ${studyId}`,
  datasetCount: 2,
  datasetIds: [studyId * 10],
  ...overrides,
})

const mount = (props: Partial<React.ComponentProps<typeof StudyRecommendationCarousel>> = {}) =>
  render(
    <MemoryRouter>
      <StudyRecommendationCarousel
        id="similar-studies"
        heading="Recommended Studies"
        isPending={false}
        {...props}
      />
    </MemoryRouter>,
  )

describe('StudyRecommendationCarousel', () => {
  it('renders a card per recommendation with its name, description and PI', () => {
    mount({ recommendations: [recommendation(1), recommendation(2)] })

    expect(screen.getByText('Study 1')).toBeInTheDocument()
    expect(screen.getByText('Description 1')).toBeInTheDocument()
    expect(screen.getByText('PI: PI 1')).toBeInTheDocument()
    expect(screen.getByText('Study 2')).toBeInTheDocument()
  })

  /**
   * A link rather than a button that navigates imperatively, so open-in-new-tab, copy link
   * address and middle click all work. Asserting the href is what pins that.
   */
  it('links each card to its study', () => {
    mount({ recommendations: [recommendation(7)] })

    const link = screen.getByRole('link', { name: /Study 7/ })
    expect(link).toHaveAttribute('href', '/studies/7')
  })

  it('says so when a PI is not recorded rather than leaving the line blank', () => {
    mount({ recommendations: [recommendation(1, { piName: undefined })] })

    expect(screen.getByText('PI: Not provided')).toBeInTheDocument()
  })

  it('omits the description line when there is none', () => {
    mount({ recommendations: [recommendation(1, { studyDescription: undefined })] })

    expect(screen.getByText('Study 1')).toBeInTheDocument()
    expect(screen.queryByText('Description 1')).not.toBeInTheDocument()
  })

  /** An absent section on a study page reads as a failure to load, so it stays and says so. */
  it('stays on the page when there is nothing to recommend', () => {
    mount({ recommendations: [] })

    expect(screen.getByText('Recommended Studies')).toBeInTheDocument()
    expect(screen.getByText('No study recommendations yet.')).toBeInTheDocument()
  })

  it('reports a failed fetch in place', () => {
    mount({ recommendations: [], error: new Error('boom') })

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load study recommendations.')
    expect(screen.queryByText('No study recommendations yet.')).not.toBeInTheDocument()
  })

  /**
   * React Query keeps the last good data while reporting a failed background refetch, so both
   * arrive together. Passing the error through regardless discarded cards that were on screen and
   * correct - and contradicted what isPending is documented to buy.
   */
  it('keeps cached cards when a background refetch fails', () => {
    mount({ recommendations: [recommendation(7)], error: new Error('refresh failed') })

    expect(screen.getByText('Study 7')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Unable to load study recommendations.')).not.toBeInTheDocument()
  })

  it('shows a spinner only until the first response lands', () => {
    const { container } = mount({ isPending: true })

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })
})
