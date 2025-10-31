import React from 'react'
import { mount } from 'cypress/react'
import { StudyDetails } from 'src/components/study_details/StudyDetails'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DataSet } from 'src/libs/ajax/DataSet'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    participantCount: 1,
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
    },
  },
  {
    datasetId: 123457,
    datasetIdentifier: `DUOS-123457`,
    datasetName: 'Some Dataset 2',
    participantCount: 2,
    study: {
      studyId: 1,
      studyName: 'study name',
      description: 'study description',
      phenotype: 'phenotype',
      species: 'species',
      piName: 'piName',
      dataCustodianEmail: ['custodian1@foo.bar', 'custodian2@foo.bar'],
    },
  },
]

describe('Study details test', () => {
  beforeEach(() => {
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve(datasets))
    mount(
      <MemoryRouter initialEntries={[`/studies/1`]}>
        <Routes>
          <Route path="/studies/:studyId" element={<StudyDetails />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('shows the appropriate data for fields', () => {
    cy.contains('DUOS-S' + datasets[0].study.studyId).should('exist')
    cy.contains(datasets[0].study.studyName).should('exist')
    cy.contains(datasets[0].study.description).should('exist')
    cy.contains((datasets[0].participantCount + datasets[1].participantCount).toString()).should('exist')
    cy.contains(datasets[0].study.phenotype).should('exist')
    cy.contains(datasets[0].study.species).should('exist')
    cy.contains(datasets[0].study.piName).should('exist')
    cy.contains(datasets[0].study.dataCustodianEmail.join(', ')).should('exist')
    cy.get('[role=row]').should('have.length', datasets.length + 1)
  })

  it('displays DatasetSearchFooter when dataset is selected', () => {
    cy.get('.row-data-0').find('input').click()
    cy.contains('1 dataset selected from 1 study').should('exist')
  })

  it('allows navigation back to datalibrary', () => {
    cy.get('#link_datalibrary').should('have.attr', 'href', '/datalibrary')
  })
})
