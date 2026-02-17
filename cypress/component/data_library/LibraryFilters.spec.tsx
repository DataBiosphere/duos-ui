import React, { useState } from 'react'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import { AvailableFilters, FilterState, LibraryFiltersProps } from 'src/types/library'

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
  participantCountRange: {
    min: 0,
    max: 1000,
  },
}

const emptyFilters: FilterState = {
  accessManagement: [],
  dataUse: [],
  dataType: [],
  dac: [],
  participantCount: {},
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
      availableFilters={availableFilters}
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
})
