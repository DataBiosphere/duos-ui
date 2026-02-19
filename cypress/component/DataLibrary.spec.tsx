import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataLibrary } from 'src/pages/DataLibrary'

const queryClient = new QueryClient()

const mockMetadataResponse = {
  aggregations: {
    dac: { buckets: [{ key: 'DAC-1', doc_count: 5 }] },
    data_type: { buckets: [{ key: 'Genomic', doc_count: 10 }] },
  },
}

const mockStudiesResponse = {
  aggregations: {
    total_studies: { value: 2 },
    studies: {
      buckets: [
        {
          key: { study_id: 101 },
          study_details: { hits: { hits: [{ _source: { study: { studyName: 'Study One', description: 'Desc One' } } }] } },
          dataset_count: { value: 5 },
          total_participants: { value: 100 },
          dataset_ids: { buckets: [{ key: 1 }, { key: 2 }] },
        },
      ],
    },
  },
}

describe('DataLibrary', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.intercept('POST', '**/api/dataset/search/index/v2', (req) => {
      if (req.body.size === 0 && !req.body.queryTerm) {
        req.reply(mockMetadataResponse)
      }
      else if (req.body.aggs && req.body.aggs.studies) {
        req.reply(mockStudiesResponse)
      }
      else {
        req.reply({ hits: { hits: [], total: { value: 0 } } })
      }
    }).as('searchApi')
  })

  it('renders the data library page', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('DUOS Data Library').should('be.visible')
    cy.contains('Search, filter, and select datasets').should('be.visible')
    cy.get('input[placeholder="Enter search terms"]').should('exist')
  })

  it('renders filter categories', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Access Management').should('exist')
    cy.contains('Data Use').should('exist')
    cy.contains('Data Type').should('exist')
    cy.contains('Participants').should('exist')
  })

  it('toggles filters and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Check a filter
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').check()

    // Clear button should appear
    cy.contains('Clear').should('exist')

    // Check filter is active in UI
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('be.checked')
  })

  it('clears all filters', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?access=controlled']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Clear filters
    cy.contains('Clear').click()

    // Check filter is unchecked
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('not.be.checked')

    // Clear button should disappear
    cy.contains('Clear').should('not.exist')
  })

  it('initializes tab based on URL search params', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?tab=datasets']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Should be on Datasets tab (bold font-weight: 700)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '400')
  })

  it('switches tabs and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Initially on Datasets (due to default in useLibraryUrlState)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')

    // Switch to Studies
    cy.get('button').contains('Studies').click()
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '400')
  })
})
