import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DuosHeader, { headerTabsConfig } from 'src/components/DuosHeader'
import { visibleSubTabs } from 'src/components/navigation/subTabVisibility'
import { Storage } from 'src/libs/storage'
import { NavigationStateProvider } from 'src/contexts/NavigationStateContext'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/notificationService', () => ({
  NotificationService: {
    getActiveBanners: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: () => null,
}))

vi.mock('src/components/NavigationTabsComponent', () => ({
  NavigationTabsComponent: ({ tabs, initialTab, isLogged, DuosLogo, orientation, contactUsButton }: {
    tabs: Array<{ label: string, children?: Array<{ label: string }> }>
    initialTab: number
    isLogged: boolean
    DuosLogo: string
    orientation: string
    contactUsButton: React.ReactNode
  }) => (
    <div>
      {orientation === 'horizontal' && <img src={DuosLogo} alt="DUOS Logo" />}
      {isLogged && tabs.map((tab, i) => (
        <div key={tab.label}>
          <button role="tab" className={i === initialTab ? 'Mui-selected' : ''}>
            {tab.label}
          </button>
          {i === initialTab && tab.children?.map(child => (
            <button key={child.label} role="tab">
              {child.label}
            </button>
          ))}
        </div>
      ))}
      {!isLogged && contactUsButton}
    </div>
  ),
}))

const mockUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  userId: 1,
}

const defaultUser: DuosUser = {
  createDate: new Date(),
  displayName: '',
  email: '',
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  userId: 0,
}

afterEach(() => vi.restoreAllMocks())

const mountHeader = async (path: string, user?: DuosUser) => {
  vi.spyOn(Storage, 'userIsLogged').mockReturnValue(!!user)
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(user ?? defaultUser)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <NavigationStateProvider>
          <Routes>
            <Route path="*" element={<DuosHeader classes={{ drawerPaper: '' }} />} />
          </Routes>
        </NavigationStateProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await act(async () => {})
}

