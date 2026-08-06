import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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

vi.mock('src/images/home_header_background.png', () => ({ default: 'home_header_background.png' }))
vi.mock('src/images/duos_logo.svg', () => ({ default: 'duos_logo.svg' }))
vi.mock('src/images/DUOS_Homepage_diagram.svg', () => ({ default: 'DUOS_Homepage_diagram.svg' }))
vi.mock('src/images/broad_logo_allwhite.png', () => ({ default: 'broad_logo_allwhite.png' }))

const renderHome = (isLogged: boolean) =>
  render(
    <MemoryRouter>
      <Home isLogged={isLogged} />
    </MemoryRouter>,
  )

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
      const { container } = renderHome(false)
      const libraryLink = container.querySelector('.logo-card a')!
      await act(async () => {
        fireEvent.click(libraryLink)
      })
      expect(handleSignIn).toHaveBeenCalled()
    })

    it('does not render terra (non-featured) library', () => {
      renderHome(false)
      expect(screen.queryByTitle('Please login to access Terra Data Library')).not.toBeInTheDocument()
    })

    it('renders one card per featured library, each with a link', () => {
      const { container } = renderHome(false)
      const cards = container.querySelectorAll('.logo-card')
      expect(cards).toHaveLength(3)
      cards.forEach((card) => {
        expect(card.querySelector('a')).not.toBeNull()
      })
    })

    it('calls handleSignIn with the target library path when a card is clicked', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      const { container } = renderHome(false)
      const libraryLink = container.querySelector('.logo-card a')!
      await act(async () => {
        fireEvent.click(libraryLink)
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

    it('renders library labels in order', () => {
      const { container } = renderHome(true)
      const logoCardImgs = container.querySelectorAll('.logo-card img')
      expect(logoCardImgs[0]).toHaveAttribute('alt', 'DUOS')
      expect(logoCardImgs[1]).toHaveAttribute('alt', 'Broad')
      expect(logoCardImgs[2]).toHaveAttribute('alt', 'eLwazi')
    })

    it('applies dark background styling to the Broad card', () => {
      renderHome(true)
      const broadImg = screen.getByAltText('Broad')
      const logoCar = broadImg.closest('.logo-card')
      expect(logoCar).toHaveStyle({ background: '#1F3B50', padding: '15px' })
    })

    it('navigates directly without calling handleSignIn when logged in', async () => {
      const { handleSignIn } = await import('src/libs/signInUtils')
      const { container } = renderHome(true)
      const libraryLink = container.querySelector('.logo-card a')!
      await act(async () => {
        fireEvent.click(libraryLink)
      })
      expect(handleSignIn).not.toHaveBeenCalled()
    })

    it('renders one card per featured library', () => {
      const { container } = renderHome(true)
      expect(container.querySelectorAll('.logo-card')).toHaveLength(3)
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
})
