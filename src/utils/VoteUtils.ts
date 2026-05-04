export type MatchVoteResult = 'N/A' | 'Unable to determine a system match' | 'Yes' | 'No'

export interface MatchDataInput {
  match?: boolean
  failed?: boolean
}

// Converts match metadata into the user-facing algorithm result.
export const processMatchData = (matchData?: MatchDataInput | null): MatchVoteResult => {
  if (matchData == null || Object.keys(matchData).length === 0) {
    return 'N/A'
  }

  const { match, failed } = matchData
  const result = match ? 'Yes' : 'No'

  return failed
    ? 'Unable to determine a system match'
    : result
}
