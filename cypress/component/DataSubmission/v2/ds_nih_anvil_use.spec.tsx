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
  it('should mount with only the nihAnvilUse form field displayed', () => {
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get('.formField-container').should('exist')

    cy.get('#nihAnvilUse').should('exist')
    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })

  it('should show dbGaP form fields if "YES" is selected', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.YES))
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(1) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()
    cy.get('#dbGaPPhsID').should('exist')
    cy.get('#dbGaPStudyRegistrationName').should('exist')
    cy.get('#embargoReleaseDate').should('exist')
    cy.get('#sequencingCenter').should('exist')
  })

  it('should hide dbGaP form fields if "NO" is selected ', () => {
    propCopy?.study?.properties?.push(new NihAnvilUse(NihAnvilUse.NO))
    cy.mount(<NihAnvilUseRelated {...propCopy} />)
    cy.get(':nth-child(2) > [style="font-family: Montserrat; font-size: 14px;"] > label > [style="float: left;"] > span').click()

    cy.get('#dbGaPPhsID').should('not.exist')
    cy.get('#dbGaPStudyRegistrationName').should('not.exist')
    cy.get('#embargoReleaseDate').should('not.exist')
    cy.get('#sequencingCenter').should('not.exist')
  })
})
