import React, { useState } from 'react'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import { AvailableFilters, AssetType, FilterState, LibraryFiltersProps } from 'src/types/library'
import { EMPTY_FILTERS, getFilterSectionsForAsset } from 'src/components/data_library/filterRegistry'

const availableFilters: AvailableFilters = {
  accessManagement: [
    { value: 'controlled', label: 'Controlled', count: 10 },
    { value: 'open', label: 'Open', count: 5 },
  ],
  dataUse: [
    { value: 'HMB', label: 'Health/Medical/Biomedical', count: 8 },
    { value: 'GRU', label: 'General Research Use', count: 3 },
  ],
  dataType: [
    { value: 'Phenotype', label: 'Phenotype', count: 7 },
    { value: 'Genomic', label: 'Genomic', count: 4 },
  ],
  dac: [],
  workspaceTools: [],
  workspacePlatform: [],
  clinicalTrialStatus: [],
  clinicalTrialPhase: [],
  clinicalTrialInterventionType: [],
  clinicalTrialRegistry: [],
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [
    { value: 'HOURS', label: 'HOURS' },
    { value: 'DAYS', label: 'DAYS' },
  ],
  datasetsCited: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
  biospecimenPostMortemIntervalRange: {
    min: 0,
    max: 1000,
  },
  participantCountRange: {
    min: 0,
    max: 1000,
  },
}

const emptyFilters: FilterState = {
  ...EMPTY_FILTERS,
}

const LibraryFiltersWrapper = ({ filters: initialFilters = emptyFilters, onChange: externalOnChange, onClear: externalOnClear, loading = false }: Partial<LibraryFiltersProps>) => {
  const [filters, setFilters] = useState(initialFilters)

  const handleOnChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    if (externalOnChange) {
      externalOnChange(newFilters)
    }
  }

  const handleOnClear = () => {
    const cleared = {
      ...emptyFilters,
    }
    setFilters(cleared)
    if (externalOnClear) {
      externalOnClear()
    }
  }

  return (
    <LibraryFilters
      filters={filters}
      onChange={handleOnChange}
      onClear={handleOnClear}
      sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      loading={loading}
    />
  )
}

describe('LibraryFilters', () => {
  it('renders filter categories', () => {
    cy.mount(<LibraryFiltersWrapper />)

    cy.contains('Access Management').should('be.visible')
    cy.contains('Data Use').should('exist') // might be collapsed but should exist
    cy.contains('Data Type').should('exist')
    cy.contains('Participants').should('exist')
  })

  it('renders filter options with counts', () => {
    cy.mount(<LibraryFiltersWrapper />)

    cy.contains('Controlled (10)').should('be.visible')
    cy.contains('Open (5)').should('be.visible')
  })

  it('calls onChange when a filter is toggled', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<LibraryFiltersWrapper onChange={onChange} />)

    cy.get('input[type="checkbox"]').first().check()
    cy.get('@onChange').should('have.been.calledWith', {
      ...emptyFilters,
      accessManagement: ['controlled'],
    })
  })

  it('calls onClear when clear button is clicked', () => {
    const onClear = cy.stub().as('onClear')
    const activeFilters: FilterState = {
      ...emptyFilters,
      accessManagement: ['controlled'],
    }

    cy.mount(<LibraryFiltersWrapper filters={activeFilters} onClear={onClear} />)

    cy.contains('Clear').should('be.visible').click()
    cy.get('@onClear').should('have.been.called')
    cy.contains('Clear').should('not.exist')
  })

  it('handles participant count changes', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<LibraryFiltersWrapper onChange={onChange} />)

    cy.contains('Participants').click()
    cy.get('label').contains('Minimum').next().find('input').as('minInput')
    cy.get('@minInput').clear()
    cy.get('@minInput').type('10')

    cy.get('@onChange', { timeout: 1000 }).should('have.been.calledWithMatch', {
      participantCount: { min: 10 },
    })
  })

  it('shows skeletons when loading', () => {
    cy.mount(<LibraryFiltersWrapper loading={true} />)

    cy.get('.MuiSkeleton-root').should('have.length', 3)
    cy.contains('Access Management').should('not.exist')
  })

  it('renders only configured filters for presentations', () => {
    cy.mount(
      <LibraryFilters
        filters={emptyFilters}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.PRESENTATIONS, availableFilters)}
      />,
    )

    cy.contains('Datasets Cited?').should('exist')
    cy.contains('Participants').should('not.exist')
    cy.contains('Access Management').should('not.exist')
  })

  it('shows post-mortem warning when range is set without a unit', () => {
    cy.mount(
      <LibraryFilters
        filters={{
          ...emptyFilters,
          biospecimenPostMortemInterval: { min: 2 },
        }}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )

    cy.contains('Post-mortem Interval').click()
    cy.contains('Select a post-mortem interval unit to avoid ambiguous results.').should('exist')
  })

  it('hides post-mortem warning when a unit is selected', () => {
    cy.mount(
      <LibraryFilters
        filters={{
          ...emptyFilters,
          biospecimenPostMortemInterval: { min: 2 },
          biospecimenPostMortemIntervalUnit: ['HOURS'],
        }}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )

    cy.contains('Select a post-mortem interval unit to avoid ambiguous results.').should('not.exist')
  })
})

describe('LibraryFilters — collapseable panel', () => {
  const mountWithToggle = (isOpen: boolean, onToggle = cy.stub().as('onToggle')) => {
    cy.mount(
      <LibraryFilters
        filters={emptyFilters}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        isOpen={isOpen}
        onToggle={onToggle}
      />,
    )
  }

  it('shows filter content and collapse button when open', () => {
    mountWithToggle(true)
    cy.contains('Filters').should('be.visible')
    cy.contains('Access Management').should('be.visible')
    cy.get('[aria-label="Collapse filters"]').should('exist')
  })

  it('hides filter content and shows expand button when closed', () => {
    mountWithToggle(false)
    cy.contains('Access Management').should('not.exist')
    cy.contains('Filters').should('not.exist')
    cy.get('[aria-label="Expand filters"]').should('exist')
  })

  it('calls onToggle when the chevron button is clicked while open', () => {
    mountWithToggle(true)
    cy.get('[aria-label="Collapse filters"]').click()
    cy.get('@onToggle').should('have.been.calledOnce')
  })

  it('calls onToggle when expand button is clicked while closed', () => {
    mountWithToggle(false)
    cy.get('[aria-label="Expand filters"]').click()
    cy.get('@onToggle').should('have.been.calledOnce')
  })

  it('does not render the toggle button when onToggle is not provided', () => {
    cy.mount(
      <LibraryFilters
        filters={emptyFilters}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      />,
    )
    cy.get('[aria-label="Collapse filters"]').should('not.exist')
    cy.get('[aria-label="Expand filters"]').should('not.exist')
  })

  it('does not show Clear button when closed even with active filters', () => {
    cy.mount(
      <LibraryFilters
        filters={{ ...emptyFilters, accessManagement: ['controlled'] }}
        onChange={cy.stub()}
        onClear={cy.stub()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        isOpen={false}
        onToggle={cy.stub()}
      />,
    )
    cy.contains('Clear').should('not.exist')
  })
})
