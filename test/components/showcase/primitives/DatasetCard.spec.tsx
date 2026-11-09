import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { DatasetCard, NEW_IN_DUOS_LABEL, OPEN_PROVIDER_LABEL, REQUEST_ACCESS_LABEL } from 'src/components/showcase/primitives/DatasetCard'
import { ShowcaseClockContext } from 'src/components/showcase/showcaseTemplateContract'
import type { Clock } from 'src/showcases/dateWindow'
import { DatasetSummarySchema } from 'src/showcases/schema'
import type { DatasetSummaryInput } from 'src/types/showcase'
import { renderWithRouter } from '../../../test-utils'

const NOV_10: Clock = () => new Date('2026-11-10T12:00:00Z')
const SIGNED_IN: ShowcaseHandoffs = { enabled: true, signedIn: true }

const controlled: DatasetSummaryInput = {
  identifier: 'DUOS-000789',
  title: 'Example Cohort',
  accessManagement: 'controlled',
  dacName: 'Example DAC',
  consentCodes: ['HMB', 'NPU'],
  participantCount: 5400,
  availableDate: '2026-11-01',
  accessUrl: null,
}

const open: DatasetSummaryInput = {
  identifier: 'DUOS-000790',
  title: 'Open Cohort',
  accessManagement: 'open',
  dacName: 'Ignored DAC',
  consentCodes: ['GRU'],
  participantCount: 120,
  availableDate: '2026-01-15',
  accessUrl: 'https://data.example.org/open-cohort',
}

const renderCard = (input: DatasetSummaryInput, handoffs = SIGNED_IN) => renderWithRouter(
  <ShowcaseHandoffsContext.Provider value={handoffs}>
    <ShowcaseClockContext.Provider value={NOV_10}>
      <DatasetCard summary={DatasetSummarySchema.parse(input)} />
    </ShowcaseClockContext.Provider>
  </ShowcaseHandoffsContext.Provider>,
)

const card = () => screen.getByRole('article')
const terms = () => within(card()).queryAllByRole('term').map(term => term.textContent)

describe('DatasetCard (D18)', () => {
  it('titles the card with the dataset title, as a heading', () => {
    renderCard(controlled)
    expect(screen.getByRole('heading', { name: 'Example Cohort' })).toBeInTheDocument()
    expect(card()).toHaveAccessibleName('Example Cohort')
  })

  it('shows the fields in D18 order, with current DAC, consent and participant values', () => {
    renderCard(controlled)
    expect(terms()).toEqual(['DUOS ID', 'Access', 'DAC', 'Data use', 'Participants', 'Available in DUOS'])
    expect(within(card()).getByText('Example DAC')).toBeInTheDocument()
    expect(within(card()).getByText('HMB, NPU')).toBeInTheDocument()
    expect(within(card()).getByText('5,400')).toBeInTheDocument()
  })

  it('leaves out missing fields', () => {
    renderCard({ ...controlled, dacName: null, consentCodes: [], participantCount: null, availableDate: null })
    expect(terms()).toEqual(['DUOS ID', 'Access'])
  })

  it('hides the DAC of an open dataset', () => {
    renderCard(open)
    expect(within(card()).queryByText('Ignored DAC')).toBeNull()
  })
})

describe('DatasetCard "New in DUOS" badge', () => {
  it('shows for a dataset available in the last 30 days', () => {
    renderCard(controlled)
    expect(within(card()).getByText(NEW_IN_DUOS_LABEL)).toBeInTheDocument()
  })

  it.each([
    ['older than 30 days', '2026-10-10'],
    ['with no date', null],
  ] as const)('does not show for a dataset %s', (_, availableDate) => {
    renderCard({ ...controlled, availableDate })
    expect(within(card()).queryByText(NEW_IN_DUOS_LABEL)).toBeNull()
  })
})

describe('DatasetCard action', () => {
  it('requests access to a controlled dataset on its DUOS page', () => {
    renderCard(controlled)
    const link = within(card()).getByRole('link', { name: REQUEST_ACCESS_LABEL })
    expect(link).toHaveAttribute('href', '/dataset/DUOS-000789')
    expect(link).toHaveAccessibleDescription('Example Cohort')
  })

  it('labels the request as needing sign-in for a visitor who is not signed in', () => {
    renderCard(controlled, { enabled: true, signedIn: false })
    expect(within(card()).getByRole('link', { name: `${REQUEST_ACCESS_LABEL} (Sign-in required)` })).toBeInTheDocument()
  })

  it('shows the request as text, not a link, in a production-data preview', () => {
    renderCard(controlled, { enabled: false, signedIn: true })
    expect(within(card()).queryByRole('link')).toBeNull()
    expect(card()).toHaveTextContent(REQUEST_ACCESS_LABEL)
  })

  it('opens the provider page of an open dataset, with one link only', () => {
    renderCard(open)
    const links = within(card()).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName(OPEN_PROVIDER_LABEL)
    expect(links[0]).toHaveAttribute('href', 'https://data.example.org/open-cohort')
    // The provider host stays as a field, as text.
    expect(within(card()).getByText('data.example.org')).toBeInTheDocument()
  })

  it('opens the provider page of an external dataset too', () => {
    renderCard({ ...open, accessManagement: 'external' })
    expect(within(card()).getByRole('link', { name: OPEN_PROVIDER_LABEL })).toBeInTheDocument()
  })

  it.each([
    ['an open dataset with no provider link', { ...open, accessUrl: null }],
    ['a dataset with unknown access management', { ...controlled, accessManagement: null }],
  ])('has no action for %s', (_, input) => {
    renderCard(input)
    expect(within(card()).queryByRole('link')).toBeNull()
  })

  it('follows a change in access management', () => {
    const { unmount } = renderCard(controlled)
    expect(within(card()).getByRole('link', { name: REQUEST_ACCESS_LABEL })).toBeInTheDocument()
    unmount()
    renderCard({ ...controlled, accessManagement: 'open', accessUrl: 'https://data.example.org/now-open' })
    expect(within(card()).queryByRole('link', { name: REQUEST_ACCESS_LABEL })).toBeNull()
    expect(within(card()).getByRole('link', { name: OPEN_PROVIDER_LABEL })).toHaveAttribute('href', 'https://data.example.org/now-open')
    expect(within(card()).queryByText('Example DAC')).toBeNull()
  })
})
