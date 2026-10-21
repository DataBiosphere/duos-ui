import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import Home from 'src/pages/Home'

vi.mock('src/libs/libraryVersions', () => ({
  getLibraryVersions: () => ({
    '/datalibrary': {
      title: 'DUOS Data Library',
      featured: true,
      order: 1,
      icon: 'duos-icon.svg',
      query: null,
    },
    'broad': {
      title: 'Broad Data Library',
      featured: true,
      order: 2,
      icon: null,
      query: null,
    },
    'elwazi': {
      title: 'eLwazi Data Library',
      featured: true,
      order: 3,
      icon: 'elwazi-icon.svg',
      query: null,
    },
    'terra': {
      title: 'Terra Data Library',
      featured: false,
      order: 4,
      icon: 'terra-icon.svg',
      query: null,
    },
  }),
}))

vi.mock('src/libs/signInUtils', () => ({
  handleSignIn: vi.fn(),
}))

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: ({ showModal }: { showModal: boolean }) =>
    showModal ? React.createElement('div', { 'data-testid': 'support-modal' }) : null,
}))

vi.mock('src/images/duos_logo.svg', () => ({ default: 'duos_logo.svg' }))
vi.mock('src/images/DUOS_Homepage_diagram.svg', () => ({ default: 'DUOS_Homepage_diagram.svg' }))
vi.mock('src/images/broad_logo_allwhite.png', () => ({ default: 'broad_logo_allwhite.png' }))

const stubReducedMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })))

const renderHome = (isLogged: boolean) =>
  render(
    <MemoryRouter>
      <Home isLogged={isLogged} />
    </MemoryRouter>,
  )

