import React from 'react'
import { cloneDeep } from 'lodash'
import {
  GeneralStudyInformation, GeneralStudyInformationProps,
} from 'src/pages/data_submission/v2/GeneralStudyInformation'

let propCopy = {} as GeneralStudyInformationProps

const props = {
  setStudy: () => {},
  study: {},
}

beforeEach(() => {
  propCopy = cloneDeep(props) as unknown as GeneralStudyInformationProps
})

describe('GeneralStudyInformation - Tests', () => {
  it('should mount with all the fields', () => {
    cy.mount(<GeneralStudyInformation {...propCopy} />)
    cy.get('.formField-container').should('have.length', 14)

    cy.get('.formField-name').should('have.length', 1)
    cy.get('.formField-studyType').should('have.length', 1)
    cy.get('.formField-description').should('have.length', 1)
    cy.get('.formField-tags').should('have.length', 1)
    cy.get('.formField-dataTypes').should('have.length', 1)
    cy.get('.formField-phenotypeIndication').should('have.length', 1)
    cy.get('.formField-species').should('have.length', 1)
    cy.get('.formField-piName').should('have.length', 1)
    cy.get('.formField-piEmail').should('have.length', 1)
    cy.get('.formField-dataCustodianEmail').should('have.length', 1)
    cy.get('#alternativeDataSharingPlanTargetDeliveryDate').should('exist')
    cy.get('#alternativeDataSharingPlanTargetPublicReleaseDate').should('exist')
    cy.get('.formField-publicVisibility').should('have.length', 1)
    cy.get('.formField-throughBioId').should('have.length', 1)
  })

  it('should allow edit in all fields', () => {
    cy.spy(propCopy, 'setStudy').as('setStudySpy')
    cy.mount(<GeneralStudyInformation {...propCopy} />)
    cy.get('.formField-name').type('A Study Name')
    cy.get('@setStudySpy').its('callCount').should('eq', 12)
    cy.get('.formField-studyType').type('Observational{enter}')
    cy.get('@setStudySpy').its('callCount').should('eq', 13)
    cy.get('.formField-description').type('My description')
    cy.get('@setStudySpy').its('callCount').should('eq', 27)
    cy.get('.formField-dataTypes').type('dt{enter}')
    cy.get('@setStudySpy').its('callCount').should('eq', 28)
    cy.get('.formField-phenotypeIndication').type('pi')
    cy.get('@setStudySpy').its('callCount').should('eq', 30)
    cy.get('.formField-species').type('species')
    cy.get('@setStudySpy').its('callCount').should('eq', 37)
    cy.get('.formField-piName').type('name')
    cy.get('@setStudySpy').its('callCount').should('eq', 41)
    cy.get('#dataCustodianEmail > .css-13cymwt-control > .css-hlgwow > .css-19bb58m').type('abc@def.ghi{enter}')
    cy.get('@setStudySpy').its('callCount').should('eq', 42)
    cy.get('#alternativeDataSharingPlanTargetDeliveryDate').type('2025-04-01')
    cy.get('@setStudySpy').its('callCount').should('eq', 43)
    cy.get('#alternativeDataSharingPlanTargetPublicReleaseDate').type('2025-04-01')
    cy.get('@setStudySpy').its('callCount').should('eq', 44)
    cy.get(':nth-child(2) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()
    cy.get('@setStudySpy').its('callCount').should('eq', 45)
    cy.get(':nth-child(1) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()
    cy.get('@setStudySpy').its('callCount').should('eq', 46)
    cy.get('.formField-piEmail').type('name@anywhere.biz')
    cy.get('@setStudySpy').its('callCount').should('eq', 63)
    cy.get('.formField-tags').type('tag1{enter}tag2{enter}')
    cy.get('@setStudySpy').its('callCount').should('eq', 65)
    cy.get('.formField-throughBioId').type('test-bio-id')
    cy.get('@setStudySpy').its('callCount').should('eq', 76)
  })
})