describe('DuosHeader', () => {
  describe('Unauthenticated User', () => {
    it('displays the DUOS logo', async () => {
      await mountHeader('/home')
      expect(screen.getAllByAltText('DUOS Logo').length).toBeGreaterThan(0)
    })

    it('displays Contact Us button', async () => {
      await mountHeader('/home')
      expect(screen.getByRole('button', { name: /Contact Us/ })).toBeInTheDocument()
    })
  })

  describe('Authenticated Researcher', () => {
    it('displays Researcher Console tab', async () => {
      await mountHeader('/datalibrary', mockUser)
      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toBeInTheDocument()
    })

    it('displays correct subtabs for researcher', async () => {
      await mountHeader('/researcher_console_dashboard', mockUser)
      expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument()
    })

    // The section pages are registered as sub-tabs only so their URLs resolve to this tab; the
    // Dashboard's tiles are the only advertised route to them, so the bar must not list them.
    it('keeps the Researcher Console section pages out of the sub-tab bar', () => {
      const researcherConsole = headerTabsConfig.find(tab => tab.label === 'Researcher Console')

      expect(visibleSubTabs(researcherConsole?.children, { ...mockUser, isDataSubmitter: true })
        .map(subTab => subTab.label))
        .toEqual(['Dashboard'])
    })
  })

  describe('Global Data Library tab', () => {
    it.each([
      ['Admin', { isAdmin: true, isResearcher: false }],
      ['SO', { isSigningOfficial: true, isResearcher: false }],
      ['DAC Chair', { isChairPerson: true, isResearcher: false }],
      ['DAC Member', { isMember: true, isResearcher: false }],
      ['Researcher', { isResearcher: true }],
    ])('displays the Data Library tab for %s users', async (_role, traits) => {
      await mountHeader('/home', { ...mockUser, ...traits })
      expect(screen.getByRole('tab', { name: 'Data Library' })).toBeInTheDocument()
    })

    // DAC Chairs previously had no route to Data Library at all from nav (only DAC Members and
    // other consoles had a sub-tab for it); the global tab fixes that gap.
    it('gives DAC Chairs a route to Data Library, unlike the old sub-tab-only setup', async () => {
      await mountHeader('/datalibrary', { ...mockUser, isChairPerson: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
    })
  })

  describe('Authenticated Admin', () => {
    it('displays Admin Console tab', async () => {
      await mountHeader('/admin_manage_dar_collections', { ...mockUser, isAdmin: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'Admin Console' })).toBeInTheDocument()
    })
  })

  describe('Authenticated Signing Official', () => {
    it('displays SO Console tab', async () => {
      await mountHeader('/signing_official_console/library_cards', { ...mockUser, isSigningOfficial: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'SO Console' })).toBeInTheDocument()
    })

    // The institution-branded Data Library variant is now only linked from the SO Dashboard
    // card, not the sub-tab bar - but it must stay registered so its URL still resolves to the
    // SO Console tab (see the equivalent Researcher Console section test above).
    it('keeps the institution Data Library link out of the sub-tab bar', () => {
      const soConsole = headerTabsConfig.find(tab => tab.label === 'SO Console')

      expect(visibleSubTabs(soConsole?.children, { ...mockUser, isSigningOfficial: true })
        .map(subTab => subTab.label))
        .not.toContain('My Institution\'s Data Library')
    })

    it('highlights SO Console when visiting the institution Data Library link from the dashboard card', async () => {
      await mountHeader('/datalibrary/myinstitution', { ...mockUser, isSigningOfficial: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'SO Console' })).toHaveClass('Mui-selected')
    })
  })

  describe('Authenticated DAC Console', () => {
    it('displays DAC Console tab for a chairperson', async () => {
      await mountHeader('/dac_console', { ...mockUser, isChairPerson: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'DAC Console' })).toBeInTheDocument()
    })

    it('displays DAC Console tab for a member', async () => {
      await mountHeader('/dac_console', { ...mockUser, isMember: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'DAC Console' })).toBeInTheDocument()
    })

    it('displays collapsed subtabs (Dashboard)', async () => {
      await mountHeader('/dac_console', { ...mockUser, isChairPerson: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument()
    })

    it('keeps dashboard-only destinations out of the sub-tab bar', () => {
      const dacConsole = headerTabsConfig.find(tab => tab.label === 'DAC Console')

      expect(visibleSubTabs(dacConsole?.children, { ...mockUser, isChairPerson: true })
        .map(subTab => subTab.label))
        .toEqual(['Dashboard'])
    })

    it('selects the DAC Console tab on its Manage DACs route without navigation state', async () => {
      const adminChair = {
        ...mockUser,
        isAdmin: true,
        isChairPerson: true,
        isResearcher: false,
      }
      await mountHeader('/dac_console/manage_dac', adminChair)

      expect(screen.getByRole('tab', { name: 'DAC Console' })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Admin Console' })).not.toHaveClass('Mui-selected')
    })
  })

  describe('Contact Us Button', () => {
    it('displays Contact Us icon and text', async () => {
      await mountHeader('/home')
      expect(screen.getByAltText('Contact Us Icon')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Contact Us/ })).toHaveTextContent('Contact Us')
    })

    it('changes color on hover', async () => {
      await mountHeader('/home')
      const button = screen.getByRole('button', { name: /Contact Us/ })
      expect(button).toHaveStyle({ color: '#ffffff' })
      fireEvent.mouseEnter(button)
      expect(button).toHaveStyle({ color: '#2FA4E7' })
      fireEvent.mouseLeave(button)
      expect(button).toHaveStyle({ color: '#ffffff' })
    })
  })

  describe('Tab Highlighting', () => {
    it('highlights the global Data Library tab on /datalibrary for researcher-only user', async () => {
      await mountHeader('/datalibrary', mockUser)
      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
    })

    it('highlights the global Data Library tab on /datalibrary for admin+researcher', async () => {
      await mountHeader('/datalibrary', { ...mockUser, isAdmin: true, isResearcher: true })
      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
    })

    // Every Researcher Console section must stay in headerTabsConfig. A section that matches no
    // tab entry leaves urlDerivedTab at -1, and the header then highlights whichever console the
    // user happens to have first - Admin, for this fixture.
    it.each([
      '/researcher_console',
      '/datasets',
      '/dataset_submissions',
    ])('highlights Researcher Console on %s for admin+researcher', async (path) => {
      await mountHeader(path, { ...mockUser, isAdmin: true, isDataSubmitter: true })
      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toHaveClass('Mui-selected')
    })

    it('highlights Admin Console on /admin_manage_dar_collections for admin+researcher', async () => {
      await mountHeader('/admin_manage_dar_collections', { ...mockUser, isAdmin: true, isResearcher: true })
      expect(screen.getByRole('tab', { name: 'Admin Console' })).toHaveClass('Mui-selected')
    })

    it('preserves a tab selection on a detail page with no URL match (context fallback)', async () => {
      await mountHeader('/dar_application_review/999', mockUser)
      expect(document.querySelector('.Mui-selected')).toBeInTheDocument()
    })
  })
})
