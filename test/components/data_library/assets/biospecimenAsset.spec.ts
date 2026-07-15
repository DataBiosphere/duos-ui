/**
 * Unit tests for biospecimenAsset — the Biospecimens AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { biospecimenAsset } from 'src/components/data_library/assets/biospecimenAsset'
import { BiospecimenAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  BiospecimenStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { BioSpecimenType, BioSpecimenPreservationMethod, Sex } from 'src/types/model'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  biospecimens: Array<{
    biospecimenId?: string
    donorId?: string
    specimenType?: BioSpecimenType
    preservationMethod?: BioSpecimenPreservationMethod
    dateOfCollection?: string
    sex?: Sex
    age?: number
    race?: string
    organization?: string
  }> = [],
  studyName = 'Test Study',
): BiospecimenStudyAggregationBucket => ({
  key: studyId,
  doc_count: biospecimens.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                biospecimens: biospecimens.map(b => ({
                  biospecimenId: b.biospecimenId,
                  donorId: b.donorId,
                  specimenType: b.specimenType,
                  preservationMethod: b.preservationMethod,
                  dateOfCollection: b.dateOfCollection,
                  sex: b.sex,
                  age: b.age,
                  race: b.race,
                  organization: b.organization,
                })),
              },
            },
          },
        },
      ],
    },
  },
})

const makeResponse = (
  buckets: BiospecimenStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('biospecimenAsset — label', () => {
  it('has singular "Biospecimen" and plural "Biospecimens"', () => {
    expect(biospecimenAsset.label.singular).toBe('Biospecimen')
    expect(biospecimenAsset.label.plural).toBe('Biospecimens')
  })
})

describe('biospecimenAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(biospecimenAsset.sortingMode).toBe('client')
  })
})

describe('biospecimenAsset — searchFields', () => {
  it('includes biospecimen-specific fields', () => {
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.biospecimenId')
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.donorId')
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.specimenType')
  })

  it('excludes dateOfCollection from searchFields (date field)', () => {
    expect(biospecimenAsset.searchFields).not.toContain(
      'study.assets.biospecimens.dateOfCollection',
    )
  })

  it('includes study-level fields', () => {
    expect(biospecimenAsset.searchFields).toContain('study.studyName')
    expect(biospecimenAsset.searchFields).toContain('study.piName')
  })
})

describe('biospecimenAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study.assets.biospecimens' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe(
      'study.assets.biospecimens',
    )
  })

  it('omits filter when filterQuery is empty', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = biospecimenAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'biospecimenId', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = biospecimenAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('biospecimenAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = biospecimenAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens biospecimens from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [
        { biospecimenId: 'BS-001', donorId: 'D-001' },
        { biospecimenId: 'BS-002', donorId: 'D-002' },
      ]),
      makeBucket(2, [{ biospecimenId: 'BS-003', donorId: 'D-003' }]),
    ])
    const result = biospecimenAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to BiospecimenAsset', () => {
    const response = makeResponse([
      makeBucket(
        42,
        [
          {
            biospecimenId: 'BS-12345',
            donorId: 'DONOR-ABC',
            specimenType: BioSpecimenType.BLOOD,
            preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
            dateOfCollection: '2023-01-15',
            sex: Sex.FEMALE,
            age: 45,
            race: 'African American',
            organization: 'Test Biobank',
          },
        ],
        'NHGRI Study',
      ),
    ])
    const result = biospecimenAsset.transformResponse(response, pagination)
    const row = result.items[0] as BiospecimenAsset
    expect(row.biospecimenId).toBe('BS-12345')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.donorId).toBe('DONOR-ABC')
    expect(row.specimenType).toBe(BioSpecimenType.BLOOD)
    expect(row.preservationMethod).toBe(BioSpecimenPreservationMethod.FRESH_FROZEN)
    expect(row.dateOfCollection).toBe('2023-01-15')
    expect(row.sex).toBe(Sex.FEMALE)
    expect(row.age).toBe(45)
    expect(row.race).toBe('African American')
    expect(row.organization).toBe('Test Biobank')
  })

  it('falls back to composite key when biospecimenId is absent', () => {
    const response = makeResponse([makeBucket(99, [{ donorId: 'D-001' }])])
    const result = biospecimenAsset.transformResponse(response, pagination)
    const row = result.items[0] as BiospecimenAsset
    expect(row.biospecimenId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: `BS-${String(i).padStart(3, '0')}`,
      donorId: `DONOR-${i}`,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])

    const page0 = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as BiospecimenAsset).biospecimenId).toBe('BS-000')

    const page1 = biospecimenAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as BiospecimenAsset).biospecimenId).toBe('BS-010')

    const page2 = biospecimenAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as BiospecimenAsset).biospecimenId).toBe('BS-020')
  })

  it('reports total as the number of all biospecimens across all studies (not just page)', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: `BS-${i}`,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])
    const result = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty/default values for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = biospecimenAsset.transformResponse(response, pagination).items[0] as BiospecimenAsset
    expect(row.biospecimenId).toBe('1-0')
    expect(row.donorId).toBe('')
    expect(row.organization).toBe('')
    expect(row.dateOfCollection).toBe('')
    expect(row.age).toBe(0)
  })

  it('handles a study bucket with no biospecimens gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = biospecimenAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('returns only matching biospecimens when filtered within a shared study', () => {
    const response = makeResponse([
      makeBucket(1, [
        {
          biospecimenId: 'BS-HOURS',
          specimenType: BioSpecimenType.BLOOD,
          dateOfCollection: '2024-01-01',
          organization: 'Org',
        },
        {
          biospecimenId: 'BS-DAYS',
          specimenType: BioSpecimenType.TISSUE,
          dateOfCollection: '2024-02-01',
          organization: 'Org',
        },
      ]),
    ])

    const result = biospecimenAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      biospecimenType: [BioSpecimenType.BLOOD],
    })

    expect(result.items).toHaveLength(1)
    expect((result.items[0] as BiospecimenAsset).biospecimenId).toBe('BS-HOURS')
  })
})

describe('biospecimenAsset — getRowId', () => {
  it('returns the biospecimenId of the row', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 'BS-xyz-789',
      studyId: 1,
      studyName: '',
      donorId: 'D-001',
      specimenType: BioSpecimenType.BLOOD,
      preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
      organization: 'Biobank',
    }
    expect(biospecimenAsset.getRowId(row)).toBe('BS-xyz-789')
  })
})

describe('biospecimenAsset — isRowSelectable', () => {
  it('always returns false — biospecimens do not participate in access requests', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 'BS-001',
      studyId: 1,
      studyName: 'Test',
      donorId: 'D-001',
      specimenType: BioSpecimenType.BLOOD,
      preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
      organization: 'Biobank',
    }
    expect(biospecimenAsset.isRowSelectable(row)).toBe(false)
  })
})

describe('biospecimenAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 'BS-001',
      studyId: 1,
      studyName: 'Test',
      donorId: 'D-001',
      specimenType: BioSpecimenType.BLOOD,
      preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
      organization: 'Biobank',
    }
    const result = biospecimenAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).toBe(0)
  })
})

describe('biospecimenAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = biospecimenAsset.selectionToDatasetIds([], ['BS-001', 'BS-002'])
    expect(result).toEqual([])
  })
})

describe('biospecimenAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 'BS-001',
      studyId: 42,
      studyName: 'Test',
      donorId: 'D-001',
      specimenType: BioSpecimenType.BLOOD,
      preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
      organization: 'Biobank',
    }
    const result = biospecimenAsset.getStudyIdsForSelection([row], [1])
    expect(result).toEqual([])
  })
})

describe('biospecimenAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = biospecimenAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = biospecimenAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('studyName')
    expect(fields).toContain('biospecimenId')
    expect(fields).toContain('specimenType')
    expect(fields).toContain('donorId')
    expect(fields).toContain('dateOfCollection')
  })

  it('produces the same result when called with or without props', () => {
    const a = biospecimenAsset.makeColumns()
    const b = biospecimenAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
