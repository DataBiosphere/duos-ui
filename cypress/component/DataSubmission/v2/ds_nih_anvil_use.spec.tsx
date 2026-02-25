import React from 'react'
import { cloneDeep } from 'lodash'
import { NihAnvilUseRelated, NihAnvilUseRelatedProps } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study, NihAnvilUse, StudyProperty } from 'src/pages/data_submission/v2/v2-models'

let propCopy = { study: { properties: [] as StudyProperty[] } as Study } as NihAnvilUseRelatedProps

const props = {
  setStudy: () => {},
  study: { properties: [] },
}

beforeEach(() => {
  propCopy = cloneDeep(props) as unknown as NihAnvilUseRelatedProps
})

describe('NihAnvilUseRelated - Tests', () => {
  it('should mount with only the pre-selector form field displayed', () => {
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').should('exist')
    cy.get('#nihAnvilUse').should('not.exist')
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should show nihAnvilUse form field after selecting YES in pre-selector', () => {
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
  })

  it('should show nihAnvilUse form field after selecting NO in pre-selector', () => {
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('No').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
  })

  it('should show dbGaP form fields if NHGRI funded and has dbGaP ID', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').contains(NihAnvilUse.YES_NHGRI_YES_PHS_ID).click({ force: true })
    cy.get('#dbGaPPhsID').should('exist')
    cy.get('#dbGaPStudyRegistrationName').should('exist')
    cy.get('#embargoReleaseDate').should('exist')
    cy.get('#sequencingCenter').should('exist')
  })

  it('should hide dbGaP form fields if NHGRI funded and no dbGaP ID', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.YES_NHGRI_NO_PHS_ID)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').contains(NihAnvilUse.YES_NHGRI_NO_PHS_ID).click({ force: true })
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and submitting to AnVIL', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.NO_NHGRI_YES_ANVIL)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').contains(NihAnvilUse.NO_NHGRI_YES_ANVIL).click({ force: true })
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and not submitting to AnVIL', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('No').click({ force: true })
    cy.get('#nihAnvilUse').contains(NihAnvilUse.NO_NHGRI_NO_ANVIL).click({ force: true })
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should reset fields when switching pre-selector from YES to NO', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
    cy.get('#nihAnvilUse_pre_selector').contains('No').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
    cy.get('#dbGaPPhsID').should('not.exist')
  })

  it('should reset fields when switching pre-selector from NO to YES', () => {
    propCopy.study.properties = [new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL)]
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('#nihAnvilUse_pre_selector').contains('No').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
    cy.get('#nihAnvilUse_pre_selector').contains('Yes').click({ force: true })
    cy.get('#nihAnvilUse').should('exist')
  })
})
