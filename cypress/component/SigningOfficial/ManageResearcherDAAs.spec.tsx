import React from 'react'
import ManageResearcherDAAs from 'src/pages/signing_official_console/ManageResearcherDAAs'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications } from 'src/libs/utils'
import { makeDaa, makeResearcher } from './ResearcherView/fixtures'

describe('ManageResearcherDAAs', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('loads the page and filters out DAAs with no DAC mapping', () => {
    cy.stub(User, 'list').resolves([makeResearcher({
      userId: 1,
      displayName: 'Dr. Jane Doe',
      email: 'jdoe@broadinstitute.org',
      authorizedDaaIds: [1, 2],
    })])
    cy.stub(DAA, 'getDaas').resolves([
      makeDaa({ daaId: 1, broadDaa: false, mapped: true }),
      makeDaa({ daaId: 2, broadDaa: true, mapped: false }),
      makeDaa({ daaId: 3, broadDaa: false, mapped: false }),
    ])

    cy.mount(<ManageResearcherDAAs />)

    cy.get('[data-cy="researcher-view"]').should('exist')
    cy.get('[data-cy="researcher-row-toggle-1"]').click()
    cy.get('[data-cy^="daa-row-"]').should('have.length', 2)
  })

  it('shows an error notification when initial data load fails', () => {
    cy.stub(User, 'list').rejects(new Error('network'))
    cy.stub(Notifications, 'showError').as('showError')

    cy.mount(<ManageResearcherDAAs />)

    cy.get('@showError').should('have.been.calledOnce')
  })
})
