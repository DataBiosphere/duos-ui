import { describe, it, expect } from 'vitest'
import { getAccessManagementSummary } from 'src/types/model'

describe('getAccessManagementSummary', () => {
  it('returns External summary for "external"', () => {
    const result = getAccessManagementSummary('external')
    expect(result.name).toBe('External')
    expect(result.description).toBe('External access request required')
    expect(typeof result.icon).toBe('string')
    expect(result.icon).not.toBe('')
  })

  it('returns Open summary for "open"', () => {
    const result = getAccessManagementSummary('open')
    expect(result.name).toBe('Open')
    expect(result.description).toBe('Open access')
    expect(typeof result.icon).toBe('string')
    expect(result.icon).not.toBe('')
  })

  it('returns Controlled summary for "controlled"', () => {
    const result = getAccessManagementSummary('controlled')
    expect(result.name).toBe('Controlled')
    expect(result.description).toBe('Controlled access')
    expect(typeof result.icon).toBe('string')
    expect(result.icon).not.toBe('')
  })

  it('returns Unknown summary with name "Unknown" for unrecognised values', () => {
    const result = getAccessManagementSummary('something-unknown')
    expect(result.name).toBe('Unknown')
    expect(result.description).toBe('Unknown access management')
  })

  it('returns Unknown summary for empty string', () => {
    const result = getAccessManagementSummary('')
    expect(result.name).toBe('Unknown')
    expect(result.description).toBe('Unknown access management')
  })
})
