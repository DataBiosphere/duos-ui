import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { type EnabledSection, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { AnalysisApps } from 'src/components/showcase/sections/AnalysisApps'
import { renderWithRouter } from '../../../test-utils'

const SIGNED_IN: ShowcaseHandoffs = { enabled: true, signedIn: true }

type Apps = EnabledSection<'featured-tools'>
type App = Apps['items'][number]

const notebooks: App = { id: 'tool-1', name: 'Example Notebooks', description: 'Notebooks.', tags: [], launchUrl: 'https://example.org/notebooks', docsUrl: 'https://example.org/notebooks/docs' }
const viewer: App = { id: 'tool-2', name: 'Example Viewer', description: 'A viewer.', tags: [], launchUrl: 'https://example.org/viewer' }
const workflows: App = { id: 'tool-3', name: 'Example Workflows', description: 'Workflows.', tags: [], launchUrl: 'https://example.org/workflows', featured: true }

const renderApps = (items: App[]) => renderWithRouter(
  <ShowcaseHandoffsContext.Provider value={SIGNED_IN}>
    <AnalysisApps sectionKey="featured-tools" section={{ enabled: true, items }} id="featured-tools" title="Analysis Apps" />
  </ShowcaseHandoffsContext.Provider>,
)

const cardNames = () => screen.getAllByRole('article').map(card => within(card).getByRole('heading').textContent)
const featuredCards = () => screen.getAllByRole('article').filter(card => card.getAttribute('data-variant') === 'featured')

describe('AnalysisApps (S3.4)', () => {
  it('is a section named by its heading, at the section id', () => {
    const { container } = renderApps([notebooks, viewer])
    expect(screen.getByRole('region', { name: 'Analysis Apps' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Analysis Apps' })).toBeInTheDocument()
    expect(container.querySelector('#featured-tools')).toContainElement(screen.getByRole('region'))
  })

  it('puts the featured app first, full width, wherever the config lists it', () => {
    renderApps([notebooks, viewer, workflows])
    expect(cardNames()).toEqual(['Example Workflows', 'Example Notebooks', 'Example Viewer'])
    expect(featuredCards().map(card => within(card).getByRole('heading').textContent)).toEqual(['Example Workflows'])
    expect(featuredCards()[0].closest('li')).toHaveClass('showcase-grid__featured')
  })

  it('puts every app in the grid, in config order, when none is featured', () => {
    renderApps([viewer, notebooks])
    expect(cardNames()).toEqual(['Example Viewer', 'Example Notebooks'])
    expect(featuredCards()).toHaveLength(0)
  })

  it('reaches the featured app\'s links first with the keyboard, then each app\'s in order', async () => {
    const user = userEvent.setup()
    renderApps([notebooks, viewer, workflows])
    const order: string[] = []
    for (let i = 0; i < 4; i++) {
      await user.tab()
      order.push(`${document.activeElement?.textContent} ${document.activeElement?.getAttribute('href')}`)
    }
    expect(order).toEqual([
      'Launch https://example.org/workflows',
      'Launch https://example.org/notebooks',
      'Documentation https://example.org/notebooks/docs',
      'Launch https://example.org/viewer',
    ])
  })

  it('is registered as Analysis Apps, shown only when it has apps', () => {
    const entry = sectionRegistry['featured-tools']
    expect(entry?.defaultLabels.title).toBe('Analysis Apps')
    expect(entry?.navigable).toBe(true)
    expect(entry?.hasRenderableContent({ enabled: true, items: [] })).toBe(false)
    expect(entry?.hasRenderableContent({ enabled: true, items: [viewer] })).toBe(true)
  })
})