const librariesRegion = () => screen.getByRole('region', { name: 'Search Data Libraries in DUOS' })
const libraryLinks = () => within(librariesRegion()).getAllByRole('link')

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    it('renders the page header', () => {
      renderHome(false)
      expect(screen.getByText('Data Use Oversight System')).toBeInTheDocument()
      expect(screen.getByText('Access data faster.')).toBeInTheDocument()
    })

    it('renders the Data Libraries section', () => {
      renderHome(false)
      expect(screen.getByText(/Search Data Libraries in DUOS/i)).toBeInTheDocument()
      expect(screen.getByText(/Institutions, programs, and studies use curated Data Libraries/i)).toBeInTheDocument()
    })

    it('shows login-required tooltip text for libraries', () => {
      renderHome(false)
      expect(screen.getByTitle('Please login to access DUOS Data Library')).toBeInTheDocument()
      expect(screen.getByTitle('Please login to access Broad Data Library')).toBeInTheDocument()
      expect(screen.getByTitle('Please login to access eLwazi Data Library')).toBeInTheDocument()
    })

    it('calls handleSignIn when a library link is clicked', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      renderHome(false)
      await act(async () => {
        fireEvent.click(libraryLinks()[0])
      })
      expect(handleSignIn).toHaveBeenCalled()
    })

    it('does not render terra (non-featured) library', () => {
      renderHome(false)
      expect(screen.queryByTitle('Please login to access Terra Data Library')).not.toBeInTheDocument()
    })

    it('renders one link per featured library, each wrapping its logo', () => {
      renderHome(false)
      const links = libraryLinks()
      expect(links).toHaveLength(3)
      links.forEach((link) => {
        expect(link.querySelector('.logo-card')).not.toBeNull()
      })
    })

    it('calls handleSignIn with the target library path when a card is clicked', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      renderHome(false)
      await act(async () => {
        fireEvent.click(libraryLinks()[0])
      })
      expect(handleSignIn).toHaveBeenCalledWith('/datalibrary', expect.any(Function))
    })

    it('treats a click on the library label as a click on the card', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      renderHome(false)
      await act(async () => {
        fireEvent.click(within(librariesRegion()).getByText('eLwazi'))
      })
      expect(handleSignIn).toHaveBeenCalledWith('/datalibrary/elwazi', expect.any(Function))
    })

    it('calls handleSignIn for the Data Library when "Sign In to Browse Data" is clicked', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      renderHome(false)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In to Browse Data' }))
      })
      expect(handleSignIn).toHaveBeenCalledWith('/datalibrary', expect.any(Function))
    })
  })

  describe('when user is logged in', () => {
    it('renders the page header', () => {
      renderHome(true)
      expect(screen.getByText('Data Use Oversight System')).toBeInTheDocument()
      expect(screen.getByText('Access data faster.')).toBeInTheDocument()
    })

    it('renders the Data Libraries section', () => {
      renderHome(true)
      expect(screen.getByText(/Search Data Libraries in DUOS/i)).toBeInTheDocument()
      expect(screen.getByText(/Institutions, programs, and studies use curated Data Libraries/i)).toBeInTheDocument()
    })

    it('shows library name as tooltip when logged in', () => {
      renderHome(true)
      expect(screen.getByTitle('DUOS')).toBeInTheDocument()
      expect(screen.getByTitle('Broad')).toBeInTheDocument()
      expect(screen.getByTitle('eLwazi')).toBeInTheDocument()
    })

    it('renders direct navigation links for featured libraries', () => {
      renderHome(true)
      expect(screen.getByRole('link', { name: /DUOS/i })).toHaveAttribute('href', '/datalibrary')
      expect(screen.getByRole('link', { name: /Broad/i })).toHaveAttribute('href', '/datalibrary/broad')
      expect(screen.getByRole('link', { name: /eLwazi/i })).toHaveAttribute('href', '/datalibrary/elwazi')
    })

    it('does not render terra (non-featured) library', () => {
      renderHome(true)
      expect(screen.queryByTitle('Terra')).not.toBeInTheDocument()
    })

    it('renders library links in order', () => {
      renderHome(true)
      expect(libraryLinks().map(link => link.textContent)).toEqual(['DUOS', 'Broad', 'eLwazi'])
    })

    it('applies dark background styling to the Broad card', () => {
      renderHome(true)
      const logoCard = screen.getByRole('link', { name: 'Broad' }).querySelector('.logo-card')
      expect(logoCard).toHaveStyle({ backgroundColor: '#1F3B50', padding: '15px' })
    })

    it('navigates directly without calling handleSignIn when logged in', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Home isLogged={true} />} />
            <Route path="/datalibrary/broad" element={<div>Broad library page</div>} />
          </Routes>
        </MemoryRouter>,
      )
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Broad' }))
      })
      expect(handleSignIn).not.toHaveBeenCalled()
      expect(screen.getByText('Broad library page')).toBeInTheDocument()
    })

    it('renders one card per featured library', () => {
      renderHome(true)
      expect(libraryLinks()).toHaveLength(3)
    })
  })

  describe('content sections', () => {
    it.each([
      'DUOS for DACs',
      'DUOS for Signing Officials',
      'Looking for Data?',
    ])('renders "%s" section', (heading) => {
      renderHome(false)
      expect(screen.getByText(heading)).toBeInTheDocument()
    })

    it('opens contact modal when "Request a Meeting" is clicked', async () => {
      renderHome(false)
      expect(screen.queryByTestId('support-modal')).not.toBeInTheDocument()
      await act(async () => {
        fireEvent.click(screen.getByText('Request a Meeting'))
      })
      expect(screen.getByTestId('support-modal')).toBeInTheDocument()
    })
  })

  describe('page structure', () => {
    it('renders its content inside a main landmark', () => {
      renderHome(false)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('never skips a heading level', () => {
      const { container } = renderHome(false)
      const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]))
      expect(levels[0]).toBe(1)
      levels.slice(1).forEach((level, i) => expect(level).toBeLessThanOrEqual(levels[i] + 1))
    })

    it.each([
      ['Who uses DUOS?', 'Built for every role in data sharing'],
      ['Streamline access oversight', 'DUOS for DACs'],
      ['Data Submitters', 'Register studies and make them discoverable'],
    ])('places "%s" after its heading so screen readers reach the heading first', (label, heading) => {
      renderHome(false)
      const headingEl = screen.getByRole('heading', { name: heading })
      const labelEl = within(headingEl.parentElement!).getByText(label)
      expect(headingEl.compareDocumentPosition(labelEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('header', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    const network = (container: HTMLElement) => container.querySelector('svg[viewBox="0 0 1440 440"]')

    it('draws the decorative network animation, hidden from screen readers', () => {
      const { container } = renderHome(false)
      expect(network(container)).toHaveAttribute('aria-hidden', 'true')
      expect(network(container)!.querySelectorAll('.drift').length).toBeGreaterThan(0)
    })

    it('pauses and resumes the animation from its button', () => {
      const { container } = renderHome(false)
      const playState = () => getComputedStyle(network(container)!.querySelector('.drift')!).animationPlayState
      expect(playState()).toBe('running')
      fireEvent.click(screen.getByRole('button', { name: 'Pause background animation' }))
      expect(playState()).toBe('paused')
      fireEvent.click(screen.getByRole('button', { name: 'Play background animation' }))
      expect(playState()).toBe('running')
    })

    it('shows the network without a pause button when the user prefers reduced motion', () => {
      stubReducedMotion(true)
      const { container } = renderHome(false)
      expect(network(container)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /background animation/ })).toBeNull()
    })
  })

  describe('features by role', () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView

    afterEach(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView
    })

    it.each([
      ['researcher', 'Request controlled-access data in one application'],
      ['submitter', 'Register studies and make them discoverable'],
      ['dac', 'Review requests with full context'],
      ['so', 'Authorize researchers at your institution'],
    ])('renders the %s section', (id, title) => {
      const { container } = renderHome(false)
      const section = container.querySelector(`#role-${id}`)!
      expect(section).not.toBeNull()
      expect(section).toHaveTextContent(title)
    })

    it('scrolls to and focuses the matching section when a role chip is clicked', async () => {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      const { container } = renderHome(false)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Signing Officials' }))
      })
      const section = container.querySelector('#role-so')
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.contexts[0]).toBe(section)
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(section).toHaveFocus()
    })

    it('jumps without animation when the user prefers reduced motion', async () => {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      stubReducedMotion(true)
      try {
        renderHome(false)
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: 'Researchers' }))
        })
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
      }
      finally {
        vi.unstubAllGlobals()
      }
    })

    it('opens contact modal from the data submitter section', async () => {
      renderHome(false)
      await act(async () => {
        fireEvent.click(screen.getByText('Talk to our team'))
      })
      expect(screen.getByTestId('support-modal')).toBeInTheDocument()
    })
  })
})
