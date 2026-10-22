import { describe, expect, it } from 'vitest'
import { DatasetSummarySchema, DateStringSchema, DuosIdentifierSchema, LookupRequestSchema, ShowcaseConfigSchema } from 'src/showcases/schema'
import {
  DUOS_IDENTIFIER_PATTERN,
  type DateString,
  type DuosIdentifier,
  type LookupRequest,
  type LookupRequestInput,
  SECTION_KEYS,
  type SectionKey,
  type ShowcaseConfigInput,
  TOOL_SECTION_KEYS,
} from 'src/types/showcase'

describe('DuosIdentifierSchema', () => {
  it.each(['DUOS-000123', 'DUOS-999999', 'DUOS-1234567'])('accepts the canonical identifier %s', (id) => {
    expect(DuosIdentifierSchema.safeParse(id).success).toBe(true)
  })

  it.each(['DUOS-123', 'DUOS-0001234', 'DUOS-1e3', 'DUOS-0x1F', 'duos-000123', ' DUOS-000123'])('rejects %s', (id) => {
    expect(DuosIdentifierSchema.safeParse(id).success).toBe(false)
  })

  it('uses the shared identifier pattern', () => {
    expect(DUOS_IDENTIFIER_PATTERN.test('DUOS-000123')).toBe(true)
  })

  it('brands the parsed value so an unchecked string is not an identifier', () => {
    const parsed: DuosIdentifier = DuosIdentifierSchema.parse('DUOS-000123')
    expect(parsed).toBe('DUOS-000123')
    // @ts-expect-error a string literal has not been through the schema
    const unchecked: DuosIdentifier = 'DUOS-000123'
    expect(unchecked).toBeDefined()
  })
})

describe('DateStringSchema', () => {
  it.each(['2026-11-01', '2028-02-29', '2026-12-31'])('accepts the calendar date %s', (date) => {
    expect(DateStringSchema.safeParse(date).success).toBe(true)
  })

  it.each(['2026-2-03', '2026-02-3', '26-02-03', '2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-02-03T00:00:00Z'])('rejects %s', (date) => {
    expect(DateStringSchema.safeParse(date).success).toBe(false)
  })

  it('brands the parsed value so an unchecked string is not a date', () => {
    const parsed: DateString = DateStringSchema.parse('2026-11-01')
    expect(parsed).toBe('2026-11-01')
    // @ts-expect-error a string literal has not been through the schema
    const unchecked: DateString = '2026-11-01'
    expect(unchecked).toBeDefined()
  })
})

describe('TOOL_SECTION_KEYS', () => {
  it('lists only registry keys', () => {
    TOOL_SECTION_KEYS.forEach(key => expect(SECTION_KEYS).toContain(key))
    const keys: readonly SectionKey[] = TOOL_SECTION_KEYS
    expect(keys).toHaveLength(4)
  })
})

describe('DatasetSummarySchema accessUrl', () => {
  const summary = {
    identifier: 'DUOS-000123',
    title: 'Example Open Cohort',
    accessManagement: 'open',
    dacName: null,
    consentCodes: ['GRU'],
    participantCount: 1200,
    availableDate: '2026-10-02',
  }

  // Consent returns any absolute http or https provider URL unchanged, with the scheme in any case.
  it.each(['https://example.org/data', 'http://example.org/data', 'HTTPS://example.org/data', 'Http://example.org/data'])('accepts the provider link %s unchanged', (accessUrl) => {
    expect(DatasetSummarySchema.parse({ ...summary, accessUrl }).accessUrl).toBe(accessUrl)
  })

  it('accepts null for a controlled dataset', () => {
    expect(DatasetSummarySchema.safeParse({ ...summary, accessUrl: null }).success).toBe(true)
  })

  it.each(['javascript:alert(1)', 'data:text/html,x', 'ftp://example.org/data', '/datalibrary', '#hero', 'example.org/data', 'https://'])('rejects %s', (accessUrl) => {
    expect(DatasetSummarySchema.safeParse({ ...summary, accessUrl }).success).toBe(false)
  })
})

describe('LookupRequestSchema', () => {
  it('accepts identifiers mode for the editorial section', () => {
    const request: LookupRequestInput = { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123'] }
    expect(LookupRequestSchema.safeParse(request).success).toBe(true)
  })

  it('rejects identifiers mode for a computed section', () => {
    // @ts-expect-error only open-access-datasets is editorial
    const request: LookupRequestInput = { mode: 'identifiers', section: 'latest-data-releases', identifiers: ['DUOS-000123'] }
    expect(LookupRequestSchema.safeParse(request).success).toBe(false)
  })

  it('accepts a ranking that its section allows', () => {
    const request: LookupRequestInput = { mode: 'ranking', section: 'largest-cohorts', ranking: 'largest-cohort', limit: 12 }
    expect(LookupRequestSchema.safeParse(request).success).toBe(true)
  })

  it('rejects a ranking that its section does not allow', () => {
    // @ts-expect-error largest-cohorts accepts only largest-cohort
    const request: LookupRequestInput = { mode: 'ranking', section: 'largest-cohorts', ranking: 'newest' }
    expect(LookupRequestSchema.safeParse(request).success).toBe(false)
  })

  it('accepts the same ranking fields as the config shelf', () => {
    const shelf: Omit<Extract<LookupRequestInput, { section: 'latest-data-releases' }>, 'mode' | 'section'> = {
      ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'],
    }
    const request: LookupRequestInput = { mode: 'ranking', section: 'latest-data-releases', ...shelf }
    const config: Extract<ShowcaseConfigInput['sections']['latest-data-releases'], { enabled: true }> = { enabled: true, ...shelf }
    expect(LookupRequestSchema.safeParse(request).success).toBe(true)
    expect(ShowcaseConfigSchema.shape.sections.shape['latest-data-releases'].safeParse(config).success).toBe(true)
  })

  it('brands identifiers in the parsed request', () => {
    const parsed: LookupRequest = LookupRequestSchema.parse({ mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123'] })
    expect(parsed.mode).toBe('identifiers')
  })
})
