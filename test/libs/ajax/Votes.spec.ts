import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Votes } from 'src/libs/ajax/Votes'
import { Config } from 'src/libs/config'
import type { Vote } from 'src/types/model'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchPut } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchPut: vi.fn(),
}))

const apiUrl = 'https://api.example.test'

describe('Votes ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updateVotesByIds sends a PUT request and resolves with updated votes array', async () => {
    const voteIds = [1, 2, 3]
    const vote = { vote: true, rationale: 'Approved' }
    const votesResponse = [
      { voteId: 1, userId: 10, createDate: '2024-01-01', electionId: 100, displayName: 'User1', type: 'final', vote: true, rationale: 'Approved' },
      { voteId: 2, userId: 11, createDate: '2024-01-01', electionId: 100, displayName: 'User2', type: 'final', vote: true, rationale: 'Approved' },
      { voteId: 3, userId: 12, createDate: '2024-01-01', electionId: 100, displayName: 'User3', type: 'final', vote: true, rationale: 'Approved' },
    ] as Vote[]
    vi.mocked(fetchPut).mockResolvedValue({ data: votesResponse } as FetchData<Vote[]>)

    const result = await Votes.updateVotesByIds(voteIds, vote)

    expect(result).toEqual(votesResponse)
    expect(fetchPut).toHaveBeenCalledWith(
      `${apiUrl}/api/votes`,
      { vote: true, rationale: 'Approved', voteIds },
    )
  })

  it('updateRationaleByIds sends a PUT request and resolves with updated votes array', async () => {
    const voteIds = [4, 5]
    const rationale = 'Needs more info'
    const votesResponse = [
      { voteId: 4, userId: 13, createDate: '2024-01-01', electionId: 101, displayName: 'User4', type: 'final', rationale: 'Needs more info' },
      { voteId: 5, userId: 14, createDate: '2024-01-01', electionId: 101, displayName: 'User5', type: 'final', rationale: 'Needs more info' },
    ] as Vote[]
    vi.mocked(fetchPut).mockResolvedValue({ data: votesResponse } as FetchData<Vote[]>)

    const result = await Votes.updateRationaleByIds(voteIds, rationale)

    expect(result).toEqual(votesResponse)
    expect(fetchPut).toHaveBeenCalledWith(
      `${apiUrl}/api/votes/rationale`,
      { rationale, voteIds },
    )
  })
})
