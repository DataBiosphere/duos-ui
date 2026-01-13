import React from 'react'
import { cloneDeep } from 'lodash/fp'
import NihAnvilUse, { YES_NHGRI_YES_PHS_ID } from 'src/pages/data_submission/NihAnvilUse'

let propCopy

const props = {
  onChange: () => {},
  validation: {},
  onValidationChange: () => {},
  formData: {},
  updateParentRenderState: () => {},
}

beforeEach(() => {
  propCopy = cloneDeep(props)
})

describe('NihAnvilUse - Tests', () => {
  it('should mount with only the nihAnvilUse form field displayed', () => {
    cy.mount(<NihAnvilUse {...propCopy} />)
    cy.get('.formField-container').should('exist')

    cy.get('#nihAnvilUse').should('exist')
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should show dbGaP form fields if NHGRI funded and has dbGaP ID', () => {
    propCopy.formData.nihAnvilUse = YES_NHGRI_YES_PHS_ID
    cy.mount(<NihAnvilUse {...propCopy} />)
    cy.get('#nihAnvilUse_yes_nhgri_yes_phs_id').click()
    cy.get('#dbGaPPhsID').should('exist')
    cy.get('#dbGaPStudyRegistrationName').should('exist')
    cy.get('#embargoReleaseDate').should('exist')
    cy.get('#sequencingCenter').should('exist')
  })

  it('should hide dbGaP form fields if NHGRI funded and no dbGaP ID', () => {
    cy.mount(<NihAnvilUse {...propCopy} />)
    cy.get('#nihAnvilUse_yes_nhgri_no_phs_id').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and submitting to AnVIL ', () => {
    cy.mount(<NihAnvilUse {...propCopy} />)
    cy.get('#nihAnvilUse_no_nhgri_yes_anvil').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should hide dbGaP form fields if not NHGRI funded and not submitting to AnVIL', () => {
    cy.mount(<NihAnvilUse {...propCopy} />)
    cy.get('#nihAnvilUse_no_nhgri_no_anvil').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })
})
