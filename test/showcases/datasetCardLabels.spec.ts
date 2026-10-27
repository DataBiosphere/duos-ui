import { describe, expect, it } from 'vitest'
import { DATASET_CARD_LABELS, datasetCardEntries } from 'src/showcases/datasetCardLabels'
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

  it('shows the provider link for an open dataset', () => {
    const open = { ...complete, accessManagement: 'open', dacName: null, accessUrl: 'https://example.org/open-cohort' } as const
    expect(entries(open)).toContainEqual({ field: 'accessUrl', label: 'Provider site', value: 'https://example.org/open-cohort' })
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

  it('never calls participants samples', () => {
    const labels: string[] = Object.values(DATASET_CARD_LABELS).map(({ label }) => label)
    const shown = [complete, unknown].flatMap(entries).map(entry => `${entry.label} ${entry.value}`)
    expect([...labels, ...shown].join(' ')).not.toMatch(/sample/i)
  })

  it('shows the available date as the UTC calendar date, not shifted by the reader\'s zone', () => {
    const first = entries({ ...complete, availableDate: '2026-01-01' })
    expect(first).toContainEqual({ field: 'availableDate', label: 'Available in DUOS', value: 'Jan 1, 2026' })
  })
})
