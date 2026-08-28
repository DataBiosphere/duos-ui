import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DuosHeader, { headerTabsConfig } from 'src/components/DuosHeader'
import { visibleSubTabs } from 'src/components/navigation/subTabVisibility'
import { RESEARCHER_DASHBOARD_ROUTE } from 'src/pages/researcher_console/researcherConsoleRoutes'
import { MY_INSTITUTION_LIBRARY_ROUTE, SO_DASHBOARD_ROUTE } from 'src/pages/signing_official_console/signingOfficialConsoleRoutes'
import { Navigation } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { useUserIsLogged } from 'src/hooks/useSession'
import { NavigationStateProvider } from 'src/contexts/NavigationStateContext'
import { DuosUser } from 'src/types/model'

vi.mock('src/hooks/useSession', () => ({
  useUserIsLogged: vi.fn(),
}))

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
  // Auth state comes from the BFF session probe now, not localStorage.
  vi.mocked(useUserIsLogged).mockReturnValue(!!user)
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

/**
 * Mounts the header at `path` and hands back a function that navigates to `destination` within the
 * same NavigationStateProvider. This is the only way to exercise the navigation-context tier: a
 * fresh mount always starts with `activeTab` undefined.
 */
const mountHeaderThenNavigate = async (path: string, destination: string, user: DuosUser) => {
  vi.mocked(useUserIsLogged).mockReturnValue(true)
  vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(user)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const GoToDestination: React.FC = () => {
    const navigate = useNavigate()
    return <button onClick={() => navigate(destination)}>go to destination</button>
  }

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <NavigationStateProvider>
          <Routes>
            <Route
              path="*"
              element={(
                <>
                  <DuosHeader classes={{ drawerPaper: '' }} />
                  <GoToDestination />
                </>
              )}
            />
          </Routes>
        </NavigationStateProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await act(async () => {})

  return () => {
    fireEvent.click(screen.getByRole('button', { name: 'go to destination' }))
  }
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
      await mountHeader(RESEARCHER_DASHBOARD_ROUTE, mockUser)
      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toBeInTheDocument()
    })

    // The section pages are registered as sub-tabs only so their URLs resolve to this tab; the
    // Dashboard's tiles are the only advertised route to them, so the bar must not list them.
    it('keeps the Researcher Console section pages out of the sub-tab bar', () => {
      const researcherConsole = headerTabsConfig.find(tab => tab.label === 'Researcher Console')

      expect(visibleSubTabs(researcherConsole?.children, { ...mockUser, isDataSubmitter: true }))
        .toEqual([])
    })
  })

  describe('Authenticated Admin', () => {
    it('displays Admin Console tab', async () => {
      await mountHeader('/admin_manage_dar_collections', { ...mockUser, isAdmin: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'Admin Console' })).toBeInTheDocument()
    })

    it('displays the DAA Associations subtab for an admin', async () => {
      await mountHeader('/admin_manage_dar_collections', { ...mockUser, isAdmin: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'DAA Associations' })).toBeInTheDocument()
    })

    it('points the Admin Console DAA Associations subtab at the admin route', () => {
      const adminConsole = headerTabsConfig.find(tab => tab.label === 'Admin Console')
      const daaAssociations = adminConsole?.children?.find(subTab => subTab.label === 'DAA Associations')

      expect(daaAssociations?.link).toEqual('/admin_daa_associations')
    })

    it('highlights Admin Console on /admin_daa_associations', async () => {
      await mountHeader('/admin_daa_associations', { ...mockUser, isAdmin: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'Admin Console' })).toHaveClass('Mui-selected')
    })
  })

  describe('Authenticated Signing Official', () => {
    it('displays SO Console tab', async () => {
      await mountHeader('/signing_official_console/library_cards', { ...mockUser, isSigningOfficial: true, isResearcher: false })
      expect(screen.getByRole('tab', { name: 'SO Console' })).toBeInTheDocument()
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

    it('keeps dashboard-only destinations out of the sub-tab bar', () => {
      const dacConsole = headerTabsConfig.find(tab => tab.label === 'DAC Console')

      expect(visibleSubTabs(dacConsole?.children, { ...mockUser, isChairPerson: true }))
        .toEqual([])
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

  describe('Data Library tab', () => {
    it.each([
      ['an admin', { isAdmin: true }],
      ['a signing official', { isSigningOfficial: true }],
      ['a DAC chair', { isChairPerson: true }],
      ['a DAC member', { isMember: true }],
      ['a researcher', { isResearcher: true }],
    ])('renders for %s', async (_label, roles) => {
      await mountHeader('/profile', { ...mockUser, isResearcher: false, ...roles })
      expect(screen.getByRole('tab', { name: 'Data Library' })).toBeInTheDocument()
    })

    it('is the first tab in the bar', () => {
      expect(headerTabsConfig[0].label).toEqual('Data Library')
      expect(headerTabsConfig[0].link).toEqual('/datalibrary')
    })

    it('highlights the Data Library and no console on /datalibrary', async () => {
      const everyRole = { ...mockUser, isAdmin: true, isSigningOfficial: true, isChairPerson: true }
      await mountHeader('/datalibrary', everyRole)

      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
      for (const console of ['Admin Console', 'SO Console', 'DAC Console', 'Researcher Console']) {
        expect(screen.getByRole('tab', { name: console })).not.toHaveClass('Mui-selected')
      }
    })

    it('stays highlighted on the other library versions', async () => {
      await mountHeader('/datalibrary/anvil', mockUser)
      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
    })

    it.each([
      '/studies/123',
      '/studies/name/Framingham%20Heart%20Study',
      '/dataset/DUOS-000001',
    ])('stays highlighted on a fresh load of %s', async (path) => {
      const everyRole = {
        ...mockUser,
        isAdmin: true,
        isSigningOfficial: true,
        isChairPerson: true,
        isMember: true,
      }
      await mountHeader(path, everyRole)

      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
      for (const console of ['Admin Console', 'SO Console', 'DAC Console', 'Researcher Console']) {
        expect(screen.getByRole('tab', { name: console })).not.toHaveClass('Mui-selected')
      }
    })

    // The hidden /studies/ and /dataset/ registrations above are there for a cold load only. A
    // detail page opened from inside a console has to leave that console highlighted, otherwise the
    // highlight flips back and forth as the user moves between the results and a study.
    it.each([
      ['SO Console', MY_INSTITUTION_LIBRARY_ROUTE, '/studies/123'],
      ['Admin Console', '/manage_dac', '/dataset/DUOS-000001'],
    ])('leaves %s highlighted when %s links out to %s', async (consoleLabel, from, to) => {
      const everyRole = {
        ...mockUser,
        isAdmin: true,
        isSigningOfficial: true,
        isChairPerson: true,
        isMember: true,
      }
      const goToDetailPage = await mountHeaderThenNavigate(from, to, everyRole)
      expect(screen.getByRole('tab', { name: consoleLabel })).toHaveClass('Mui-selected')

      goToDetailPage()

      expect(screen.getByRole('tab', { name: consoleLabel })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Data Library' })).not.toHaveClass('Mui-selected')
    })

    // The consoles used to carry their own copy of the Data Library sub-tab; the top-level tab
    // replaces all of them.
    it('is the only Data Library entry in the nav config', () => {
      const nested = headerTabsConfig.flatMap(tab => tab.children ?? [])
        .filter(subTab => subTab.link.startsWith('/datalibrary'))
        .map(subTab => subTab.link)

      // The SO's institution-scoped view is the one exception - it is a console section.
      expect(nested).toEqual([MY_INSTITUTION_LIBRARY_ROUTE])
    })

    it('is not a console, so it is never the post-login landing page', async () => {
      const navigate = vi.fn()
      await Navigation.console({ ...mockUser, isSigningOfficial: true, isResearcher: false }, navigate)

      expect(navigate).toHaveBeenCalledWith(SO_DASHBOARD_ROUTE)
    })
  })

  describe('My Institution\'s Data Library', () => {
    const signingOfficial = { ...mockUser, isSigningOfficial: true, isResearcher: false }

    it('highlights SO Console rather than Data Library', async () => {
      await mountHeader(MY_INSTITUTION_LIBRARY_ROUTE, signingOfficial)

      expect(screen.getByRole('tab', { name: 'SO Console' })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Data Library' })).not.toHaveClass('Mui-selected')
    })

    // The SO Console Dashboard tile is the only advertised route to it now.
    it('is kept out of the SO Console sub-tab bar', () => {
      const soConsole = headerTabsConfig.find(tab => tab.label === 'SO Console')

      expect(visibleSubTabs(soConsole?.children, signingOfficial).map(subTab => subTab.label))
        .toEqual(['Dashboard', 'Researcher Status', 'Data Access Requests', 'DAR Approvals', 'DAA Associations'])
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
    it('highlights Researcher Console on its dashboard route', async () => {
      await mountHeader(RESEARCHER_DASHBOARD_ROUTE, mockUser)
      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toHaveClass('Mui-selected')
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

    // A DAR application and its progress report are registered by `search` fragment, so a fresh
    // load or refresh of one - no click, so no activeTab context to fall back on - resolves to
    // the console that owns it rather than to the Data Library tab sitting at index 0.
    it.each([
      '/dar_application_review/999',
      '/dar_application/999',
      '/progress_report_application/999',
    ])('highlights Researcher Console on a fresh load of %s', async (path) => {
      await mountHeader(path, mockUser)

      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Data Library' })).not.toHaveClass('Mui-selected')
    })

    it('highlights Researcher Console on a fresh load of a DAR application for admin+researcher', async () => {
      await mountHeader('/dar_application_review/999', { ...mockUser, isAdmin: true })

      expect(screen.getByRole('tab', { name: 'Researcher Console' })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Admin Console' })).not.toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Data Library' })).not.toHaveClass('Mui-selected')
    })

    // /dar_collection/:collectionId is shared by researchers, DAC members and signing officials,
    // so it is deliberately registered with no console - the last-resort fallback has to carry it.
    it.each([
      '/dar_collection/123',
      '/profile',
    ])('falls back to the first console, not the Data Library, on %s', async (path) => {
      await mountHeader(path, { ...mockUser, isAdmin: true })

      expect(screen.getByRole('tab', { name: 'Admin Console' })).toHaveClass('Mui-selected')
      expect(screen.getByRole('tab', { name: 'Data Library' })).not.toHaveClass('Mui-selected')
    })

    // Data Library is the only tab such a user has, so the fallback still has to land on it.
    it('falls back to the Data Library for a user with no console', async () => {
      await mountHeader('/profile', { ...mockUser, isResearcher: false })

      expect(screen.getByRole('tab', { name: 'Data Library' })).toHaveClass('Mui-selected')
    })
  })
})
