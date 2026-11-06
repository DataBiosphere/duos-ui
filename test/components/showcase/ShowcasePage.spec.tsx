import React, { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { loadShowcase, type ShowcasePageResult } from 'src/components/showcase/loadShowcase'
import { ShowcasePage } from 'src/components/showcase/ShowcasePage'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { RegistryEntry } from 'src/types/showcase'

vi.mock('src/components/showcase/loadShowcase', () => ({ loadShowcase: vi.fn() }))
vi.mock('src/pages/NotFound', () => ({ default: () => <div>Not found</div> }))
vi.mock('src/hooks/useSession', () => ({ useUserIsLogged: vi.fn(() => false) }))

const partner: RegistryEntry = { key: 'example-partner', title: 'Example Partner Data', status: 'live', flagship: false, order: 1 }

const config = ShowcaseConfigSchema.parse(resolveShowcase({
  sections: {
    hero: { enabled: true, subtitle: 'Explore Example Partner data', intro: 'Intro', stats: [], announcements: [], onboarding: [], primaryCtas: [] },
  },
}))

const found: ShowcasePageResult = { status: 'found', entry: partner, config, handoffsEnabled: true }

let navigate: ReturnType<typeof useNavigate>
const keepNavigate = (next: ReturnType<typeof useNavigate>) => {
  navigate = next
}
const NavigateSpy = ({ onNavigate }: { onNavigate: typeof keepNavigate }) => {
  const next = useNavigate()
  useEffect(() => onNavigate(next), [next, onNavigate])
  return null
}

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <NavigateSpy onNavigate={keepNavigate} />
    <Routes>
      <Route path="/data" element={<ShowcasePage route="flagship" />} />
      <Route path="/showcase/:key" element={<ShowcasePage route="key" />} />
      <Route path="/elsewhere" element={<div>Elsewhere</div>} />
    </Routes>
  </MemoryRouter>,
)

const description = () => document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content

describe('ShowcasePage', () => {
  beforeEach(() => {
    document.title = 'DUOS'
  })

  afterEach(() => {
    vi.mocked(loadShowcase).mockReset()
  })

  it('renders a found showcase with its title and description', async () => {
    vi.mocked(loadShowcase).mockResolvedValue(found)
    renderAt('/showcase/example-partner')
    expect(await screen.findByRole('heading', { level: 1, name: 'Example Partner Data' })).toBeInTheDocument()
    expect(loadShowcase).toHaveBeenCalledWith({ route: 'key', key: 'example-partner' })
    await waitFor(() => {
      expect(document.title).toBe('Example Partner Data | DUOS')
      expect(description()).toBe('Explore Example Partner data')
    })
  })

  it('shows the preview notice when the environment binding turns handoffs off', async () => {
    vi.mocked(loadShowcase).mockResolvedValue({ ...found, handoffsEnabled: false })
    renderAt('/showcase/example-partner')
    expect(await screen.findByRole('note')).toHaveTextContent('content preview with production data')
  })

  it('shows no preview notice when handoffs open', async () => {
    vi.mocked(loadShowcase).mockResolvedValue(found)
    renderAt('/showcase/example-partner')
    await screen.findByRole('heading', { level: 1, name: 'Example Partner Data' })
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('asks for the flagship at /data', async () => {
    vi.mocked(loadShowcase).mockResolvedValue(found)
    renderAt('/data')
    await screen.findByRole('heading', { level: 1 })
    expect(loadShowcase).toHaveBeenCalledWith({ route: 'flagship' })
  })

  it('renders the not-found page for a key the loader refuses', async () => {
    vi.mocked(loadShowcase).mockResolvedValue({ status: 'not-found' })
    renderAt('/showcase/hidden-partner')
    expect(await screen.findByText('Not found')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe('DUOS')
      expect(description()).toBeUndefined()
    })
  })

  it('resets the title and description on leaving the page', async () => {
    vi.mocked(loadShowcase).mockResolvedValue(found)
    renderAt('/showcase/example-partner')
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(document.title).toBe('Example Partner Data | DUOS'))
    navigate('/elsewhere')
    expect(await screen.findByText('Elsewhere')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe('DUOS')
      expect(description()).toBeUndefined()
    })
  })

  it('drops the title and description when the next key is refused', async () => {
    vi.mocked(loadShowcase).mockResolvedValueOnce(found).mockResolvedValueOnce({ status: 'not-found' })
    renderAt('/showcase/example-partner')
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(document.title).toBe('Example Partner Data | DUOS'))
    navigate('/showcase/hidden-partner')
    expect(await screen.findByText('Not found')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe('DUOS')
      expect(description()).toBeUndefined()
    })
  })

  it('loads again when the key changes, and ignores the earlier answer', async () => {
    let answerFirst: (result: ShowcasePageResult) => void = () => {}
    vi.mocked(loadShowcase)
      .mockReturnValueOnce(new Promise((resolve) => { answerFirst = resolve }))
      .mockResolvedValueOnce({ status: 'not-found' })
    renderAt('/showcase/example-partner')
    navigate('/showcase/other-partner')
    expect(await screen.findByText('Not found')).toBeInTheDocument()
    await act(async () => answerFirst(found))
    // Without the guard, the earlier answer would replace this one and leave a blank page.
    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Example Partner Data' })).not.toBeInTheDocument()
    expect(loadShowcase).toHaveBeenLastCalledWith({ route: 'key', key: 'other-partner' })
  })
})
