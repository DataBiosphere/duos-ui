import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, configure } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import MultiDatasetVotingTab from 'src/pages/dar_collection_review/MultiDatasetVotingTab'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { votingColors } from 'src/libs/VotingColors'
import { ControlledAccessType } from 'src/libs/dataUseTranslation'
import { DarCollection, DuosUser } from 'src/types/model'
import { Bucket } from 'src/utils/BucketUtils'

// All components use data-cy instead of data-testid
configure({ testIdAttribute: 'data-cy' })

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getUserRelevantDatasets: vi.fn(),
    getSOsForInstitution: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Votes', () => ({
  Votes: {
    updateVotesByIds: vi.fn(),
    updateRationaleByIds: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Email', () => ({
  Email: { sendReminderEmail: vi.fn() },
}))

vi.mock('src/components/common/VotesPieChart', () => ({
  default: () => <div data-cy="votes-pie-chart" />,
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: {
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInformation: vi.fn(),
      showSuccess: vi.fn(),
    },
  }
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

const darInfo = {
  rus: 'test',
  diseases: true,
}

const bucket1 = {
  key: 'bucket1',
  label: 'GROUP 1',
  elections: [
    { datasetId: 300, electionId: 101, status: 'Open', electionType: 'DataAccess' },
    { electionId: 100, status: 'Open', electionType: 'RP Vote' },
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, createDate: 1 },
        ],
        chairpersonVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, createDate: 1 },
        ],
        memberVotes: [
          { userId: 100, displayName: 'Joe', electionId: 100, voteId: 1, createDate: 1, electionStatus: 'Open' },
          { userId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1, electionStatus: 'Open' },
          { userId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1, electionStatus: 'Open' },
        ],
      },
      dataAccess: {
        finalVotes: [
          { userId: 200, displayName: 'Sarah', vote: false, electionId: 101, electionStatus: 'Open' },
        ],
        chairpersonVotes: [
          { userId: 200, displayName: 'Sarah', vote: false, electionId: 101, electionStatus: 'Open' },
        ],
        memberVotes: [
          { userId: 100, displayName: 'Joe', rationale: 'test', electionId: 101, voteId: 1, createDate: 1, electionStatus: 'Open' },
          { userId: 200, displayName: 'Sarah', vote: false, rationale: 'rationale', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open' },
          { userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1, electionStatus: 'Open' },
        ],
      },
    },
  ],
  dataUses: [
    { code: 'GRU', description: 'Use is permitted for any research purpose', type: ControlledAccessType.permissions },
  ],
  datasets: [],
  datasetIds: [],
  matchResults: [],
} as unknown as Bucket

const bucket2 = {
  key: 'bucket2',
  label: 'GROUP 2',
  elections: [
    { datasetId: 400, electionId: 102, status: 'Open', electionType: 'DataAccess' },
  ],
  votes: [
    {
      rp: {
        finalVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, createDate: 1 },
        ],
        chairpersonVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, createDate: 1 },
        ],
        memberVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, electionId: 100, voteId: 2, createDate: 1, electionStatus: 'Open' },
          { userId: 300, displayName: 'Matt', vote: true, electionId: 100, voteId: 3, createDate: 1, electionStatus: 'Open' },
        ],
      },
      dataAccess: {
        finalVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, electionId: 102, electionStatus: 'Open' },
        ],
        chairpersonVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, electionId: 102, electionStatus: 'Open' },
        ],
        memberVotes: [
          { userId: 200, displayName: 'Sarah', vote: true, rationale: 'rationale2', electionId: 102, voteId: 4, createDate: 1, electionStatus: 'Open' },
          { userId: 300, displayName: 'Matt', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open' },
        ],
      },
    },
  ],
  dataUses: [
    { code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose', type: ControlledAccessType.permissions },
  ],
  datasets: [],
  datasetIds: [],
  matchResults: [],
} as unknown as Bucket

const collection = {
  dars: {},
  datasets: [{ datasetId: 300 }, { datasetId: 400 }],
  createUser: { libraryCard: { id: 1 } },
} as unknown as DarCollection

const collectionMissingLibraryCard = {
  dars: {},
  datasets: [{ datasetId: 300 }],
  createUser: { libraryCard: null },
} as unknown as DarCollection

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = (userId: number) =>
  vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId } as unknown as DuosUser)

const renderTab = (props: Record<string, unknown> = {}) =>
  render(
    <MultiDatasetVotingTab
      darInfo={darInfo}
      buckets={[bucket1]}
      collection={collection}
      {...props}
    />,
  )

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockUser(200)
  vi.mocked(User.getUserRelevantDatasets).mockResolvedValue([
    { datasetId: 300 } as never,
    { datasetId: 400 } as never,
  ])
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MultiDatasetVotingTab', () => {
  it('renders the rp slab', async () => {
    renderTab()

    await waitFor(() => {
      expect(screen.getByTestId('rp-slab')).toBeInTheDocument()
      expect(screen.getByTestId('rp-expanded')).toBeInTheDocument()
    })
    // diseases: true in darInfo translates to a DS (Disease Specific) code
    expect(screen.getByText('DS')).toBeInTheDocument()
  })

  it('renders a dataset vote slab with NO selected for user with vote: false', async () => {
    // user 200 has vote: false in bucket1 memberVotes → member section shows NO selected
    renderTab({ isChair: false })

    await waitFor(() => {
      expect(screen.getByTestId('dataset-vote-slab')).toBeInTheDocument()
    })
    expect(screen.getByText('GRU')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.no })
    })
  })

  it('renders multiple dataset vote slabs', async () => {
    renderTab({ buckets: [bucket1, bucket2], isChair: false })

    await waitFor(() => {
      expect(screen.getByText('GRU')).toBeInTheDocument()
      expect(screen.getByText('HMB')).toBeInTheDocument()
    })
    expect(screen.getAllByTestId('dataset-vote-slab')).toHaveLength(2)
  })

  it('shows all DAC members in the vote summary table after expanding the dropdown', async () => {
    renderTab()

    // MemberVoteSummary renders after the useEffect sets dacVotes
    const dropdown = await waitFor(() => {
      const el = document.getElementById('show-member-vote-dropdown')
      expect(el).not.toBeNull()
      return el!
    })
    expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()

    fireEvent.click(dropdown)

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())
    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Joe')
    expect(table).toHaveTextContent('Sarah')
    expect(table).toHaveTextContent('Matt')
  })

  it('does not show the vote summary table before the dropdown is expanded', async () => {
    renderTab({ buckets: [bucket1, bucket2], isChair: false })

    await waitFor(() => expect(screen.getAllByTestId('dataset-vote-slab')).toHaveLength(2))
    expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()
  })

  it('renders a missing library card warning when the researcher has no library card and the user is a chair', async () => {
    renderTab({ collection: collectionMissingLibraryCard, isChair: true })

    await waitFor(() => {
      expect(document.getElementById('missing_lc_alert')).toBeInTheDocument()
    })
  })

  it('does not render a missing library card warning when the researcher has a library card', async () => {
    renderTab({ collection: collection, isChair: true })

    await waitFor(() => expect(screen.getByTestId('dataset-vote-slab')).toBeInTheDocument())
    expect(document.getElementById('missing_lc_alert')).not.toBeInTheDocument()
  })
})
