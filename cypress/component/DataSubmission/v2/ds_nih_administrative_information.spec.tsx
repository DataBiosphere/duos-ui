import React from 'react'
import { cloneDeep } from 'lodash'
import { Study, NihAnvilUse, StudyProperty } from 'src/pages/data_submission/v2/v2-models'
import {
  NihAdministrativeInformation,
  NihAdministrativeInformationProps,
} from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { InstitutionInterface } from 'src/types/model'

let propCopy = { study: { properties: [] as StudyProperty[] } as Study } as NihAdministrativeInformationProps

const props = {
  setStudy: () => {},
  study: { properties: [] },
}

const mockInstitutions = [
  {
    id: 1,
    name: 'Test Institution 1',
    domains: ['test1.edu'],
    signingOfficials: [{ userId: '1', displayName: 'User 1', email: 'email1' }],
    createDate: 'Feb 1, 2023',
    createUser: 1,
    createUserId: 1,
  } as unknown as InstitutionInterface,
  {
    id: 2,
    name: 'Test Institution 2',
    domains: ['test2.edu'],
    signingOfficials: [{ userId: '2', displayName: 'User 2', email: 'email2' }],
    createDate: 'Jul 1, 2025',
    createUser: 1,
    createUserId: 1,
    updateDate: 'Jul 2, 2025',
    updateUser: 1,
    updateUserId: 1,
  } as unknown as InstitutionInterface,
]

beforeEach(() => {
  propCopy = cloneDeep(props) as unknown as NihAdministrativeInformationProps
  cy.initApplicationConfig()
  cy.intercept('GET', '/api/institutions', (req) => {
    req.reply({
      delay: 1000, // Simulate a delay to show loading state
      body: mockInstitutions,
    })
  })
})

describe('NihAdministrativeInformation - Tests', () => {
  it('should mount without any fields in the NihAdministrativeInformation', () => {
    cy.mount(<NihAdministrativeInformation {...propCopy} />)
    cy.get('.formField-container').should('not.exist')
  })

  it('fields should be visible if the user selected "YES', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES))
    cy.mount(<NihAdministrativeInformation {...propCopy} />)
    cy.get('#piInstitution').should('be.visible')
    cy.get('#nihGrantContractNumber').should('be.visible')
    cy.get('#nihICsSupportingStudy').should('be.visible')
    cy.get('#nihProgramOfficerName').should('be.visible')
    cy.get('#nihInstitutionCenterSubmission').should('be.visible')
    cy.get('#nihGenomicProgramAdministratorName').should('be.visible')
    cy.get('#multiCenterStudy').should('be.visible')
    cy.get('#controlledAccessRequiredForGenomicSummaryResultsGSR').should('be.visible')
  })

  it('should hide dbGaP form fields if the user selected "NO', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO))
    cy.mount(<NihAdministrativeInformation {...propCopy} />)
    cy.get('.formField-container').should('not.exist')
    cy.get('#piInstitution').should('not.exist')
    cy.get('#nihGrantContractNumber').should('not.exist')
    cy.get('#nihICsSupportingStudy').should('not.exist')
    cy.get('#nihProgramOfficerName').should('not.exist')
    cy.get('#nihInstitutionCenterSubmission').should('not.exist')
    cy.get('#nihGenomicProgramAdministratorName').should('not.exist')
    cy.get('#multiCenterStudy').should('not.exist')
    cy.get('#controlledAccessRequiredForGenomicSummaryResultsGSR').should('not.exist')
  })
})
