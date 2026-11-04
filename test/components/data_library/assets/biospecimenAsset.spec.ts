/**
 * Unit tests for biospecimenAsset — the Biospecimens AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { biospecimenAsset } from 'src/components/data_library/assets/biospecimenAsset'
import { ALL_SEARCH_FIELDS } from 'src/components/data_library/assets'
import { BiospecimenAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  BiospecimenStudyAggregationBucket,
  PartialBiospecimenAsset,
  QueryClause,
} from 'src/types/elastic'
import { BioSpecimenType, BioSpecimenPreservationMethod, Sex } from 'src/types/model'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  biospecimens: Array<{
    biospecimenId?: number
    sampleId?: string | number
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
                  sampleId: b.sampleId,
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
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.sampleId')
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.donorId')
    expect(biospecimenAsset.searchFields).toContain('study.assets.biospecimens.specimenType')
  })

  it('excludes dateOfCollection from searchFields (date field)', () => {
    expect(biospecimenAsset.searchFields).not.toContain(
      'study.assets.biospecimens.dateOfCollection',
    )
  })

  it('searches sampleId, not the server-assigned biospecimenId, on every tab', () => {
    expect(ALL_SEARCH_FIELDS).toContain('study.assets.biospecimens.sampleId')
    expect(ALL_SEARCH_FIELDS).not.toContain('study.assets.biospecimens.biospecimenId')
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
        { biospecimenId: 1, donorId: 'D-001' },
        { biospecimenId: 2, donorId: 'D-002' },
      ]),
      makeBucket(2, [{ biospecimenId: 3, donorId: 'D-003' }]),
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
            biospecimenId: 12345,
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
    expect(row.biospecimenId).toBe(12345)
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

  it('uses the server-assigned row id as the row id', () => {
    const response = makeResponse([makeBucket(99, [{ biospecimenId: 17 }])])
    const row = biospecimenAsset.transformResponse(response, pagination).items[0] as BiospecimenAsset
    expect(row.biospecimenId).toBe(17)
    expect(biospecimenAsset.getRowId(row)).toBe(17)
  })

  it('renders no row for an entry without a row id', () => {
    const response = makeResponse([makeBucket(99, [{ donorId: 'D-001' }, { biospecimenId: 17 }])])
    const result = biospecimenAsset.transformResponse(response, pagination)
    expect(result.items.map(row => (row as BiospecimenAsset).biospecimenId)).toEqual([17])
    expect(result.total).toBe(1)
  })

  it('renders no row for an indexed element that is not an object', () => {
    const bucket = makeBucket(99, [{ biospecimenId: 17 }])
    const entries = bucket.study_details?.hits?.hits?.[0]?._source?.study?.assets?.biospecimens
    entries?.push(...(['legacy', null, 7, [18]] as unknown as PartialBiospecimenAsset[]))
    const result = biospecimenAsset.transformResponse(makeResponse([bucket]), pagination)
    expect(result.items.map(row => (row as BiospecimenAsset).biospecimenId)).toEqual([17])
  })

  it.each([
    ['an indexed sampleId', { sampleId: 'S-1' }, 'S-1'],
    ['a trimmed sampleId', { sampleId: '  S-1 ' }, 'S-1'],
    ['a numeric sampleId as text', { sampleId: 0 }, '0'],
    ['a blank sampleId', { sampleId: '  ' }, ''],
    ['no sampleId, never the row id', {}, ''],
  ])('shows %s as the sample id', (_label, biospecimen, expected) => {
    const response = makeResponse([makeBucket(5, [{ biospecimenId: 17, ...biospecimen }])])
    const row = biospecimenAsset.transformResponse(response, pagination).items[0] as BiospecimenAsset
    expect(row.sampleId).toBe(expected)
  })

  it('applies client-side pagination', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: i + 1,
      donorId: `DONOR-${i}`,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])

    const page0 = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as BiospecimenAsset).biospecimenId).toBe(1)

    const page1 = biospecimenAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as BiospecimenAsset).biospecimenId).toBe(11)

    const page2 = biospecimenAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as BiospecimenAsset).biospecimenId).toBe(21)
  })

  it('reports total as the number of all biospecimens across all studies (not just page)', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: i + 1,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])
    const result = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty/default values for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{ biospecimenId: 1 }])])
    const row = biospecimenAsset.transformResponse(response, pagination).items[0] as BiospecimenAsset
    expect(row.biospecimenId).toBe(1)
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
          biospecimenId: 1,
          specimenType: BioSpecimenType.BLOOD,
          dateOfCollection: '2024-01-01',
          organization: 'Org',
        },
        {
          biospecimenId: 2,
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
    expect((result.items[0] as BiospecimenAsset).biospecimenId).toBe(1)
  })
})

describe('biospecimenAsset — getRowId', () => {
  it('returns the biospecimenId of the row', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 789,
      studyId: 1,
      studyName: '',
      donorId: 'D-001',
      specimenType: BioSpecimenType.BLOOD,
      preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
      organization: 'Biobank',
    }
    expect(biospecimenAsset.getRowId(row)).toBe(789)
  })
})

describe('biospecimenAsset — isRowSelectable', () => {
  it('always returns false — biospecimens do not participate in access requests', () => {
    const row: BiospecimenAsset = {
      biospecimenId: 1,
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
      biospecimenId: 1,
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
      biospecimenId: 1,
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
    expect(fields).toContain('sampleId')
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
