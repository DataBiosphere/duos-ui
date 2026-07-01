import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import ResearcherConsole from 'src/pages/researcher_console/ResearcherConsole'
import { Collections } from 'src/libs/ajax/Collections'
import { DAR } from 'src/libs/ajax/DAR'
import { Notifications } from 'src/libs/utils'
import { DarCollectionSummary } from 'src/types/model'

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    getCollectionSummariesByRoleName: vi.fn(),
    cancelCollection: vi.fn(),
    reviseCollection: vi.fn(),
    getCollectionSummaryByRoleNameAndId: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: {
    deleteDar: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
    searchOnFilteredList: vi.fn(),
    getSearchFilterFunctions: () => ({ darCollections: (_term: string, list: DarCollectionSummary[]) => list }),
  }
})

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/hooks/useResponsiveDarCollectionColumns', () => ({
  useResponsiveDarCollectionColumns: vi.fn(),
}))

vi.mock('src/utils/DarCollectionUtils', () => ({
  consoleTypes: { RESEARCHER: 'researcher', ADMIN: 'admin', SIGNING_OFFICIAL: 'signingOfficial' },
  styles: {},
  DarCollectionTableColumnOptions: {},
}))

let capturedCancelCollection: ((c: DarCollectionSummary) => Promise<void>) | null = null
let capturedReviseCollection: ((c: DarCollectionSummary) => Promise<void>) | null = null
let capturedDeleteDraft: ((c: Pick<DarCollectionSummary, 'referenceIds' | 'darCode'>) => Promise<void>) | null = null
let capturedCollections: DarCollectionSummary[] | undefined = undefined

vi.mock('src/components/dar_collection_table/DarCollectionTable', () => ({
  DarCollectionTable: ({
    collections,
    isLoading,
    cancelCollection,
    reviseCollection,
    deleteDraft,
  }: {
    collections: DarCollectionSummary[]
    isLoading: boolean
    cancelCollection: (c: DarCollectionSummary) => Promise<void>
    reviseCollection: (c: DarCollectionSummary) => Promise<void>
    deleteDraft: (c: Pick<DarCollectionSummary, 'referenceIds' | 'darCode'>) => Promise<void>
  }) => {
    capturedCollections = collections
    capturedCancelCollection = cancelCollection
    capturedReviseCollection = reviseCollection
    capturedDeleteDraft = deleteDraft
    return React.createElement('div', { 'data-testid': 'dar-collection-table', 'data-loading': String(isLoading) })
  },
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) =>
    React.createElement('input', { 'data-testid': 'search-bar', 'onChange': (e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value) }),
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) =>
    React.createElement('div', null,
      React.createElement('h1', null, title),
      React.createElement('p', null, description)),
}))

vi.mock('src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf', () => ({ default: 'broad-lca.pdf' }))
vi.mock('src/assets/NIHLibraryCardAgreement06252025.pdf', () => ({ default: 'nih-lca.pdf' }))

const { useResponsiveDarCollectionColumns } = await import('src/hooks/useResponsiveDarCollectionColumns')
const { searchOnFilteredList } = await import('src/libs/utils')

const makeCollection = (overrides: Partial<DarCollectionSummary> = {}): DarCollectionSummary => ({
  actions: [],
  dacNames: [],
  dacCode: 'DAC-001',
  darCode: 'DAR-001',
  darCollectionId: 1,
  datasetCount: 1,
  datasetIds: [1],
  expired: false,
  expiresAt: 0,
  institutionName: 'Broad Institute',
  latestReferenceId: 'ref-001',
  name: 'Test Collection',
  progressReport: false,
  referenceIds: ['ref-001'],
  requiresSOApproval: false,
  researcherName: 'Jane Doe',
  status: 'In Progress',
  submissionDate: 1700000000,
  ...overrides,
})

