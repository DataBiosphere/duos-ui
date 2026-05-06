/**
 * Unit tests for biospecimenAsset — the Biospecimens AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { biospecimenAsset } from 'src/components/data_library/assets/biospecimenAsset'
import { BiospecimenAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  BiospecimenStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { BioSpecimenType, BioSpecimenPreservationMethod, Sex } from 'src/types/model'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal BiospecimenStudyAggregationBucket */
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

/** Wrap buckets in a full ElasticsearchResponse */
const makeResponse = (
  buckets: BiospecimenStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('biospecimenAsset — label', () => {
  it('has singular "Biospecimen" and plural "Biospecimens"', () => {
    expect(biospecimenAsset.label.singular).to.equal('Biospecimen')
    expect(biospecimenAsset.label.plural).to.equal('Biospecimens')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('biospecimenAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(biospecimenAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('biospecimenAsset — searchFields', () => {
  it('includes biospecimen-specific fields', () => {
    expect(biospecimenAsset.searchFields).to.include('study.assets.biospecimens.biospecimenId')
    expect(biospecimenAsset.searchFields).to.include('study.assets.biospecimens.donorId')
    expect(biospecimenAsset.searchFields).to.include('study.assets.biospecimens.specimenType')
  })

  it('excludes dateOfCollection from searchFields (date field)', () => {
    expect(biospecimenAsset.searchFields).to.not.include(
      'study.assets.biospecimens.dateOfCollection',
    )
  })

  it('includes study-level fields', () => {
    expect(biospecimenAsset.searchFields).to.include('study.studyName')
    expect(biospecimenAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('biospecimenAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study.assets.biospecimens' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal(
      'study.assets.biospecimens',
    )
  })

  it('omits filter when filterQuery is empty', () => {
    const q = biospecimenAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = biospecimenAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'biospecimenId', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = biospecimenAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('biospecimenAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = biospecimenAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
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
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
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
    expect(row.biospecimenId).to.equal('BS-12345')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.donorId).to.equal('DONOR-ABC')
    expect(row.specimenType).to.equal(BioSpecimenType.BLOOD)
    expect(row.preservationMethod).to.equal(BioSpecimenPreservationMethod.FRESH_FROZEN)
    expect(row.dateOfCollection).to.equal('2023-01-15')
    expect(row.sex).to.equal(Sex.FEMALE)
    expect(row.age).to.equal(45)
    expect(row.race).to.equal('African American')
    expect(row.organization).to.equal('Test Biobank')
  })

  it('falls back to composite key when biospecimenId is absent', () => {
    const response = makeResponse([makeBucket(99, [{ donorId: 'D-001' }])])
    const result = biospecimenAsset.transformResponse(response, pagination)
    const row = result.items[0] as BiospecimenAsset
    expect(row.biospecimenId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: `BS-${String(i).padStart(3, '0')}`,
      donorId: `DONOR-${i}`,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])

    const page0 = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as BiospecimenAsset).biospecimenId).to.equal('BS-000')

    const page1 = biospecimenAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as BiospecimenAsset).biospecimenId).to.equal('BS-010')

    const page2 = biospecimenAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as BiospecimenAsset).biospecimenId).to.equal('BS-020')
  })

  it('reports total as the number of all biospecimens across all studies (not just page)', () => {
    const biospecimens = Array.from({ length: 30 }, (_, i) => ({
      biospecimenId: `BS-${i}`,
    }))
    const response = makeResponse([makeBucket(1, biospecimens)])
    const result = biospecimenAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('returns empty/default values for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = biospecimenAsset.transformResponse(response, pagination).items[0] as BiospecimenAsset
    expect(row.biospecimenId).to.equal('1-0') // composite key fallback
    expect(row.donorId).to.equal('')
    expect(row.organization).to.equal('')
    expect(row.dateOfCollection).to.equal('')
    expect(row.age).to.equal(0) // default age
  })

  it('handles a study bucket with no biospecimens gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = biospecimenAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
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

    expect(result.items).to.have.length(1)
    expect((result.items[0] as BiospecimenAsset).biospecimenId).to.equal('BS-HOURS')
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

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
    expect(biospecimenAsset.getRowId(row)).to.equal('BS-xyz-789')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

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
    expect(biospecimenAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

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
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('biospecimenAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = biospecimenAsset.selectionToDatasetIds([], ['BS-001', 'BS-002'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

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
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('biospecimenAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = biospecimenAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = biospecimenAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('studyName')
    expect(fields).to.include('biospecimenId')
    expect(fields).to.include('specimenType')
    expect(fields).to.include('donorId')
    expect(fields).to.include('dateOfCollection')
  })

  it('produces the same result when called with or without props', () => {
    const a = biospecimenAsset.makeColumns()
    const b = biospecimenAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
