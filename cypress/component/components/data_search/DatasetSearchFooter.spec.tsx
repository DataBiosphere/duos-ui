import React from 'react'
import { DatasetSearchFooter } from 'src/components/data_search/DatasetSearchFooter'
import { Storage } from 'src/libs/storage'
import { DatasetTerm } from 'src/types/model'

const datasets: DatasetTerm[] = [
  {
    datasetId: 123456,
    study: {
      studyId: 1,
    },
  } as DatasetTerm,
  {
    datasetId: 234567,
    study: {
      studyId: 1,
    },
  } as DatasetTerm,
  {
    datasetId: 345678,
    study: {
      studyId: 2,
    },
  } as DatasetTerm,
]

const oneDatasetProps = {
  selectedDatasets: [123456],
  datasets: datasets,
  onClick: () => {},
}

const oneStudyProps = {
  selectedDatasets: [123456, 234567],
  datasets: datasets,
  onClick: () => {},
}

const twoStudiesProps = {
  selectedDatasets: [123456, 234567, 345678],
  datasets: datasets,
  onClick: () => {},
}

describe('Dataset Search Footer renders correct text and button', () => {
  it('Shows button and single dataset and study text', () => {
    cy.mount(<DatasetSearchFooter {...oneDatasetProps} />)
    cy.contains('1 dataset selected from 1 study')
    cy.contains('Apply for Access')
  })

  it('Shows button and two datasets from one study text', () => {
    cy.mount(<DatasetSearchFooter {...oneStudyProps} />)
    cy.contains('2 datasets selected from 1 study')
    cy.contains('Apply for Access')
  })

  it('Shows button and three datasets from two studies text', () => {
    cy.mount(<DatasetSearchFooter {...twoStudiesProps} />)
    cy.contains('3 datasets selected from 2 studies')
    cy.contains('Apply for Access')
  })
})

describe('Dataset Search Footer renders tooltip and disables apply button', () => {
  it('Disables Apply for Access button when user has no library card', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: null,
      })
      cy.mount(<DatasetSearchFooter {...oneDatasetProps} />)
      cy.contains('button', 'Apply for Access').should('be.disabled')
    })
  })

  it('Shows tooltip when hovering over disabled button', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: null,
      })
      cy.mount(<DatasetSearchFooter {...oneDatasetProps} />)

      cy.contains('button', 'Apply for Access')
        .parent('span')
        .trigger('mouseover')

      cy.get('[role="tooltip"]')
        .should('be.visible')
        .and('contain', 'A Library Card is required to apply for data access')
    })
  })

  it('Enables button when user has a library card', () => {
    cy.window().then(() => {
      cy.stub(Storage, 'getCurrentUser').returns({
        libraryCard: { cardNumber: '12345' },
      })
      cy.mount(<DatasetSearchFooter {...oneDatasetProps} />)
      cy.contains('button', 'Apply for Access').should('not.be.disabled')
    })
  })
})