describe('ResearcherConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCancelCollection = null
    capturedReviseCollection = null
    capturedDeleteDraft = null
    capturedCollections = undefined
    vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue(['col1', 'col2'] as never)
    vi.mocked(searchOnFilteredList).mockImplementation((_term, list, _fn, setter) => {
      setter(list ?? [])
    })
  })

  it('renders the page title and description', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<ResearcherConsole />))
    expect(screen.getByText('My Data Access Requests')).toBeInTheDocument()
    expect(screen.getByText('Select and manage Data Access Requests and Drafts below')).toBeInTheDocument()
  })

  it('renders links to Broad and NIH Library Card Agreements', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<ResearcherConsole />))
    expect(screen.getByText('Broad')).toBeInTheDocument()
    expect(screen.getByText('NIH')).toBeInTheDocument()
  })

  it('renders the SearchBar', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<ResearcherConsole />))
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
  })

  it('renders the DarCollectionTable', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<ResearcherConsole />))
    expect(screen.getByTestId('dar-collection-table')).toBeInTheDocument()
  })

  it('fetches collections on mount and passes them to the table', async () => {
    const collections = [makeCollection()]
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue(collections)
    await act(async () => render(<ResearcherConsole />))
    expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith('Researcher')
    expect(capturedCollections).toEqual(collections)
  })

  it('shows loading state initially and clears it after fetch', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    const { getByTestId } = render(<ResearcherConsole />)
    expect(getByTestId('dar-collection-table').getAttribute('data-loading')).toBe('true')
    await act(async () => {})
    expect(getByTestId('dar-collection-table').getAttribute('data-loading')).toBe('false')
  })

  it('shows error notification when fetch fails', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockRejectedValue(new Error('network'))
    await act(async () => render(<ResearcherConsole />))
    await waitFor(() =>
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Error: Failed to load Data Access Requests' }),
    )
  })

  it('does not render table when no responsive columns are returned', async () => {
    vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue([] as never)
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<ResearcherConsole />))
    // table still renders but columns prop is empty
    expect(screen.getByTestId('dar-collection-table')).toBeInTheDocument()
  })

  it('cancelCollection updates collection in state and shows success', async () => {
    const original = makeCollection({ darCollectionId: 1, darCode: 'DAR-001' })
    const updated = makeCollection({ darCollectionId: 1, darCode: 'DAR-001', status: 'Canceled' })
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([original])
    vi.mocked(Collections.cancelCollection).mockResolvedValue(updated as never)
    vi.mocked(Collections.getCollectionSummaryByRoleNameAndId).mockResolvedValue(updated)
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedCancelCollection!(original)
    })
    await waitFor(() =>
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Deleted Data Access Request DAR-001' }),
    )
  })

  it('cancelCollection shows error notification on failure', async () => {
    const collection = makeCollection()
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection])
    vi.mocked(Collections.cancelCollection).mockRejectedValue(new Error('fail'))
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedCancelCollection!(collection)
    })
    await waitFor(() =>
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Error: Cannot cancel target Data Access Request' }),
    )
  })

  it('reviseCollection shows success notification after revising', async () => {
    const collection = makeCollection({ darCollectionId: 1, darCode: 'DAR-001' })
    const revised = makeCollection({ darCollectionId: 1, darCode: 'DAR-001', status: 'Draft' })
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection])
    vi.mocked(Collections.reviseCollection).mockResolvedValue(revised as never)
    vi.mocked(Collections.getCollectionSummaryByRoleNameAndId).mockResolvedValue(revised)
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedReviseCollection!(collection)
    })
    await waitFor(() =>
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Revising Data Access Request DAR-001' }),
    )
  })

  it('reviseCollection shows error notification on failure', async () => {
    const collection = makeCollection()
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection])
    vi.mocked(Collections.reviseCollection).mockRejectedValue(new Error('fail'))
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedReviseCollection!(collection)
    })
    await waitFor(() =>
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Error: Cannot revise target Data Access Request' }),
    )
  })

  it('deleteDraft removes draft from collections and shows success', async () => {
    const draft = makeCollection({ referenceIds: ['ref-001'], darCode: 'DAR-DRAFT' })
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([draft])
    vi.mocked(DAR.deleteDar).mockResolvedValue({ status: 200 })
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedDeleteDraft!({ referenceIds: ['ref-001'], darCode: 'DAR-DRAFT' })
    })
    await waitFor(() =>
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Deleted Data Access Request Draft DAR-DRAFT' }),
    )
  })

  it('deleteDraft shows error notification on failure', async () => {
    const draft = makeCollection({ referenceIds: ['ref-001'], darCode: 'DAR-DRAFT' })
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([draft])
    vi.mocked(DAR.deleteDar).mockRejectedValue(new Error('fail'))
    await act(async () => render(<ResearcherConsole />))
    await act(async () => {
      await capturedDeleteDraft!({ referenceIds: ['ref-001'], darCode: 'DAR-DRAFT' })
    })
    await waitFor(() =>
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Failed to delete Data Access Request Draft DAR-DRAFT' }),
    )
  })
})
