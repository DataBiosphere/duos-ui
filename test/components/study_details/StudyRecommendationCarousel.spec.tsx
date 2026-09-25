import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import StudyRecommendationCarousel from 'src/components/study_details/StudyRecommendationCarousel'
import { StudyAggregation } from 'src/types/library'

vi.mock('src/components/study_details/StudyPageSection', () => ({
  default: ({ heading, children }: { heading: string, children: React.ReactNode }) => (
    <section><h2>{heading}</h2>{children}</section>
  ),
}))

const recommendation = (studyId: number, overrides: Partial<StudyAggregation> = {}): StudyAggregation => ({
  studyId,
  studyName: `Study ${studyId}`,
  studyDescription: `Description ${studyId}`,
  piName: `PI ${studyId}`,
  species: 'Human',
  phenotype: `Phenotype ${studyId}`,
  dataCustodianEmail: [],
  dataTypes: ['RNA-Seq'],
  dataUseCodes: ['HMB'],
  accessTypes: ['controlled'],
  datasetCount: 2,
  totalParticipants: 1200,
  datasetIds: [101, 102],
  modelCount: 0,
  workspaceCount: 0,
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
  it('renders a Studies-tab card per recommendation', () => {
    const { container } = mount({ studies: [recommendation(1), recommendation(2)] })

    expect(container.querySelectorAll('[data-cy="study-card"]')).toHaveLength(2)
    expect(screen.getByText('Study 1')).toBeInTheDocument()
    expect(screen.getByText('PI: PI 1')).toBeInTheDocument()
    expect(screen.getByText('Phenotype: Phenotype 1')).toBeInTheDocument()
    expect(screen.getAllByText('1,200')).toHaveLength(2)
    expect(screen.getByText('Study 2')).toBeInTheDocument()
  })

  /** The study page has no selection a recommended study's datasets could join. */
  it('renders the cards without a selection checkbox', () => {
    mount({ studies: [recommendation(1)] })

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('keeps the order it is given', () => {
    mount({ studies: [recommendation(9), recommendation(3)] })

    expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual(['Study 9', 'Study 3'])
  })

  /**
   * A link rather than a button that navigates imperatively, so open-in-new-tab, copy link
   * address and middle click all work. Asserting the href is what pins that.
   */
  it('links each card to its study', () => {
    mount({ studies: [recommendation(7)] })

    const link = screen.getByRole('link', { name: /Study 7/ })
    expect(link).toHaveAttribute('href', '/studies/7')
  })

  /** An absent section on a study page reads as a failure to load, so it stays and says so. */
  it('stays on the page when there is nothing to recommend', () => {
    mount({ studies: [] })

    expect(screen.getByText('Recommended Studies')).toBeInTheDocument()
    expect(screen.getByText('No study recommendations yet.')).toBeInTheDocument()
  })

  it('reports a failed fetch in place', () => {
    // Nothing loaded at all - an absent list, not an empty one
    mount({ error: new Error('boom') })

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load study recommendations.')
    expect(screen.queryByText('No study recommendations yet.')).not.toBeInTheDocument()
  })

  /**
   * React Query keeps the last good data while reporting a failed background refetch, so both
   * arrive together. Passing the error through regardless discarded cards that were on screen and
   * correct - and contradicted what isPending is documented to buy.
   */
  it('keeps cached cards when a background refetch fails', () => {
    mount({ studies: [recommendation(7)], error: new Error('refresh failed') })

    expect(screen.getByText('Study 7')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Unable to load study recommendations.')).not.toBeInTheDocument()
  })

  /**
   * A study with no recommendations has loaded successfully. Keying the error on list length
   * conflated that with nothing having loaded, so a failed background refetch turned "none yet"
   * into an error banner.
   */
  it('keeps the empty message when a refetch fails after loading nothing', () => {
    mount({ studies: [], error: new Error('refresh failed') })

    expect(screen.getByText('No study recommendations yet.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a spinner only until the first response lands', () => {
    const { container } = mount({ isPending: true })

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })
})
