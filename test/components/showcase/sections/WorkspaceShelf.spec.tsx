import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { type EnabledSection, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { WorkspaceShelf } from 'src/components/showcase/sections/WorkspaceShelf'
import { renderWithRouter } from '../../../test-utils'

const SIGNED_IN: ShowcaseHandoffs = { enabled: true, signedIn: true }

type Workspace = EnabledSection<'featured-workspaces'>['items'][number]

const gwas: Workspace = { id: 'ws-1', name: 'Example GWAS Workspace', description: 'A starter workspace.', tags: ['GWAS'], launchUrl: 'https://example.org/gwas', docsUrl: 'https://example.org/gwas/docs' }
const rna: Workspace = { id: 'ws-2', name: 'Example RNA Workspace', description: 'Another one.', tags: [], launchUrl: 'https://example.org/rna' }

const renderShelf = (items: Workspace[]) => renderWithRouter(
  <ShowcaseHandoffsContext.Provider value={SIGNED_IN}>
    <WorkspaceShelf sectionKey="featured-workspaces" section={{ enabled: true, items }} id="featured-workspaces" title="Workspaces" />
  </ShowcaseHandoffsContext.Provider>,
)

describe('WorkspaceShelf (S3.4)', () => {
  it('is a shelf named by its heading, at the section id', () => {
    const { container } = renderShelf([gwas, rna])
    const region = screen.getByRole('region', { name: 'Workspaces' })
    expect(within(region).getByRole('heading', { level: 2, name: 'Workspaces' })).toBeInTheDocument()
    expect(container.querySelector('#featured-workspaces')).toContainElement(region)
  })

  it('shows one resource card per workspace, in config order, with its links', () => {
    renderShelf([rna, gwas])
    const cards = screen.getAllByRole('article')
    expect(cards.map(card => within(card).getByRole('heading', { level: 3 }).textContent)).toEqual(['Example RNA Workspace', 'Example GWAS Workspace'])
    expect(within(cards[0]).getAllByRole('link').map(link => [link.textContent, link.getAttribute('href')])).toEqual([['Launch', 'https://example.org/rna']])
    expect(within(cards[1]).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(['https://example.org/gwas', 'https://example.org/gwas/docs'])
    cards.forEach(card => expect(card).toHaveAttribute('data-variant', 'default'))
  })

  it('is registered as Workspaces, shown only when it has workspaces', () => {
    const entry = sectionRegistry['featured-workspaces']
    expect(entry?.defaultLabels.title).toBe('Workspaces')
    expect(entry?.navigable).toBe(true)
    expect(entry?.hasRenderableContent({ enabled: true, items: [] })).toBe(false)
    expect(entry?.hasRenderableContent({ enabled: true, items: [gwas] })).toBe(true)
  })
})
