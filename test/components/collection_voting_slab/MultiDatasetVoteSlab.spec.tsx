import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, configure } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// All components use data-cy instead of data-testid
configure({ testIdAttribute: 'data-cy' })
import MultiDatasetVoteSlab from 'src/components/collection_voting_slab/MultiDatasetVoteSlab'
import { Storage } from 'src/libs/storage'
import { Votes } from 'src/libs/ajax/Votes'
import { votingColors } from 'src/libs/VotingColors'
import { ControlledAccessType } from 'src/libs/dataUseTranslation'
import { DarCollection, DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
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
  default: () => <div data-testid="votes-pie-chart" />,
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

// ── Elections ────────────────────────────────────────────────────────────────

const openElection1 = { datasetId: 10, electionId: 101, status: 'Open', electionType: 'DataAccess' }
const openElection2 = { datasetId: 20, electionId: 102, status: 'Open', electionType: 'DataAccess' }
const closedElection = { datasetId: 30, electionId: 103, status: 'Closed', electionType: 'DataAccess' }

// ── Vote fixtures ─────────────────────────────────────────────────────────────
// userId 400 = member-only user (appears in memberVotes only, consistent vote: false)
// userId 500 = chair-only user  (appears in chairpersonVotes only, not in memberVotes)

const votesForOpenElection1 = {
  dataAccess: {
    finalVotes: [
      { userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open' },
    ],
    chairpersonVotes: [
      { userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open' },
      { userId: 500, displayName: 'Chair Only', vote: true, electionId: 101, voteId: 13, createDate: 1, electionStatus: 'Open' },
    ],
    memberVotes: [
      { userId: 100, displayName: 'Joe', rationale: 'test1', electionId: 101, voteId: 1, createDate: 1, electionStatus: 'Open' },
      { userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 101, voteId: 2, createDate: 1, electionStatus: 'Open' },
      { userId: 300, displayName: 'Matt', vote: true, electionId: 101, voteId: 3, createDate: 1, electionStatus: 'Open' },
      { userId: 400, displayName: 'Member Only', vote: false, electionId: 101, voteId: 14, createDate: 1, electionStatus: 'Open' },
    ],
  },
}

const votesForOpenElection2 = {
  dataAccess: {
    finalVotes: [
      { userId: 200, displayName: 'Sarah', vote: true, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open' },
    ],
    chairpersonVotes: [
      { userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open' },
      { userId: 500, displayName: 'Chair Only', vote: false, electionId: 102, voteId: 15, createDate: 1, electionStatus: 'Open' },
    ],
    memberVotes: [
      { userId: 100, displayName: 'Joe', rationale: 'test2', electionId: 102, voteId: 4, createDate: 2, electionStatus: 'Open' },
      { userId: 200, displayName: 'Sarah', vote: false, rationale: 'test1', electionId: 102, voteId: 5, createDate: 1, electionStatus: 'Open' },
      { userId: 300, displayName: 'Matt', vote: false, electionId: 102, voteId: 6, electionStatus: 'Open' },
      { userId: 400, displayName: 'Member Only', vote: false, electionId: 102, voteId: 16, createDate: 1, electionStatus: 'Open' },
    ],
  },
}

const votesForClosedElection = {
  dataAccess: {
    finalVotes: [
      { userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed' },
    ],
    chairpersonVotes: [
      { userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed' },
    ],
    memberVotes: [
      { userId: 200, displayName: 'Sarah', vote: false, electionId: 103, voteId: 7, electionStatus: 'Closed' },
      { userId: 300, displayName: 'Matt', vote: true, rationale: 'test3', electionId: 103, voteId: 8, electionStatus: 'Closed' },
    ],
  },
}

// ── Collection ────────────────────────────────────────────────────────────────

const collection = {
  darCollectionId: 638,
  darCode: 'DAR-705',
  createDate: 1750783085180,
  dars: {
    '77dc615b-08fb-42b1-8c43-3d48d13aaee0': {
      id: 1938,
      referenceId: '77dc615b-08fb-42b1-8c43-3d48d13aaee0',
      collectionId: 638,
      data: {
        referenceId: '77dc615b-08fb-42b1-8c43-3d48d13aaee0',
        projectTitle: 'Multi DAC Testing Part 2',
        rus: 'Multi DAC Testing Part 2',
        nonTechRus: 'Multi DAC Testing Part 2',
        datasetIds: [2170, 1981],
        anvilUse: true,
      },
      draft: false,
      userId: 3351,
      createDate: 1750783027276,
      submissionDate: 1750783085180,
      updateDate: 1750783085180,
      datasetIds: [2170, 1981],
    },
    '5326fd77-84be-4f72-9743-ddbca1940a8c': {
      id: 2064,
      referenceId: '5326fd77-84be-4f72-9743-ddbca1940a8c',
      collectionId: 638,
      data: {
        referenceId: '5326fd77-84be-4f72-9743-ddbca1940a8c',
        projectTitle: 'Multi DAC Testing Part 2',
        rus: 'Multi DAC Testing Part 2',
        nonTechRus: 'Multi DAC Testing Part 2',
        hmb: true,
        datasetIds: [2170, 1981],
        dmi: { incidents: ['dmiCombination'], description: 'DMI Testing' },
        anvilUse: true,
      },
      draft: false,
      userId: 3351,
      createDate: 1753217184281,
      submissionDate: 1753217184281,
      updateDate: 1753217184281,
      datasetIds: [1981, 2170],
    },
  },
  datasets: [],
} as unknown as DarCollection

// The first DAR has no DMI — used to test algorithm decision visibility
const collectionWithoutDMI = {
  ...collection,
  dars: {
    '77dc615b-08fb-42b1-8c43-3d48d13aaee0': (collection as unknown as { dars: Record<string, unknown> }).dars['77dc615b-08fb-42b1-8c43-3d48d13aaee0'],
  },
} as unknown as DarCollection

// ── Helper ────────────────────────────────────────────────────────────────────

const renderSlab = (
  bucketOverrides: Record<string, unknown> = {},
  propOverrides: Record<string, unknown> = {},
) =>
  render(
    <MultiDatasetVoteSlab
      bucket={{ key: 'group-1', datasets: [], elections: [], votes: [], ...bucketOverrides } as never}
      collection={collection}
      dacDatasetIds={[]}
      isApprovalDisabled={false}
      isLoading={false}
      readOnly={false}
      adminPage={false}
      updateFinalVote={vi.fn()}
      reloadFn={vi.fn()}
      {...propOverrides}
    />,
  )

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = (userId: number) =>
  vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId } as unknown as DuosUser)

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Votes.updateVotesByIds).mockResolvedValue([])
  vi.mocked(Votes.updateRationaleByIds).mockResolvedValue([])
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MultiDatasetVoteSlab', () => {
  it('renders data use pills under a "Data Use Terms" heading, without a Modifiers sub-heading', () => {
    mockUser(1)
    renderSlab({
      dataUses: [
        { code: 'GRU', description: 'Use is permitted for any research purpose', type: ControlledAccessType.permissions },
        { code: 'HMB', description: 'Use is permitted for a health, medical, or biomedical research purpose', type: ControlledAccessType.permissions },
        { code: 'NCU', description: 'The dataset will be used in a study related to a commercial purpose.', type: ControlledAccessType.modifiers },
      ],
      elections: [],
    })

    expect(screen.getByText('Data Use Terms')).toBeInTheDocument()
    expect(screen.getByText('GRU')).toBeInTheDocument()
    expect(screen.getByText('Use is permitted for any research purpose')).toBeInTheDocument()
    expect(screen.getByText('HMB')).toBeInTheDocument()
    expect(screen.getByText('Use is permitted for a health, medical, or biomedical research purpose')).toBeInTheDocument()
    expect(screen.getByText('NCU')).toBeInTheDocument()
    expect(screen.getByText('The dataset will be used in a study related to a commercial purpose.')).toBeInTheDocument()
    expect(screen.queryByText(ControlledAccessType.modifiers)).not.toBeInTheDocument()
  })

  it('places the member vote detail table immediately below the summary graph, in the same column', () => {
    mockUser(200)
    renderSlab({
      elections: [closedElection],
      votes: [votesForClosedElection],
    })

    const chairVoteInfo = screen.getByTestId('chair-vote-info')
    const toggle = screen.getByRole('button', { name: /DAC/i })
    // ChairVoteInfo and the detail table are both grid items in the same "My DAC's Votes /
    // DUOS Algorithm" sub-grid, so the detail table sits directly below the pie chart
    // regardless of how tall the Vote column is.
    expect(chairVoteInfo.parentElement?.parentElement).toBe(toggle.closest('div')?.parentElement?.parentElement)
    expect(chairVoteInfo.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('lets the detail table expand rightward under the DUOS Algorithm section', () => {
    mockUser(200)
    renderSlab({
      elections: [closedElection],
      votes: [votesForClosedElection],
    })

    const toggle = screen.getByRole('button', { name: /DAC/i })
    const detailWrapper = toggle.closest('div')?.parentElement as HTMLElement
    expect(detailWrapper.style.gridColumn).toBe('1')

    fireEvent.click(toggle)
    expect(detailWrapper.style.gridColumn).toBe('1 / span 2')

    fireEvent.click(toggle)
    expect(detailWrapper.style.gridColumn).toBe('1')
  })

  it('shows NO selected in the member section when all member votes are false', async () => {
    // userId 400 appears only in memberVotes with vote: false in both elections
    mockUser(400)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.no })
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
    })

    fireEvent.click(screen.getByTestId('yes-collection-vote-button'))

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.yes })
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
    })
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('shows YES result text (not vote buttons) in the chair section when all chair votes are true', async () => {
    // userId 500 appears only in chairpersonVotes with vote: true in election1
    mockUser(500)
    renderSlab({
      elections: [openElection1],
      votes: [votesForOpenElection1],
    })

    await waitFor(() => {
      expect(screen.getByTestId('vote-subsection-heading')).toHaveTextContent('YES')
    })
    expect(screen.queryByTestId('yes-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows unselected vote buttons in the member section when member votes are mixed', async () => {
    // userId 300 (Matt) has vote: true in election1 and vote: false in election2 → mixed
    mockUser(300)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
    })

    fireEvent.click(screen.getByTestId('yes-collection-vote-button'))

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.yes })
    })
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('shows unselected buttons in the chair section when chair votes are mixed, then NO result text after clicking NO', async () => {
    // userId 500 has vote: true in election1 and vote: false in election2 → mixed
    mockUser(500)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
    })
    expect(screen.getByRole('textbox')).not.toBeDisabled()

    fireEvent.click(screen.getByTestId('no-collection-vote-button'))

    await waitFor(() => {
      expect(screen.getByTestId('vote-subsection-heading')).toHaveTextContent('NO')
    })
    expect(screen.queryByTestId('yes-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders a single shared question and distinct role-labeled buttons when the user has both member and chair votes', async () => {
    // userId 200 (Sarah): member votes (false, false) always show buttons since member voting is never final;
    // chair votes (true, false) are mixed → not yet submitted → chair buttons also show.
    mockUser(200)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(screen.getByText('Yes as Member')).toBeInTheDocument()
      expect(screen.getByText('No as Member')).toBeInTheDocument()
      expect(screen.getByText('Yes as Chair')).toBeInTheDocument()
      expect(screen.getByText('No as Chair')).toBeInTheDocument()
    })
    expect(screen.getByText('Should data access be granted?')).toBeInTheDocument()
    expect(screen.getByText('Vote:')).toBeInTheDocument()
  })

  it('renders "Vote:" on its own line below the question, un-bolded', () => {
    mockUser(400)
    renderSlab({
      elections: [openElection2, closedElection],
      votes: [votesForOpenElection2, votesForClosedElection],
    })

    const question = screen.getByText('Should data access be granted?')
    const voteLabel = screen.getByText('Vote:')
    // DOCUMENT_POSITION_FOLLOWING (4) means voteLabel comes after question in the DOM.
    expect(question.compareDocumentPosition(voteLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(voteLabel.style.fontWeight).toBe('400')
  })

  it('renders a faint divider between the member and chair vote sections when both are present', async () => {
    mockUser(200)
    const { container } = renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(container.querySelector('.chair-vote-divider')).toBeInTheDocument()
    })
  })

  it('does not render a divider when only the chair vote section is present', async () => {
    mockUser(500)
    const { container } = renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    await waitFor(() => {
      expect(screen.getByText('Yes as Chair')).toBeInTheDocument()
    })
    expect(container.querySelector('.chair-vote-divider')).not.toBeInTheDocument()
  })

  it('does not render a vote section when the user has no votes in the bucket', () => {
    // userId 999 does not appear in any votes
    mockUser(999)
    renderSlab({
      elections: [closedElection],
      votes: [votesForClosedElection],
    })

    expect(screen.queryByTestId('yes-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('vote-subsection-heading')).not.toBeInTheDocument()
    // The "Vote" column heading always renders, but the question is only appended when there is
    // actually a vote (member or chair) to weigh in on.
    expect(screen.getByText('Vote:')).toBeInTheDocument()
    expect(screen.queryByText(/Should data access be granted/)).not.toBeInTheDocument()
  })

  it('shows vote buttons when at least one election is open', async () => {
    // userId 400 has vote: false in openElection2; no vote in closedElection
    mockUser(400)
    renderSlab({
      elections: [openElection2, closedElection],
      votes: [votesForOpenElection2, votesForClosedElection],
    })

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.default })
      expect(screen.getByTestId('no-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.no })
    })

    fireEvent.click(screen.getByTestId('yes-collection-vote-button'))

    await waitFor(() => {
      expect(screen.getByTestId('yes-collection-vote-button')).toHaveStyle({ backgroundColor: votingColors.yes })
    })
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('shows result text (not vote buttons) in read-only mode', async () => {
    // userId 400 has vote: false in both elections → NO
    mockUser(400)
    renderSlab(
      { elections: [openElection1, openElection2], votes: [votesForOpenElection1, votesForOpenElection2] },
      { readOnly: true },
    )

    await waitFor(() => {
      expect(screen.getByTestId('vote-subsection-heading')).toHaveTextContent('NO')
    })
    expect(screen.queryByTestId('yes-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-collection-vote-button')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('does not render the DAC vote summary pie chart when the user has no chair votes', () => {
    // userId 300 (Matt) appears only in memberVotes → isChair = false
    mockUser(300)
    renderSlab({
      elections: [closedElection],
      votes: [votesForClosedElection],
    })

    expect(screen.queryByTestId('chair-vote-info')).not.toBeInTheDocument()
  })

  it('renders "My DAC\'s Votes" for a chair even when there are no DAC member votes in the bucket', () => {
    // userId 500 is in chairpersonVotes but not in any memberVotes → dacVotes = []
    mockUser(500)
    renderSlab({
      elections: [openElection1],
      votes: [votesForOpenElection1],
    })

    expect(screen.getByTestId('chair-vote-info')).toBeInTheDocument()
  })

  it('renders the DAC vote summary pie chart when the user is a chair with DAC member votes in the bucket', async () => {
    // userId 200 (Sarah) is in both chairpersonVotes and memberVotes in closedElection
    mockUser(200)
    renderSlab({
      elections: [closedElection],
      votes: [votesForClosedElection],
    })

    await waitFor(() => {
      expect(screen.getByTestId('chair-vote-info')).toBeInTheDocument()
    })
  })

  it('expands the member vote detail table in place without moving it out of its column', () => {
    mockUser(999)
    renderSlab()

    const toggle = screen.getByRole('button', { name: /DAC/i })
    const wrapper = toggle.parentElement as HTMLElement

    expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(screen.getByTestId('simple-table')).toBeInTheDocument()
    expect(toggle.parentElement).toBe(wrapper)

    fireEvent.click(toggle)
    expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()
  })

  it('does not show vote summary table rows for elections outside the user\'s DAC', async () => {
    // userId 100 (Joe) is in election2 memberVotes but not in closedElection memberVotes
    mockUser(100)
    renderSlab({
      elections: [openElection1, closedElection],
      votes: [votesForOpenElection2, votesForClosedElection],
    })

    expect(screen.queryByTestId('simple-table')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    const tooltipContents = Array.from(table.querySelectorAll('[data-tooltip-content]')).map(el => el.getAttribute('data-tooltip-content') ?? '')
    expect(tooltipContents.some(content => content.includes('test1'))).toBe(true)
    expect(tooltipContents.some(content => content.includes('test2'))).toBe(true)
    expect(tooltipContents.some(content => content.includes('test3'))).toBe(false)
  })

  it('collapses rows when the same user has the same vote across multiple elections', async () => {
    // Both voteGroups are election2 data → Sarah votes false twice → collapsed to one row
    mockUser(200)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection2, votesForOpenElection2],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Sarah')
    expect(table.querySelector('[data-tooltip-content*="test1"]')).toBeInTheDocument()
  })

  it('appends rationales when the same user has the same vote but different rationales across elections', async () => {
    // userId 100 (Joe): rationale 'test1' in election1, 'test2' in election2
    mockUser(100)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Joe')
    const rationaleTooltip = table.querySelector('[data-tooltip-content*="test1"]')
    expect(rationaleTooltip).toBeInTheDocument()
    expect(rationaleTooltip?.getAttribute('data-tooltip-content')).toContain('test2')
  })

  it('does not include "undefined" in displayed rationale values', async () => {
    // userId 200 (Sarah) has a rationale in election2 but not election3 (closed)
    mockUser(200)
    renderSlab({
      elections: [openElection2, closedElection],
      votes: [votesForOpenElection2, votesForClosedElection],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).not.toHaveTextContent('undefined')
    expect(table).toHaveTextContent('Sarah')
    const tooltipContents = Array.from(table.querySelectorAll('[data-tooltip-content]')).map(el => el.getAttribute('data-tooltip-content') ?? '')
    expect(tooltipContents.some(content => content.includes('undefined'))).toBe(false)
    expect(tooltipContents.some(content => content.includes('test1'))).toBe(true)
  })

  it('renders separate rows when the same user has different votes across elections', async () => {
    // userId 100 (Joe): Matt has vote:true in election1 and vote:false in election2
    mockUser(100)
    renderSlab({
      elections: [openElection1, openElection2],
      votes: [votesForOpenElection1, votesForOpenElection2],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Matt')
    expect(table).toHaveTextContent('Yes')
    expect(table).toHaveTextContent('No')
  })

  it('shows filler text for missing vote and rationale fields', async () => {
    // userId 100 (Joe) has no vote value → shown as '- -'
    mockUser(100)
    renderSlab({
      elections: [openElection2],
      votes: [votesForOpenElection2],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Joe')
    expect(table).toHaveTextContent('- -')
    expect(table).toHaveTextContent('Matt')
  })

  it('shows a Send Reminder button for members with no vote when the current user is a chair', async () => {
    // userId 200 (Sarah) has chair votes → isChair = true; Joe has no vote value → Send Reminder shown
    mockUser(200)
    renderSlab({
      elections: [openElection2],
      votes: [votesForOpenElection2],
    })

    fireEvent.click(screen.getByRole('button', { name: /DAC/i }))

    await waitFor(() => expect(screen.getByTestId('simple-table')).toBeInTheDocument())

    const table = screen.getByTestId('simple-table')
    expect(table).toHaveTextContent('Joe')
    expect(table).toHaveTextContent('Send Reminder')
    expect(table).toHaveTextContent('Matt')
    expect(table).toHaveTextContent('- -')
  })

  it('renders the algorithm decision when the latest DAR does not have a DMI', async () => {
    mockUser(100)
    renderSlab(
      {
        elections: [openElection2],
        votes: [votesForOpenElection2],
        algorithmResult: { createDate: new Date(), id: 1, result: 'Yes', rationales: [] },
      },
      { collection: collectionWithoutDMI },
    )

    await waitFor(() => {
      expect(screen.getByTestId('collection-algorithm-decision')).toBeInTheDocument()
    })
  })

  it('places "My DAC\'s Votes" before the DUOS Algorithm Decision section (columns swapped)', async () => {
    // userId 200 (Sarah) has chair votes in closedElection → "My DAC's Votes" renders.
    mockUser(200)
    renderSlab(
      {
        elections: [closedElection],
        votes: [votesForClosedElection],
        algorithmResult: { createDate: new Date(), id: 1, result: 'Yes', rationales: [] },
      },
      { collection: collectionWithoutDMI },
    )

    const chairVoteInfo = await screen.findByTestId('chair-vote-info')
    const algorithmDecision = screen.getByTestId('collection-algorithm-decision')
    // DOCUMENT_POSITION_FOLLOWING (4) means algorithmDecision comes after chairVoteInfo in the DOM.
    expect(chairVoteInfo.compareDocumentPosition(algorithmDecision) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('does not render the algorithm decision when the latest DAR has a DMI', async () => {
    mockUser(100)
    renderSlab({
      elections: [openElection2],
      votes: [votesForOpenElection2],
      algorithmResult: { createDate: new Date(), id: 1, result: 'Yes', rationales: [] },
    })

    await waitFor(() => {
      expect(screen.queryByTestId('collection-algorithm-decision')).not.toBeInTheDocument()
    })
  })

  it('re-derives algorithm decision visibility when the collection prop changes', () => {
    mockUser(100)
    const element = (collectionProp: DarCollection) => (
      <MultiDatasetVoteSlab
        bucket={{
          key: 'group-1',
          datasets: [],
          elections: [openElection2],
          votes: [votesForOpenElection2],
          algorithmResult: { createDate: new Date(), id: 1, result: 'Yes', rationales: [] },
        } as never}
        collection={collectionProp}
        dacDatasetIds={[]}
        isApprovalDisabled={false}
        isLoading={false}
        readOnly={false}
        adminPage={false}
        updateFinalVote={vi.fn()}
        reloadFn={vi.fn()}
      />
    )

    const { rerender } = render(element(collectionWithoutDMI))
    expect(screen.getByTestId('collection-algorithm-decision')).toBeInTheDocument()

    // Latest DAR now has a DMI -> algorithm decision should hide.
    rerender(element(collection))
    expect(screen.queryByTestId('collection-algorithm-decision')).not.toBeInTheDocument()
  })

  it('re-derives the vote section when the bucket prop changes', async () => {
    mockUser(400)
    const element = (bucket: unknown) => (
      <MultiDatasetVoteSlab
        bucket={bucket as never}
        collection={collection}
        dacDatasetIds={[]}
        isApprovalDisabled={false}
        isLoading={false}
        readOnly={false}
        adminPage={false}
        updateFinalVote={vi.fn()}
        reloadFn={vi.fn()}
      />
    )

    const { rerender } = render(element({
      key: 'group-1', datasets: [], elections: [openElection2], votes: [votesForOpenElection2],
    }))
    await waitFor(() => expect(screen.getByTestId('no-collection-vote-button')).toBeInTheDocument())

    // A bucket where this user has no votes -> the vote section should disappear.
    rerender(element({ key: 'group-1', datasets: [], elections: [], votes: [] }))
    expect(screen.queryByTestId('no-collection-vote-button')).not.toBeInTheDocument()
  })
})
