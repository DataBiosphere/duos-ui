import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import rawDarCollection from './darCollection.json'
import { DarCollection } from 'src/types/model'
import { VOTE_TYPES } from 'src/utils/DarUtils'

// The fixture is a hand-trimmed subset of a real API response, so it needs one bridging
// cast here rather than matching DarCollection's full shape field-for-field.
const darCollection = rawDarCollection as unknown as DarCollection

// Vitest automocks these - every exported function becomes vi.fn(), other exports pass
// through unchanged. Storage stays explicit below because DataAccessRequestApplication
// relies on Storage.getData() defaulting to null, not automock's default of undefined.
vi.mock('src/libs/ajax/DataSet')
vi.mock('src/libs/ajax/Metrics')
vi.mock('src/libs/notificationService')
vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Countries')
vi.mock('src/libs/ajax/Collections')
vi.mock('src/libs/ajax/DAR')

vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Navigation: {
      ...original.Navigation,
      console: vi.fn(),
    },
  }
})

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
    getData: vi.fn(() => null),
    removeData: vi.fn(),
  },
}))

import { DataSet } from 'src/libs/ajax/DataSet'
import { Metrics } from 'src/libs/ajax/Metrics'
import { NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Countries } from 'src/libs/ajax/Countries'
import { Collections } from 'src/libs/ajax/Collections'
import { DAR } from 'src/libs/ajax/DAR'

const props = {
  draftDar: true,
  isProgressReportApplication: false,
  existingDarsReadOnlyMode: true,
}

const darId = '011467b7-5544-499f-9210-3c2035810639'

const user = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCard: {},
  properties: [],
}

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    name: 'Dataset A',
    dataUse: {},
  },
  {
    datasetId: 123457,
    datasetIdentifier: 'DUOS-123457',
    name: 'Dataset B',
    dataUse: {},
  },
]

const mountDataAccessRequestApp = async (collection: unknown) => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[`/dar_application/${darId}`]}>
        <Routes>
          <Route
            path="/dar_application/:collectionId"
            element={<DataAccessRequestApplication {...props} collection={collection as never} />}
          />
        </Routes>
      </MemoryRouter>,
    )
  })
}

const toggleRationale = async (index: number) => {
  await act(async () => {
    fireEvent.click(document.querySelectorAll<HTMLElement>('.rationale-btn')[index])
  })
}

// jsdom doesn't compute real CSS layout, so these toBeVisible() checks only catch inline
// display:none/hidden-attribute regressions - not full stylesheet-driven hiding a real
// browser (the original Cypress suite) would. Still, they confirm the trigger and the
// panel it reveals aren't accidentally rendered hidden, which a bare presence check misses.
const openVotingHistoryTab = async () => {
  const trigger = document.getElementById('voting-history-info')
  expect(trigger).toBeVisible()
  await act(async () => {
    fireEvent.click(trigger!)
  })
  expect(document.querySelector('.voting-history-container')).toBeVisible()
}

interface VoteFixture {
  type: string
  vote: boolean | null
  rationale: string
  updateDate: string
}

interface ElectionFixture {
  electionType: string
  datasetId: number
  status: string
  votes: VoteFixture[]
}

// Only the fields the voting-history UI reads are stubbed here, so this - like darCollection
// itself - needs a bridging cast rather than a fully-populated Election/Vote per dataset.
const mockVotingHistoryCollection = (datasetIds: number[], elections: Record<string, ElectionFixture>) => {
  vi.mocked(Collections.getCollectionById).mockResolvedValue({
    ...darCollection,
    dars: {
      [darId]: {
        id: 1,
        referenceId: darId,
        datasetIds,
        elections,
        data: {
          darCode: darId,
          projectTitle: 'Test Project',
          piName: 'Jane Doe',
        },
      },
    },
  } as unknown as Awaited<ReturnType<typeof Collections.getCollectionById>>)
}

describe('Voting History - Vote Status Display', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(Countries.getCountries).mockResolvedValue(['United States of America (the)'])
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined)
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(datasets as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
    vi.mocked(Storage.getCurrentUser).mockReturnValue(user as unknown as ReturnType<typeof Storage.getCurrentUser>)
    vi.mocked(User.getMe).mockResolvedValue(user as unknown as Awaited<ReturnType<typeof User.getMe>>)
    vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(undefined)
    vi.mocked(DAR.getPartialDarRequest).mockResolvedValue(
      darCollection.dars[darId],
    )
  })

  it('displays Awaiting Election Opening when no election exists', async () => {
    mockVotingHistoryCollection([123456, 123457], {})

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Awaiting Election Opening')
  })

  it('displays Approved and rationale when final vote is true and rationale present', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: true,
            rationale: 'Approved for research.',
            updateDate: '2024-06-01T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Approved')
    await toggleRationale(0)
    expect(document.body.textContent).toContain('Approved for research.')
  })

  it('displays Denied and rationale when final vote is false and rationale present', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: false,
            rationale: 'Not enough justification.',
            updateDate: '2024-06-02T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Denied')
    await toggleRationale(0)
    expect(document.body.textContent).toContain('Not enough justification.')
  })

  it('displays Pending and Awaiting Final Vote when final vote is missing', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Open',
        votes: [
          {
            type: 'Preliminary',
            vote: null,
            rationale: 'Still under review.',
            updateDate: '2024-06-03T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Pending')
    expect(document.body.textContent).toContain('Awaiting Final Vote')
  })

  it('displays No rationale provided when vote is cast but rationale is missing', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: true,
            rationale: '',
            updateDate: '2024-06-04T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Approved')
    await toggleRationale(0)
    expect(document.body.textContent).toContain('No rationale provided.')
  })

  it('displays No rationale provided when vote is cast but rationale is whitespace', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: false,
            rationale: '   ',
            updateDate: '2024-06-05T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Denied')
    await toggleRationale(0)
    expect(document.body.textContent).toContain('No rationale provided.')
  })

  it('displays correct status/rationale for multiple datasets with mixed voting results', async () => {
    mockVotingHistoryCollection([123456, 123457], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: true,
            rationale: 'Approved for dataset A.',
            updateDate: '2024-06-06T00:00:00Z',
          },
        ],
      },
      'election-2': {
        electionType: 'DataAccess',
        datasetId: 123457,
        status: 'Closed',
        votes: [
          {
            type: VOTE_TYPES.FINAL,
            vote: false,
            rationale: '',
            updateDate: '2024-06-07T00:00:00Z',
          },
        ],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Approved')
    await toggleRationale(1) // Sorting by date, the approved vote is second
    expect(document.body.textContent).toContain('Approved for dataset A.')
    expect(document.body.textContent).toContain('Denied')
    await toggleRationale(0) // The denied vote is first
    expect(document.body.textContent).toContain('No rationale provided.')
  })

  it('displays Pending and Awaiting Final Vote when election exists but no votes at all', async () => {
    mockVotingHistoryCollection([123456], {
      'election-1': {
        electionType: 'DataAccess',
        datasetId: 123456,
        status: 'Open',
        votes: [],
      },
    })

    await mountDataAccessRequestApp(darCollection)
    await openVotingHistoryTab()
    expect(document.body.textContent).toContain('Pending')
    expect(document.body.textContent).toContain('Awaiting Final Vote')
  })
})
