import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import AppRoutes from 'src/routing/AppRoutes'
import { Storage } from 'src/libs/storage'
import { USER_ROLES } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/libraryVersions', () => ({
  getLibraryVersions: () => ({}),
}))

vi.mock('src/components/modals/SupportRequestModal', () => ({
  SupportRequestModal: () => null,
}))

vi.mock('src/components/BaseModal', () => ({
  BaseModal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('src/pages/DACConsole', () => ({
  default: () => <div>DAC Console</div>,
}))

vi.mock('src/pages/manage_dac/ManageDac', () => ({
  default: () => <div>Manage DACs</div>,
}))

vi.mock('src/pages/data_submission/StudyTemplateUpload', () => ({
  StudyTemplateUpload: () => <div>Upload Study Template</div>,
}))

const LocationSpy = ({ onLocationChange }: { onLocationChange: (loc: string) => void }) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

const roleBACRoutes: string[] = [
  '/researcher_console_dashboard',
  '/researcher_console',
  '/datasets',
  '/dar_collection/1',
  '/dar_application_review/1',
  '/progress_report_application/1',
  '/dar_application/1',
  '/dataset_submissions',
  '/data_submission_template',
  '/data_submission_form',
  '/data_submission_form/draft/study-dataset/0393c587-343b-4c85-8969-e69e3f4f5aa8',
  '/study_update/1',
  '/dataset_update/1',
  '/dar_vote_review/1',
  '/dac_console',
  '/dac_console_dar_requests',
  '/dac_console/manage_dac',
  '/chair_console',
  '/member_console',
  '/signing_official_console',
  '/signing_official_console/dashboard',
  '/signing_official_console/library_cards',
  '/signing_official_console/dar_requests',
  '/signing_official_console/dar_approvals',
  '/signing_official_console/researchers_daa_associations',
  '/dac_datasets',
  '/manage_dac',
  '/manage_dac/1',
  '/manage_radar/1',
  '/admin_review_collection/1',
  '/admin_manage_users',
  '/admin_edit_user/1',
  '/admin_manage_institutions/create_new',
  '/admin_manage_institutions/institutions/1',
  '/admin_manage_institutions',
  '/admin_manage_lc/',
  '/admin_manage_dar_collections/',
  '/manage_add_dac_daa',
]

describe('AppRoutes — RoleBAC routes redirect unauthenticated users', () => {
  beforeEach(() => {
    vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)
  })
  afterEach(() => vi.restoreAllMocks())

  it.each(roleBACRoutes)('redirects unauthenticated user visiting "%s" to /?redirectTo=<route>', (route) => {
    const onLocationChange = vi.fn()
    const { container } = render(
      <MemoryRouter initialEntries={[route]}>
        <LocationSpy onLocationChange={onLocationChange} />
        <AppRoutes isLogged={false} env="dev" />
      </MemoryRouter>,
    )
    expect(onLocationChange).toHaveBeenCalledWith(`/?redirectTo=${route}`)
    expect(container.querySelector('[data-cy="not-found"]')).not.toBeInTheDocument()
  })
})

describe('AppRoutes — legacy DAC console redirects', () => {
  const userWithRole = (roleName: string): DuosUser => ({
    roles: [{ name: roleName }],
  } as DuosUser)

  beforeEach(() => {
    vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)
  })

  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['/chair_console', USER_ROLES.chairperson],
    ['/member_console', USER_ROLES.member],
  ])('redirects %s for its legacy role', (legacyRoute, roleName) => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(roleName))
    const onLocationChange = vi.fn()

    const { getByText } = render(
      <MemoryRouter initialEntries={[legacyRoute]}>
        <LocationSpy onLocationChange={onLocationChange} />
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(onLocationChange).toHaveBeenCalledWith('/dac_console_dar_requests')
    expect(getByText('DAC Console')).toBeInTheDocument()
  })

  it('renders Manage DACs at the DAC-specific route for a chair', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(USER_ROLES.chairperson))

    const { getByText } = render(
      <MemoryRouter initialEntries={['/dac_console/manage_dac']}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(getByText('Manage DACs')).toBeInTheDocument()
  })

  it('does not allow a member through the chair-only legacy route', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(USER_ROLES.member))

    const { container } = render(
      <MemoryRouter initialEntries={['/chair_console']}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
  })
})

describe('AppRoutes — study template upload route', () => {
  const userWithRole = (roleName: string): DuosUser => ({
    roles: [{ name: roleName }],
  } as DuosUser)

  beforeEach(() => {
    vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)
  })

  afterEach(() => vi.restoreAllMocks())

  it.each([
    USER_ROLES.dataSubmitter,
    USER_ROLES.chairperson,
    USER_ROLES.admin,
  ])('renders the upload page for a %s', (roleName) => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(roleName))

    const { getByText } = render(
      <MemoryRouter initialEntries={['/data_submission_template']}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(getByText('Upload Study Template')).toBeInTheDocument()
  })

  it('does not let a researcher through', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(USER_ROLES.researcher))

    const { container, queryByText } = render(
      <MemoryRouter initialEntries={['/data_submission_template']}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
    expect(queryByText('Upload Study Template')).not.toBeInTheDocument()
  })
})

describe('AppRoutes — study/dataset draft route', () => {
  const userWithRole = (roleName: string): DuosUser => ({
    roles: [{ name: roleName }],
  } as DuosUser)

  const DRAFT_ROUTE = '/data_submission_form/draft/study-dataset/0393c587-343b-4c85-8969-e69e3f4f5aa8'

  beforeEach(() => {
    vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)
  })

  afterEach(() => vi.restoreAllMocks())

  it('resolves the draft path to the registration form rather than the blank one', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(USER_ROLES.dataSubmitter))

    const { container } = render(
      <MemoryRouter initialEntries={[DRAFT_ROUTE]}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    // Four segments deep, so it must not be mistaken for /data_submission_form/:studyId.
    expect(container.querySelector('[data-cy="not-found"]')).not.toBeInTheDocument()
  })

  it('does not let a researcher through', () => {
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(userWithRole(USER_ROLES.researcher))

    const { container } = render(
      <MemoryRouter initialEntries={[DRAFT_ROUTE]}>
        <AppRoutes isLogged={true} env="dev" />
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
  })
})

describe('AppRoutes — /backgroundsignin is gated to DEV environments', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders BackgroundSignIn when the current environment is dev', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('dev')
    const { container, getByText } = render(
      <MemoryRouter initialEntries={['/backgroundsignin']}>
        <AppRoutes isLogged={false} env="dev" />
      </MemoryRouter>,
    )
    expect(getByText('Access Token')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="not-found"]')).not.toBeInTheDocument()
  })

  it('renders NotFound when the current environment is prod', () => {
    vi.spyOn(Storage, 'getEnv').mockReturnValue('prod')
    const { container, queryByText } = render(
      <MemoryRouter initialEntries={['/backgroundsignin']}>
        <AppRoutes isLogged={false} env="prod" />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="not-found"]')).toBeInTheDocument()
    expect(queryByText('Access Token')).not.toBeInTheDocument()
  })
})
