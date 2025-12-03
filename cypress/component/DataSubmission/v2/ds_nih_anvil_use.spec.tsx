import React from 'react'
import { mount } from 'cypress/react'
import { cloneDeep } from 'lodash'
import { NihAnvilUseRelated, NihAnvilUseRelatedProps } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study, NihAnvilUse, StudyProperty } from 'src/pages/data_submission/v2/v2-models'

let propCopy = { study: { properties: [] as StudyProperty[] } as Study } as NihAnvilUseRelatedProps

const props = {
  setStudy: () => {},
  study: { properties: [] },
  setFiles: () => {},
}

beforeEach(() => {
  propCopy = cloneDeep(props) as unknown as NihAnvilUseRelatedProps
})

describe('NihAnvilUseRelated - Tests', () => {
  it('should mount with only the nihAnvilUse form field displayed', () => {
    mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('.formField-container').should('exist')

    cy.get('#nihAnvilUse').should('exist')
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should show dbGaP form fields if NHGRI funded and has dbGaP ID', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID))
    mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(1) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()
    cy.get('#dbGaPPhsID').should('exist')
    cy.get('#dbGaPStudyRegistrationName').should('exist')
    cy.get('#embargoReleaseDate').should('exist')
    cy.get('#sequencingCenter').should('exist')
  })

  it('should hide dbGaP form fields if NHGRI funded and no dbGaP ID', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES_NHGRI_NO_PHS_ID))
    mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(2) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and submitting to AnVIL ', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO_NHGRI_YES_ANVIL))
    mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(3) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and not submitting to AnVIL', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL))
    mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(4) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })
})
