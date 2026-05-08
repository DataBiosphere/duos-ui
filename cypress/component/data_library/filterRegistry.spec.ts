import {
  buildFilterClausesForAsset,
  EMPTY_FILTERS,
  getFilterSectionsForAsset,
  sanitizeFiltersForAsset,
} from 'src/components/data_library/filterRegistry'
import { AssetType, AvailableFilters, FilterState } from 'src/types/library'

const availableFilters: AvailableFilters = {
  accessManagement: [],
  dataUse: [],
  dataType: [],
  dac: [],
  workspaceTools: [],
  workspacePlatform: [],
  clinicalTrialStatus: [],
  clinicalTrialPhase: [],
  clinicalTrialInterventionType: [],
  clinicalTrialRegistry: [],
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [],
  datasetsCited: [],
  biospecimenPostMortemIntervalRange: { min: 0, max: 10 },
  participantCountRange: { min: 0, max: 10 },
}

describe('filterRegistry', () => {
  const filters: FilterState = {
    ...EMPTY_FILTERS,
    accessManagement: ['controlled'],
    dataType: ['Genomic'],
    participantCount: { min: 10, max: 100 },
    datasetsCited: true,
  }

  it('returns asset-specific visible filters', () => {
    const publicationFilters = getFilterSectionsForAsset(AssetType.PUBLICATIONS, availableFilters)
    expect(publicationFilters.map(section => section.key)).to.deep.equal([])
  })

  it('returns presentation-specific datasets cited filter', () => {
    const presentationFilters = getFilterSectionsForAsset(AssetType.PRESENTATIONS, availableFilters)
    expect(presentationFilters.map(section => section.key)).to.deep.equal(['datasetsCited'])
  })

  it('sanitizes incompatible filters for target asset type', () => {
    const sanitized = sanitizeFiltersForAsset(AssetType.PRESENTATIONS, filters)

    expect(sanitized.datasetsCited).to.equal(true)
    expect(sanitized.accessManagement).to.deep.equal([])
    expect(sanitized.dataType).to.deep.equal([])
    expect(sanitized.participantCount).to.deep.equal({})
  })

  it('preserves all current filters for datasets', () => {
    const sanitized = sanitizeFiltersForAsset(AssetType.DATASETS, filters)
    expect(sanitized.accessManagement).to.deep.equal(['controlled'])
    expect(sanitized.dataType).to.deep.equal(['Genomic'])
    expect(sanitized.participantCount).to.deep.equal({ min: 10, max: 100 })
    expect(sanitized.datasetsCited).to.equal(undefined)
  })

  it('builds query clauses only for filters visible on the selected asset', () => {
    const clauses = buildFilterClausesForAsset(AssetType.PRESENTATIONS, filters)
    expect(clauses).to.have.length(1)
    const serialized = JSON.stringify(clauses)

    expect(serialized).to.include('study.assets.presentations.citation')
    expect(serialized).to.not.include('accessManagement.keyword')
    expect(serialized).to.not.include('participantCount')
  })
})
