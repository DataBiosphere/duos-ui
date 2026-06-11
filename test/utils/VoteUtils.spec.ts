import { describe, it, expect } from 'vitest'
import { processMatchData } from 'src/utils/VoteUtils'

describe('VoteUtil - processMatchData()', () => {
  it('returns "N/A" if matchData is empty', () => {
    expect(processMatchData({})).toBe('N/A')
  })

  it('returns "N/A" if matchData is null', () => {
    expect(processMatchData(null)).toBe('N/A')
  })

  it('returns "Yes" if failed === false and match === true', () => {
    expect(processMatchData({ match: true, failed: false })).toBe('Yes')
  })

  it('returns "Yes" when match is true and failed is missing', () => {
    expect(processMatchData({ match: true })).toBe('Yes')
  })

  it('returns "Unable to determine a system match" if failed === true', () => {
    expect(processMatchData({ failed: true, match: false })).toBe('Unable to determine a system match')
  })

  it('prioritizes "failed" over "match" when both are true', () => {
    expect(processMatchData({ failed: true, match: true })).toBe('Unable to determine a system match')
  })

  it('returns "No" if failed === false and match === false', () => {
    expect(processMatchData({ failed: false, match: false })).toBe('No')
  })

  it('returns "No" when failed is false and match is missing', () => {
    expect(processMatchData({ failed: false })).toBe('No')
  })
})
