import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { Card } from 'src/components/showcase/primitives/Card'
import { FeaturedCard } from 'src/components/showcase/primitives/FeaturedCard'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { StructuredPanel } from 'src/components/showcase/primitives/StructuredPanel'
import { datasetCardEntries } from 'src/showcases/datasetCardLabels'
import { DatasetSummarySchema } from 'src/showcases/schema'
import type { DatasetSummaryInput } from 'src/types/showcase'

/** Signed in, with handoffs on, so a handoff link reads as its label alone. */
const SIGNED_IN: ShowcaseHandoffs = { enabled: true, signedIn: true }

const renderInRouter = (ui: React.ReactElement, handoffs = SIGNED_IN) => render(
  <MemoryRouter>
    <ShowcaseHandoffsContext.Provider value={handoffs}>{ui}</ShowcaseHandoffsContext.Provider>
  </MemoryRouter>,
)

const controlledCohort: DatasetSummaryInput = {
  identifier: 'DUOS-000790',
  title: 'Example Follow-up Cohort',
  accessManagement: 'controlled',
  dacName: 'Example DAC',
  consentCodes: ['GRU'],
  participantCount: null,
  availableDate: '2026-10-05',
  accessUrl: null,
}

describe('Card', () => {
  it('renders the title as an h3 by default and at the level the caller passes', () => {
    const { rerender } = renderInRouter(<Card title="Example Cohort" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Example Cohort' })).toBeInTheDocument()
    rerender(<MemoryRouter><Card title="Example Cohort" headingLevel={4} /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 4, name: 'Example Cohort' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Example Cohort' })).toHaveAttribute('data-variant', 'default')
  })

  it('carries the dataset card fields and leaves out entries with no value', () => {
    renderInRouter(
      <Card
        title={controlledCohort.title}
        metadata={[...datasetCardEntries(DatasetSummarySchema.parse(controlledCohort)), { label: 'Notes', value: '  ' }, { label: 'Size', value: undefined }]}
      />,
    )
    const terms = screen.getAllByRole('term').map(term => term.textContent)
    expect(terms).toEqual(['DUOS ID', 'Access', 'DAC', 'Data use', 'Available in DUOS'])
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByText('DUOS-000790')).toBeInTheDocument()
  })

  it('renders no list when every entry is missing', () => {
    const { container } = renderInRouter(<Card title="Example Cohort" metadata={[{ label: 'Participants', value: null }]} />)
    expect(container.querySelector('dl')).toBeNull()
  })

  it('names each action by its label and describes it with the title', () => {
    renderInRouter(<Card title="Example Cohort" actions={[{ label: 'Request access', href: '/datalibrary' }]} />)
    const link = screen.getByRole('link', { name: 'Request access' })
    expect(link).toHaveAttribute('href', '/datalibrary')
    expect(link).toHaveAccessibleDescription('Example Cohort')
  })

  it('opens external https links in the same tab and drops links that break the URL policy', () => {
    renderInRouter(
      <Card
        title="Example Cohort"
        actions={[
          { label: 'Provider site', href: 'https://example.org/cohort' },
          { label: 'Script', href: 'javascript:alert(1)' },
          { label: 'Plain http', href: 'http://example.org' },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: 'Provider site' })
    expect(link).toHaveAttribute('href', 'https://example.org/cohort')
    expect(link).not.toHaveAttribute('target')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('keeps links in the body and metadata reachable alongside the action', () => {
    renderInRouter(
      <Card
        title="Example Cohort"
        metadata={[{ label: 'Provider site', value: 'example.org', href: 'https://example.org' }]}
        actions={[{ label: 'View dataset', href: '/datalibrary' }]}
      >
        <p>Read the <a href="https://example.org/paper">cohort paper</a>.</p>
      </Card>,
    )
    expect(screen.getByRole('link', { name: 'cohort paper' })).toHaveAttribute('href', 'https://example.org/paper')
    expect(screen.getByRole('link', { name: 'example.org' })).toHaveAttribute('href', 'https://example.org')
    expect(screen.getByRole('link', { name: 'View dataset' })).toBeInTheDocument()
  })

  it('renders badges and media with the alt text and loading the caller passes', () => {
    renderInRouter(<Card title="Example Cohort" badges={['New in DUOS']} media={{ src: '/images/cohort.png', alt: 'Cohort map', loading: 'eager' }} />)
    expect(within(screen.getByRole('list')).getByText('New in DUOS')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cohort map' })).toHaveAttribute('loading', 'eager')
  })

  it('leaves out media whose source breaks the URL policy', () => {
    renderInRouter(<Card title="Example Cohort" media={{ src: 'http://example.org/a.png', alt: 'Cohort map' }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders a small bundled image that the build inlines as a data URL', () => {
    renderInRouter(<Card title="Example Cohort" media={{ src: 'data:image/svg+xml,%3Csvg%2F%3E', alt: 'Cohort map' }} />)
    expect(screen.getByRole('img', { name: 'Cohort map' })).toBeInTheDocument()
  })

  it('refuses a data URL that is not an inlined image type or holds a control character', () => {
    renderInRouter(<Card title="Example Cohort" media={{ src: 'data:image/x-unknown,abc', alt: 'Odd type' }} />)
    renderInRouter(<Card title="Example Cohort" media={{ src: 'data:image/png;base64,iVBO\u0000RK', alt: 'Control' }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders repeated badges and labels without duplicate-key warnings, and no empty body', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = renderInRouter(
      <Card title="Example Cohort" badges={['New', 'New']} metadata={[{ label: 'DAC', value: 'A' }, { label: 'DAC', value: 'B' }]}>
        {false}
      </Card>,
    )
    expect(screen.getAllByText('New')).toHaveLength(2)
    expect(error).not.toHaveBeenCalled()
    expect(container.querySelector('.showcase-card__body > div')).toBeNull()
    error.mockRestore()
  })
})

describe('FeaturedCard', () => {
  it('renders the featured variant of the card', () => {
    renderInRouter(<FeaturedCard title="Example App" headingLevel={3} actions={[{ label: 'Open app', href: 'https://example.org/app' }]} />)
    expect(screen.getByRole('article', { name: 'Example App' })).toHaveAttribute('data-variant', 'featured')
    expect(screen.getByRole('heading', { level: 3, name: 'Example App' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open app' })).toHaveAccessibleDescription('Example App')
  })
})

describe('StructuredPanel', () => {
  it('renders a named section with an h2 by default, its body and its actions', () => {
    renderInRouter(
      <StructuredPanel title="Announcements" actions={[{ label: 'Read more', href: '/datalibrary' }, { label: 'Bad', href: '//evil.example' }]}>
        <p>New data is available.</p>
      </StructuredPanel>,
    )
    const panel = screen.getByRole('region', { name: 'Announcements' })
    expect(within(panel).getByRole('heading', { level: 2, name: 'Announcements' })).toBeInTheDocument()
    expect(within(panel).getByText('New data is available.')).toBeInTheDocument()
    expect(within(panel).getAllByRole('link')).toHaveLength(1)
  })

  it('renders the heading at the level the caller passes', () => {
    renderInRouter(<StructuredPanel title="Get started" headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Get started' })).toBeInTheDocument()
  })
})

describe('ShowcaseLink handoffs (S3.2)', () => {
  it('labels a signed-in destination for a visitor who is not signed in', () => {
    renderInRouter(<ShowcaseLink href="/datalibrary?query=heart">Search</ShowcaseLink>, { enabled: true, signedIn: false })
    expect(screen.getByRole('link', { name: 'Search (Sign-in required)' })).toHaveAttribute('href', '/datalibrary?query=heart')
  })

  it('drops the label once the visitor is signed in', () => {
    renderInRouter(<ShowcaseLink href="/dataset/DUOS-000790">View dataset</ShowcaseLink>)
    expect(screen.getByRole('link', { name: 'View dataset' })).toHaveAttribute('href', '/dataset/DUOS-000790')
  })

  it.each(['/data', '/showcase/example-partner', '/privacy', '/', '/tos'])('opens the public path %s without a sign-in label', (href) => {
    renderInRouter(<ShowcaseLink href={href}>Public page</ShowcaseLink>, { enabled: true, signedIn: false })
    expect(screen.getByRole('link', { name: 'Public page' })).toHaveAttribute('href', href)
  })

  it('treats an internal path missing from the public list as signed-in', () => {
    renderInRouter(<ShowcaseLink href="/some_new_page">New page</ShowcaseLink>, { enabled: true, signedIn: false })
    expect(screen.getByRole('link', { name: 'New page (Sign-in required)' })).toBeInTheDocument()
  })

  describe('in a production-data preview', () => {
    const PREVIEW: ShowcaseHandoffs = { enabled: false, signedIn: true }

    it.each(['/datalibrary?query=heart', '/dataset/DUOS-000790', '/dar_application/abc'])('renders %s as text, not a link', (href) => {
      const { container } = renderInRouter(<ShowcaseLink href={href}>Handoff</ShowcaseLink>, PREVIEW)
      expect(screen.queryByRole('link')).toBeNull()
      expect(container.querySelector('a')).toBeNull()
      expect(container).toHaveTextContent('Handoff (not available in this preview)')
    })

    it('never links a production identifier to this environment, even when it names a dataset here too', () => {
      // DUOS-000790 is a production identifier; this environment's own DUOS-000790 is another
      // dataset. The preview renders no href that could open it.
      const { container } = renderInRouter(<Card title="Example Cohort" actions={[{ label: 'Request access', href: '/dataset/DUOS-000790' }]} />, PREVIEW)
      expect(container.querySelector('[href*="DUOS-000790"]')).toBeNull()
    })

    it('still opens public pages and external links', () => {
      renderInRouter(
        <>
          <ShowcaseLink href="/data">Flagship</ShowcaseLink>
          <ShowcaseLink href="https://example.org">Provider</ShowcaseLink>
        </>,
        PREVIEW,
      )
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })
  })

  it('turns handoffs off when no provider says otherwise', () => {
    const { container } = render(<MemoryRouter><ShowcaseLink href="/datalibrary">Search</ShowcaseLink></MemoryRouter>)
    expect(container.querySelector('a')).toBeNull()
  })
})
