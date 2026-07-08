import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminManageInstitutions from 'src/pages/AdminManageInstitutions'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { DuosUser, InstitutionInterface } from 'src/types/model'

vi.mock('src/libs/ajax/Institution', () => ({
  Institution: { list: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
    getSearchFilterFunctions: () => ({
      institutions: (term: string, list: InstitutionInterface[]) =>
        list.filter(inst => inst.name.toLowerCase().includes(term.toLowerCase())),
    }),
  }
})

vi.mock('src/libs/theme', () => ({
  Styles: {
    PAGE: {},
    SEARCH_ACTION_HEADER_SECTION: {},
    RIGHT_HEADER_SECTION: {},
    TABLE: { HEADER_ROW: {} },
  },
}))

vi.mock('src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }))

vi.mock('src/utils/ErrorUtils', () => ({ extractError: vi.fn().mockReturnValue('error') }))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) => (
    <input
      data-cy="search-bar"
      aria-label="search"
      onChange={e => handleSearchChange(e.target.value)}
    />
  ),
}))

vi.mock('src/components/institution_table/InstitutionTable', () => ({
  default: ({ filteredList }: { filteredList: InstitutionInterface[] }) => (
    <div data-testid="institution-table">
      {filteredList.map(inst => (
        <div key={inst.id} data-testid={`institution-row-${inst.id}`}>
          <span>{inst.name}</span>
          <span>{inst.id}</span>
          <span>{inst.updateDate ?? inst.createDate}</span>
          <span>{(inst.updateUser ?? inst.createUser).displayName}</span>
          {inst.domains?.map(d => <span key={d}>{d}</span>)}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('src/components/TableSkeletonLoader', () => ({
  default: () => <div data-cy="table-skeleton-loader" data-testid="table-skeleton-loader" />,
}))

vi.mock('src/components/AddObjectButton', () => ({
  default: ({ id, label, onClick }: { id: string, label: string, onClick: () => void }) => (
    <button id={id} onClick={onClick}>{label}</button>
  ),
}))

vi.mock('src/components/institution_table/InstitutionTableUtils', () => ({
  tableHeaderTemplate: [],
  tableRowLoadingTemplate: () => null,
  columns: [],
  columnHeaderData: vi.fn().mockReturnValue([]),
  processRows: vi.fn().mockReturnValue([]),
  calcPageCount: vi.fn().mockReturnValue(1),
  getInitialSort: vi.fn().mockReturnValue({ colIndex: 0, dir: 'asc' }),
  storageInstitutionSort: 'institutionSort',
  tableStyles: {},
}))

const createUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Create User',
  email: 'create@test.com',
  emailPreference: true,
  eraCommonsId: 'admin-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{ roleId: 4, name: 'Admin', userId: 1, userRoleId: 1 }],
  userId: 1,
}

const updateUser: DuosUser = {
  createDate: new Date(),
  displayName: 'Update User',
  email: 'update@test.com',
  emailPreference: true,
  eraCommonsId: 'update-user',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [{ roleId: 4, name: 'Admin', userId: 2, userRoleId: 2 }],
  userId: 2,
}

const mockInstitutions: InstitutionInterface[] = [
  {
    id: 1,
    name: 'Test Institution 1',
    domains: ['test1.edu'],
    signingOfficials: [{ userId: 1, displayName: 'User 1', email: 'email1@test.com' }],
    createDate: 'Feb 1, 2023',
    createUser,
    createUserId: createUser.userId,
  },
  {
    id: 2,
    name: 'Test Institution 2',
    domains: ['test2.edu'],
    signingOfficials: [{ userId: 2, displayName: 'User 2', email: 'email2@test.com' }],
    createDate: 'Jul 1, 2025',
    createUser,
    createUserId: createUser.userId,
    updateDate: 'Jul 2, 2025',
    updateUser,
    updateUserId: updateUser.userId,
  },
]

function renderPage() {
  return render(
    <BrowserRouter>
      <AdminManageInstitutions />
    </BrowserRouter>,
  )
}

describe('AdminManageInstitutions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue(mockInstitutions)
    const { container } = renderPage()

    expect(container.querySelector('[data-cy="admin-manage-institutions"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="search-bar"]')).toBeInTheDocument()

    // Let async init complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByTestId('table-skeleton-loader')).not.toBeInTheDocument()
    })
  })

  it('displays all institutions in list', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue(mockInstitutions)
    await act(async () => renderPage())

    for (const institution of mockInstitutions) {
      expect(screen.getByText(institution.name)).toBeInTheDocument()
      expect(screen.getByText(String(institution.id))).toBeInTheDocument()

      const expectedDate = institution.updateDate ?? institution.createDate
      expect(screen.getByText(expectedDate)).toBeInTheDocument()

      const expectedUser = institution.updateUser ?? institution.createUser
      expect(screen.getByText(expectedUser.displayName)).toBeInTheDocument()

      for (const domain of institution.domains ?? []) {
        expect(screen.getByText(domain)).toBeInTheDocument()
      }
    }
  })

  it('filters institutions on search', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue(mockInstitutions)
    const { container } = await act(async () => renderPage())

    const institution1 = mockInstitutions[0]
    const institution2 = mockInstitutions[1]
    const searchInput = container.querySelector('[data-cy="search-bar"]') as HTMLInputElement
    const rootDiv = container.querySelector('[data-cy="admin-manage-institutions"]')!

    // Search for institution1 — institution2 should not appear
    fireEvent.change(searchInput, { target: { value: institution1.name } })
    await waitFor(() => {
      expect(rootDiv).not.toHaveTextContent(institution2.name)
    })
    expect(rootDiv).toHaveTextContent(institution1.name)

    // Search for institution2 — institution1 should not appear
    fireEvent.change(searchInput, { target: { value: institution2.name } })
    await waitFor(() => {
      expect(rootDiv).not.toHaveTextContent(institution1.name)
    })
    expect(rootDiv).toHaveTextContent(institution2.name)

    // Search with a space — both should appear (both names contain a space)
    fireEvent.change(searchInput, { target: { value: ' ' } })
    await waitFor(() => {
      expect(rootDiv).toHaveTextContent(institution1.name)
    })
    expect(rootDiv).toHaveTextContent(institution2.name)
  })

  it('link Add Institution page', async () => {
    vi.mocked(InstitutionAPI.list).mockResolvedValue(mockInstitutions)
    await act(async () => renderPage())

    const addButton = document.getElementById('btn_addInstitution')
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveTextContent('ADD INSTITUTION')
  })

  it('handles loading state', async () => {
    let resolveList!: (institutions: InstitutionInterface[]) => void
    const controlledPromise = new Promise<InstitutionInterface[]>((resolve) => {
      resolveList = resolve
    })
    vi.mocked(InstitutionAPI.list).mockReturnValue(controlledPromise)

    const { container } = renderPage()

    // The effect fires synchronously up to the first await, so isLoading=true immediately
    await waitFor(() => {
      expect(container.querySelector('[data-cy="table-skeleton-loader"]')).toBeInTheDocument()
    })

    // Resolve the promise — loading should end
    await act(async () => {
      resolveList(mockInstitutions)
    })

    expect(container.querySelector('[data-cy="table-skeleton-loader"]')).not.toBeInTheDocument()
  })
})
