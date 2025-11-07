import React from 'react'
import { mount } from 'cypress/react'
import { cloneDeep } from 'lodash'
import {
  Study,
  NihAnvilUse,
  StudyProperty,
  AlternativeDataSharingPlan,
  AlternativeDataSharingPlanReasons,
} from 'src/pages/data_submission/v2/v2-models'
import { NihDataManagement, NihDataManagementProps } from 'src/pages/data_submission/v2/NihDataManagement'
import { FileProperty } from 'src/pages/data_submission/v2/DataSubmissionFormV2'

let propCopy = { study: { properties: [] as StudyProperty[] } as Study } as NihDataManagementProps

const props = {
  setStudy: () => {},
  study: { properties: [] },
  files: {} as FileProperty,
  setFiles: () => {},
}

beforeEach(() => {
  propCopy = cloneDeep(props)
})

function verifySharingPlanTopLevelDisabled() {
  cy.get('#legalRestrictions').should('not.exist')
  cy.get('#isInformedConsentProcessesInadequate').should('not.exist')
  cy.get('#alternativeDataSharingPlanExplanation').should('not.exist')
  cy.get('#alternativeDataSharingPlanFile_fileName').should('not.exist')
  cy.get('#alternativeDataSharingPlanDataSubmitted').should('not.exist')
  cy.get('#alternativeDataSharingPlanDataReleased').should('not.exist')
}

describe('NihAdministrativeInformation - Tests', () => {
  it('should mount without any fields in the NihAdministrativeInformation', () => {
    mount(<NihDataManagement {...propCopy} />)
    cy.get('.formField-container').should('not.exist')
    cy.get('#alternativeDataSharingPlan').should('not.exist')
  })

  it('fields should be visible if the user selected I am NHGRI funded and I have a dbGaP PHS ID already', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#alternativeDataSharingPlan').should('be.visible')
    verifySharingPlanTopLevelDisabled()
    cy.get('#alternativeDataSharingPlan > :nth-child(1) > [style="font-family: Montserrat; font-size: 14px;"] > label').click()
  })
  it('fields should appear as user selects Yes to an Alternative Data Sharing Plan', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID))
    propCopy.study.properties?.push(new AlternativeDataSharingPlan(true))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#legalRestrictions').should('be.visible')
    cy.get('#isInformedConsentProcessesInadequate').should('be.visible')
    cy.get('#alternativeDataSharingPlanExplanation').should('be.visible')
    cy.get('#alternativeDataSharingPlanFile_fileName').should('be.visible')
    cy.get('#alternativeDataSharingPlanDataSubmitted').should('be.visible')
    cy.get('#alternativeDataSharingPlanDataReleased').should('be.visible')
  })
  it('fields should appear if the user selects yes to inadequate consent process', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID))
    propCopy.study.properties?.push(new AlternativeDataSharingPlan(true))
    propCopy.study.properties?.push(new AlternativeDataSharingPlanReasons([AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate]))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#consentFormsUnavailable').should('be.visible')
    cy.get('#consentProcessDidNotAddressFutureUseOrBroadSharing').should('be.visible')
    cy.get('#consentProcessPrecludesFutureUseOrBroadSharing').should('be.visible')
    cy.get('#otherInformedConsentLimitationsOrConcerns').should('be.visible')
    cy.get('#otherReasonForRequest').should('be.visible')
  })

  it('fields should appear as user selects No to an Alternative Data Sharing Plan', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID))
    propCopy.study.properties?.push(new AlternativeDataSharingPlan(false))
    mount(<NihDataManagement {...propCopy} />)
    verifySharingPlanTopLevelDisabled()
  })

  it('fields should be visible if the user selected I am NHGRI funded and I do not have a dbGaP PHS ID', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_NO_PHS_ID))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#alternativeDataSharingPlan').should('be.visible')
  })

  it('should hide dbGaP form fields if the user selected I am not NHGRI funded but I am seeking to submit data to AnVIL', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO_NHGRI_YES_ANVIL))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#alternativeDataSharingPlan').should('be.visible')
  })

  it('should hide dbGaP form fields if the user selected I am not NHGRI funded and do not plan to store data in AnVIL', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL))
    mount(<NihDataManagement {...propCopy} />)
    cy.get('#alternativeDataSharingPlan').should('not.exist')
  })
})
