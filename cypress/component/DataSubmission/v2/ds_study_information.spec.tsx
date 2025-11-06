import React from 'react'
import { mount } from 'cypress/react'
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
  propCopy = cloneDeep(props)
})

describe('GeneralStudyInformation - Tests', () => {
  it('should mount with all the fields', () => {
    mount(<GeneralStudyInformation {...propCopy} />)
    cy.get('.formField-container').should('have.length', 11)

    cy.get('.formField-studyName').should('have.length', 1)
    cy.get('.formField-studyType').should('have.length', 1)
    cy.get('.formField-studyDescription').should('have.length', 1)
    cy.get('.formField-dataTypes').should('have.length', 1)
    cy.get('.formField-phenotypeIndication').should('have.length', 1)
    cy.get('.formField-species').should('have.length', 1)
    cy.get('.formField-piName').should('have.length', 1)
    cy.get('.formField-dataCustodianEmail').should('have.length', 1)
    cy.get('#alternativeDataSharingPlanTargetDeliveryDate').should('exist')
    cy.get('#alternativeDataSharingPlanTargetPublicReleaseDate').should('exist')
    cy.get('.formField-publicVisibility').should('have.length', 1)
  })

  it('should allow edit in all fields', () => {
    cy.spy(propCopy, 'setStudy').as('setStudySpy')
    mount(<GeneralStudyInformation {...propCopy} />)
    cy.get('.formField-studyName').type('A Study Name')
    cy.get('@setStudySpy').its('callCount').should('eq', 12)
    cy.get('.formField-studyType').type('Observational{enter}')
    cy.get('@setStudySpy').its('callCount').should('eq', 13)
    cy.get('.formField-studyDescription').type('My description')
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
  })
})
