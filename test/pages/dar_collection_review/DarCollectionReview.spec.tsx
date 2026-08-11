import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import DarCollectionReview from 'src/pages/dar_collection_review/DarCollectionReview'
import { Collections } from 'src/libs/ajax/Collections'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet'
import { VOTE_TYPES } from 'src/utils/DarUtils'
import { DarCollection, Dataset, DatasetTerm, DuosUser, MatchResult } from 'src/types/model'

// Default tab, so it mounts in every test; its /config.json fetch rejects unhandled under Node.
vi.mock('src/pages/dar_application/DataAccessRequestApplication', () => ({
  default: () => null,
}))

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    getCollectionById: vi.fn(),
    getCollectionByIdWithElectionHistory: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getById: vi.fn(),
    getUserRelevantDatasets: vi.fn(),
    getSOsForInstitution: vi.fn(),
  },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Match', () => ({
  Match: {
    findMatchBatch: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    searchDatasetIndex: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Navigation: { ...actual.Navigation, console: vi.fn() },
    Notifications: { showError: vi.fn(), showWarning: vi.fn(), showInformation: vi.fn() },
  }
})

const dar = {
  darCollectionId: 777,
  darCode: 'DAR-XXX',
  createDate: 1669229413840,
  createUser: {
    userId: 7,
    email: 'Bob.Jones@prodigy.com',
    displayName: 'Bob Jones',
    createDate: 1668229413840,
    roles: null,
    properties: [],
    emailPreference: true,
    institutionId: 90210,
    eraCommonsId: 'HERMAN',
    institution: {
      id: 90210,
      name: 'Ace Industries',
    },
    libraryCard: {
      id: 182,
      userId: 7,
      institutionId: 90210,
      userName: 'Bob Jones',
      userEmail: 'Bob.Jones@prodigy.com',
      createDate: 1667817915000,
      createUserId: 5555,
    },
  },
  createUserId: 7,
  dars: {
    'dars-id-123': {
      id: 2147,
      referenceId: 'dars-id-123',
      collectionId: 777,
      data: {
        institution: 'Ace Industries',
        projectTitle: 'Collection of sleep apnea samples',
        researcher: 'Bob Jones',
        rus: 'One good RUS\n',
        nonTechRus: 'One non-technical RUS\n',
        diseases: true,
        stigmatizedDiseases: true,
        aiLlmUse: false,
        darCode: 'DAR-XXX',
        createDate: 1667971415440,
        datasetIds: [13],
        datasetDetail: [],
        anvilUse: false,
        localUse: true,
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
      },
      draft: false,
      userId: 7,
      createDate: 1667970929000,
      submissionDate: 1669229413840,
      updateDate: 1669229413840,
      elections: {
        8888: {
          electionId: 8888,
          electionType: 'DataAccess',
          status: 'Open',
          createDate: 1669062648000,
          referenceId: 'dars-id-123',
          datasetId: 13,
          votes: {
            8675: { voteId: 8675, vote: true, userId: 4444, createDate: 1669062648000, updateDate: 1669120753000, electionId: 8888, rationale: '', type: 'DAC', displayName: 'Beth Johnson' },
            8676: { voteId: 8676, userId: 11111, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'Ted Lasso' },
            8677: { voteId: 8677, userId: 11111, createDate: 1669062648000, electionId: 8888, type: 'Chairperson', displayName: 'Ted Lasso' },
            8678: { voteId: 8678, userId: 11111, createDate: 1669062648000, electionId: 8888, type: VOTE_TYPES.FINAL, displayName: 'Ted Lasso' },
            8680: { voteId: 8680, userId: 9988, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'Stuart Williams' },
            8684: { voteId: 8684, userId: 4585, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'Sue Smith' },
            8674: { voteId: 8685, userId: 33333, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'DAC Member1' },
          },
        },
        1776: {
          electionId: 1776,
          electionType: 'RP',
          status: 'Open',
          createDate: 1669062648000,
          referenceId: 'dars-id-123',
          datasetId: 13,
          votes: {
            8688: { voteId: 8688, userId: 9988, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Stuart Williams' },
            8689: { voteId: 8689, userId: 9988, createDate: 1669062648000, electionId: 1776, type: 'Chairperson', displayName: 'Stuart Williams' },
            8685: { voteId: 8685, userId: 4444, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Beth Johnson' },
            8686: { voteId: 8686, userId: 11111, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Ted Lasso' },
            8687: { voteId: 8687, userId: 11111, createDate: 1669062648000, electionId: 1776, type: 'Chairperson', displayName: 'Ted Lasso' },
          },
        },
      },
      datasetIds: [13],
    },
  },
  datasets: [
    {
      datasetId: 13,
      name: 'Sleep Apnea',
      datasetName: 'Sleep Apnea',
      createDate: 1567123200000,
      updateDate: 1643730658770,
      updateUserId: 11111,
      alias: 999,
      datasetIdentifier: 'DUOS-00999',
      dataUse: {
        diseaseRestrictions: ['https://purl.obolibrary.org/obo/DOID_0050847'],
        populationOriginsAncestry: true,
        controlSetOption: 'Yes',
      },
      dacId: 1,
      consentId: 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
      deletable: false,
      properties: [],
      dacApproval: true,
      study: { piName: 'Lisa Simpson, Betty White' },
    },
  ],
} as unknown as DarCollection

const researcher = {
  userId: 7,
  email: 'Bob.Jones@prodigy.com',
  displayName: 'Bob Jones',
  createDate: 1668229413840,
  roles: null,
} as unknown as DuosUser

const chair = {
  userId: 11111,
  displayName: 'Ted Lasso',
  roles: [{ dacId: 1, userRoleId: 586, userId: 11111, roleId: 2, name: 'Chairperson' }],
} as unknown as DuosUser

const admin = {
  userId: 22222,
  displayName: 'Admin1',
  roles: [{ userRoleId: 587, userId: 22222, roleId: 4, name: 'Admin' }],
} as unknown as DuosUser

const member = {
  userId: 33333,
  displayName: 'DAC Member1',
  roles: [{ dacId: 1, userRoleId: 588, userId: 33333, roleId: 1, name: 'Member' }],
} as unknown as DuosUser

const matchResponse = [
  {
    id: 911,
    consent: 'DUOS-00099',
    purpose: 'dars-id-123',
    match: true,
    failed: false,
    abstain: false,
    createDate: 1668729600000,
    algorithmVersion: 'v2',
    rationales: [],
  },
] as unknown as MatchResult[]

const dacDatasets = [
  {
    datasetId: 13,
    dacId: 3,
    consentId: 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
    alias: 999,
    datasetIdentifier: 'DUOS-000999',
    properties: [{ propertyName: 'Dataset Name', propertyValue: 'Sleep Apnea' }],
    dataUse: { generalUse: true },
  },
] as unknown as Dataset[]

const terms = [
  {
    datasetId: 13,
    name: 'Sleep Apnea',
    datasetName: 'Sleep Apnea',
    datasetIdentifier: 'DUOS-00999',
    dataUse: { primary: [{ code: 'POA', description: 'POA' }] },
    dacId: 1,
  },
] as unknown as DatasetTerm[]

const renderReview = (props = {}) =>
  render(
    <MemoryRouter initialEntries={['/dar_collection/777']}>
      <Routes>
        <Route path="/dar_collection/:collectionId" element={<DarCollectionReview {...props} />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Collections.getCollectionById).mockResolvedValue(dar)
  vi.mocked(Collections.getCollectionByIdWithElectionHistory).mockResolvedValue(dar)
  vi.mocked(User.getById).mockResolvedValue(researcher)
  vi.mocked(User.getSOsForInstitution).mockResolvedValue([])
  vi.mocked(User.getUserRelevantDatasets).mockResolvedValue(dacDatasets)
  vi.mocked(Match.findMatchBatch).mockResolvedValue(matchResponse)
  vi.mocked(DataSet.searchDatasetIndex).mockResolvedValue(terms)
})

describe('DAR Review', () => {
  it('renders one manual-review warning while the Vote tab is open', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    renderReview({ adminPage: false })

    const alerts = await screen.findAllByRole('alert')
    const banners = alerts.filter(alert => alert.getAttribute('data-cy') === 'manual-review-warning-banner')

    expect(banners).toHaveLength(1)
  })

  it('renders Vote tab (not Chair Vote) for Chairs', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    renderReview({ adminPage: false })

    expect(await screen.findByText('Vote')).toBeInTheDocument()

    expect(screen.getByText('Voting History')).toBeInTheDocument()
    expect(screen.getByText('Full DAR')).toBeInTheDocument()
    expect(screen.queryByText('Chair Vote')).not.toBeInTheDocument()
  })

  it('renders the Vote tab as the left-most tab for Chairs', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    const { container } = renderReview({ adminPage: false })

    expect(await screen.findByText('Vote')).toBeInTheDocument()

    const tabLabels = Array.from(container.querySelectorAll('.tab-list button')).map(tab => tab.textContent)
    expect(tabLabels[0]).toBe('Vote')
  })

  it('shows dataset list when Vote tab is clicked (Chair)', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    renderReview({ adminPage: false })

    expect(await screen.findByText('Vote')).toBeInTheDocument()
    expect(screen.queryByTestId('dataset-list')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Vote'))

    expect(await screen.findByText('Sleep Apnea')).toBeInTheDocument()
  })

  it('opens on the Vote tab without clicking when the user has one', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(chair)
    renderReview({ adminPage: false })

    // Vote is the left-most tab, so its content renders on load with no interaction.
    expect(await screen.findByText('Sleep Apnea')).toBeInTheDocument()
  })

  it('opens on Full DAR when the user has no Vote tab', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcher)
    const { container } = renderReview({ adminPage: false })

    await screen.findByText('Full DAR')
    const tabLabels = Array.from(container.querySelectorAll('.tab-list button')).map(tab => tab.textContent)

    expect(tabLabels[0]).toBe('Full DAR')
    expect(screen.queryByText('Sleep Apnea')).not.toBeInTheDocument()
  })

  it('renders Vote tab (not Chair Vote) for Members', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(member)
    renderReview({ adminPage: false })

    expect(await screen.findByText('Vote')).toBeInTheDocument()

    expect(screen.getByText('Voting History')).toBeInTheDocument()
    expect(screen.getByText('Full DAR')).toBeInTheDocument()
    expect(screen.queryByText('Chair Vote')).not.toBeInTheDocument()
  })

  it('renders no vote tabs for Researchers', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(researcher)
    renderReview({ adminPage: false })

    expect(await screen.findByText('Full DAR')).toBeInTheDocument()

    expect(screen.queryByText('Voting History')).not.toBeInTheDocument()
    expect(screen.queryByText('Chair Vote')).not.toBeInTheDocument()
    expect(screen.queryByText('Vote')).not.toBeInTheDocument()
  })

  it('renders Chair Vote tab (not Vote) for Admins', async () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue(admin)
    renderReview({ adminPage: true })

    expect(await screen.findByText('Chair Vote')).toBeInTheDocument()

    expect(screen.getByText('Voting History')).toBeInTheDocument()
    expect(screen.getByText('Full DAR')).toBeInTheDocument()
    expect(screen.queryByText('Member')).not.toBeInTheDocument()
  })
})
