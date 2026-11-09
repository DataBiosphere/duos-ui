import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { DOCUMENTATION_LABEL, LAUNCH_LABEL, ResourceCard, type ResourceItem } from 'src/components/showcase/primitives/ResourceCard'
import { renderWithRouter } from '../../../test-utils'

const SIGNED_IN: ShowcaseHandoffs = { enabled: true, signedIn: true }

const app: ResourceItem = {
  id: 'tool-1',
  name: 'Example Notebooks',
  description: 'Interactive analysis in a hosted notebook.',
  tags: ['analysis', 'Python'],
  launchUrl: 'https://example.org/launch',
  docsUrl: 'https://example.org/docs',
}

const renderCard = (item: ResourceItem, props: { featured?: boolean } = {}) => renderWithRouter(
  <ShowcaseHandoffsContext.Provider value={SIGNED_IN}>
    <ResourceCard item={item} sectionKey="featured-tools" {...props} />
  </ShowcaseHandoffsContext.Provider>,
)

const card = () => screen.getByRole('article')
const links = () => within(card()).queryAllByRole('link')
const mediaFrame = () => card().querySelector('.showcase-card__media-frame')

describe('ResourceCard (S3.4)', () => {
  it('titles the card with the resource name and shows the description and tags', () => {
    renderCard(app)
    expect(screen.getByRole('heading', { level: 3, name: 'Example Notebooks' })).toBeInTheDocument()
    expect(card()).toHaveAccessibleName('Example Notebooks')
    expect(within(card()).getByText('Interactive analysis in a hosted notebook.')).toBeInTheDocument()
    const badges = card().querySelector('.showcase-card__badges') as HTMLElement
    expect(within(badges).getAllByRole('listitem').map(item => item.textContent)).toEqual(['analysis', 'Python'])
  })

  it('links Launch and then Documentation to the configured resources, each described by the name', () => {
    renderCard(app)
    expect(links().map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      [LAUNCH_LABEL, 'https://example.org/launch'],
      [DOCUMENTATION_LABEL, 'https://example.org/docs'],
    ])
    links().forEach(link => expect(link).toHaveAccessibleDescription('Example Notebooks'))
  })

  it('leaves out Documentation when there is no docs URL', () => {
    renderCard({ ...app, docsUrl: undefined })
    expect(links().map(link => link.textContent)).toEqual([LAUNCH_LABEL])
  })

  it('keeps a launch path inside DUOS as a same-origin link', () => {
    renderCard({ ...app, launchUrl: '/datalibrary' })
    expect(within(card()).getByRole('link', { name: LAUNCH_LABEL })).toHaveAttribute('href', '/datalibrary')
  })

  it.each([
    ['a script URL', 'javascript:alert(1)'],
    ['a protocol-relative URL', '//evil.example/launch'],
    ['an http URL', 'http://example.org/launch'],
    ['a link to a section of this page', '#featured-workspaces'],
  ])('drops a launch link that is %s', (_, launchUrl) => {
    // The URL policy and the launch-link guard rule reject these; the cast stands in for a config that got past them.
    renderCard({ ...app, launchUrl: launchUrl as ResourceItem['launchUrl'] })
    expect(links().map(link => link.textContent)).toEqual([DOCUMENTATION_LABEL])
  })

  it('shows a bundled thumbnail with its alt text, loading lazily', () => {
    renderCard({ ...app, thumbnail: { src: 'showcase/e2e-flagship/logo.svg', alt: 'Notebook screenshot' } })
    const image = within(card()).getByRole('img', { name: 'Notebook screenshot' })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(mediaFrame()).toContainElement(image)
    expect(mediaFrame()).not.toHaveAttribute('aria-hidden')
  })

  it.each([
    ['no thumbnail', undefined],
    ['a thumbnail with no alt text that names no bundled image', { src: 'showcase/e2e-flagship/missing.png', alt: ' ' }],
  ])('keeps the media box, hidden and empty, with %s', (_, thumbnail) => {
    renderCard({ ...app, thumbnail })
    expect(mediaFrame()).toHaveAttribute('aria-hidden', 'true')
    expect(mediaFrame()).toBeEmptyDOMElement()
  })

  it('shows the alt text in the media box when the thumbnail names no bundled image', () => {
    renderCard({ ...app, thumbnail: { src: 'showcase/e2e-flagship/missing.png', alt: 'Notebook screenshot' } })
    expect(mediaFrame()).not.toHaveAttribute('aria-hidden')
    expect(mediaFrame()).toHaveTextContent('Notebook screenshot')
    expect(within(card()).queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the featured variant when asked', () => {
    renderCard(app, { featured: true })
    expect(card()).toHaveAttribute('data-variant', 'featured')
  })
})
