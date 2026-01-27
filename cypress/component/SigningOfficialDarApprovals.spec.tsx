import React from 'react'
import SigningOfficialDarApprovals from 'src/pages/signing_official_console/SigningOfficialDarApprovals'
import { Collections } from 'src/libs/ajax/Collections'
import { BrowserRouter } from 'react-router-dom'
import { USER_ROLES } from 'src/libs/utils'

const mockCollectionList = [
  {
    darCollectionId: 1,
    darCode: 'DAR-1',
    requiresSOApproval: true,
    actions: [],
    name: 'Collection 1',
    datasets: [],
    datasetCount: 1,
    status: 'Open',
    submissionDate: '2022-01-01',
    researcherName: 'Researcher',
    institutionName: 'Institution',
    dacNames: ['DAC1'],
    datasetIds: [1],
  },
  {
    darCollectionId: 2,
    darCode: 'DAR-2',
    requiresSOApproval: false,
    actions: [],
    name: 'Collection 2',
    datasets: [],
    datasetCount: 1,
    status: 'Open',
    submissionDate: '2022-01-01',
    researcherName: 'Researcher',
    institutionName: 'Institution',
    dacNames: ['DAC1'],
    datasetIds: [2],
  },
  {
    darCollectionId: 3,
    darCode: 'DAR-3',
    requiresSOApproval: true,
    actions: ['Approve'],
    name: 'Collection 1',
    datasets: [],
    datasetCount: 1,
    status: 'Open',
    submissionDate: '2022-01-01',
    researcherName: 'Researcher',
    institutionName: 'Institution',
    dacNames: ['DAC1'],
    datasetIds: [3],
  },
]

describe('SigningOfficialDarApprovals', () => {
  beforeEach(() => {
    cy.stub(Collections, 'getCollectionSummariesByRoleName').resolves(mockCollectionList)
  })

  it('renders and filters collections requiring approval', () => {
    cy.mount(
      <BrowserRouter>
        <SigningOfficialDarApprovals />
      </BrowserRouter>,
    )

    cy.contains('My Institution\'s Data Access Approvals').should('exist')

    cy.wrap(Collections.getCollectionSummariesByRoleName).should('be.calledWith', USER_ROLES.signingOfficial)

    cy.contains('DAR-1').should('exist')
    cy.contains('DAR-2').should('not.exist')
    cy.contains('DAR-3').should('exist')
  })

  it('renders the Approve button for collections requiring approval', () => {
    cy.viewport(1200, 800)
    cy.mount(
      <BrowserRouter>
        <SigningOfficialDarApprovals />
      </BrowserRouter>,
    )

    cy.get('#signingOfficial-approve-1').should('not.exist')
    cy.get('#signingOfficial-approve-2').should('not.exist')
    cy.get('#signingOfficial-approve-3').should('exist')
    cy.get('#signingOfficial-approve-3').should('contain', 'Approve')
  })
})
