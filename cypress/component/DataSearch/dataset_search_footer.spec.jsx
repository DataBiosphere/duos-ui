import { React } from 'react'
import { DatasetSearchFooter } from 'src/components/data_search/DatasetSearchFooter'

const datasets = [
  {
    datasetId: 123456,
    study: {
      studyId: 1,
    },
  },
  {
    datasetId: 234567,
    study: {
      studyId: 1,
    },
  },
  {
    datasetId: 345678,
    study: {
      studyId: 2,
    },
  },
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
