import { describe, expect, it } from 'vitest'
import { DATASET_CARD_LABELS, availableDateFormat, datasetCardEntries } from 'src/showcases/datasetCardLabels'
import { DatasetSummarySchema } from 'src/showcases/schema'
import type { DatasetSummaryInput } from 'src/types/showcase'

const complete: DatasetSummaryInput = {
  identifier: 'DUOS-000789',
  title: 'Example Cohort',
  accessManagement: 'controlled',
  dacName: 'Example DAC',
  consentCodes: ['HMB', 'NPU'],
  participantCount: 5400,
  availableDate: '2026-09-30',
  accessUrl: null,
}

const unknown: DatasetSummaryInput = {
  identifier: 'DUOS-000790',
  title: 'Example Follow-up Cohort',
  accessManagement: null,
  dacName: null,
  consentCodes: [],
  participantCount: null,
  availableDate: null,
  accessUrl: null,
}

const entries = (input: DatasetSummaryInput) => datasetCardEntries(DatasetSummarySchema.parse(input))

describe('dataset card labels', () => {
  it('labels every projection field except the title, which is the heading', () => {
    const fields = Object.keys(DatasetSummarySchema.shape).filter(field => field !== 'title')
    expect(Object.keys(DATASET_CARD_LABELS).sort()).toEqual(fields.sort())
  })

  it('shows each known value under its label', () => {
    expect(entries(complete)).toEqual([
      { field: 'identifier', label: 'DUOS ID', value: 'DUOS-000789' },
      { field: 'accessManagement', label: 'Access', value: 'via DUOS' },
      { field: 'dacName', label: 'DAC', value: 'Example DAC' },
      { field: 'consentCodes', label: 'Data use', value: 'HMB, NPU' },
      { field: 'participantCount', label: 'Participants', value: '5,400' },
      { field: 'availableDate', label: 'Available in DUOS', value: 'Sep 30, 2026' },
    ])
  })

  it.each(['open', 'external'] as const)('shows the provider link and no DUOS DAC for an %s dataset', (accessManagement) => {
    const shown = entries({ ...complete, accessManagement, accessUrl: 'https://example.org/open-cohort' })
    expect(shown).toContainEqual({ field: 'accessUrl', label: 'Provider site', value: 'example.org', href: 'https://example.org/open-cohort' })
    expect(shown.map(entry => entry.field)).not.toContain('dacName')
  })

  it('accepts an https scheme in any case', () => {
    const shown = entries({ ...complete, accessManagement: 'open', accessUrl: 'HTTPS://example.org/open-cohort' })
    expect(shown).toContainEqual({ field: 'accessUrl', label: 'Provider site', value: 'example.org', href: 'HTTPS://example.org/open-cohort' })
  })

  it('shows no provider link that is not https', () => {
    const shown = entries({ ...complete, accessManagement: 'open', accessUrl: 'http://example.org/open-cohort' })
    expect(shown.map(entry => entry.field)).not.toContain('accessUrl')
  })

  it('shows no provider link for a controlled dataset', () => {
    expect(entries({ ...complete, accessUrl: 'https://example.org/stale' }).map(entry => entry.field)).not.toContain('accessUrl')
  })

  it('treats a blank DAC name and blank consent codes as unknown', () => {
    const shown = entries({ ...complete, dacName: '  ', consentCodes: [' ', ''] }).map(entry => entry.field)
    expect(shown).not.toContain('dacName')
    expect(shown).not.toContain('consentCodes')
  })

  it('drops blank consent codes from the list', () => {
    expect(entries({ ...complete, consentCodes: ['HMB', ' '] })).toContainEqual({ field: 'consentCodes', label: 'Data use', value: 'HMB' })
  })

  it('leaves out every unknown value, keeping only the identifier', () => {
    expect(entries(unknown)).toEqual([{ field: 'identifier', label: 'DUOS ID', value: 'DUOS-000790' }])
  })

  it.each([null, 0])('makes no numeric claim for a participant count of %s', (participantCount) => {
    expect(entries({ ...complete, participantCount }).map(entry => entry.field)).not.toContain('participantCount')
  })

  it('never labels participants as samples', () => {
    expect(Object.values(DATASET_CARD_LABELS).map(({ label }) => label).join(' ')).not.toMatch(/sample/i)
  })

  it('formats the available date in UTC, so readers west of UTC do not see the day before', () => {
    expect(availableDateFormat.resolvedOptions().timeZone).toBe('UTC')
    expect(entries({ ...complete, availableDate: '2026-01-01' })).toContainEqual({ field: 'availableDate', label: 'Available in DUOS', value: 'Jan 1, 2026' })
  })
})
