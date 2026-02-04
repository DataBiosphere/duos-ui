import React from 'react'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import ManageEditDac from 'src/pages/manage_dac/ManageEditDac'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import adminJson from './admin.json'
import chairJson from './chair.json'
import dac from './dac.json'
import { setUserRoleStatuses } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

const admin = adminJson as DuosUser
const chair = chairJson as DuosUser

/**
 * This manage page is the pre-Data Access Agreement way to edit a DAC and will be removed when DAA work is complete.
 */
describe('ManageEditDAC Tests', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  Cypress._.each([admin, chair], (user) => {
    it('Manage Edit DAC page should load for ' + user.displayName, () => {
      cy.viewport(600, 600)
      setUserRoleStatuses(user, Storage)
      cy.stub(DAC, 'get').returns(dac)
      cy.mount(
        <MemoryRouter initialEntries={[`/manage_edit_dac/${dac.dacId}`]}>
          <Routes>
            <Route path="/manage_edit_dac/:dacId" element={<ManageEditDac />} />
          </Routes>
        </MemoryRouter>,
      )
      cy.contains(dac.name).should('exist')
      cy.get('[data-cy="dac_name"]').should('not.be.disabled')
      cy.get('[data-cy="dac_description"]').should('not.be.disabled')
      cy.get('[data-cy="dac_email"]').should('not.be.disabled')
      cy.get('[data-cy="btn_save"]').should('not.be.disabled')
      cy.get('[data-cy="btn_cancel"]').should('not.be.disabled')
    })
  })

  it('Admins can create a DAC', () => {
    cy.viewport(600, 600)
    Storage.clearStorage()
    setUserRoleStatuses(admin, Storage)
    cy.mount(<BrowserRouter><ManageEditDac /></BrowserRouter>)
    cy.get('[data-cy="dac_name"]').should('not.be.disabled')
    cy.get('[data-cy="dac_name"]').should('be.empty')
    cy.get('[data-cy="dac_description"]').should('not.be.disabled')
    cy.get('[data-cy="dac_description"]').should('be.empty')
    cy.get('[data-cy="dac_email"]').should('not.be.disabled')
    cy.get('[data-cy="dac_email"]').should('be.empty')
    cy.get('[data-cy="btn_save"]').should('not.be.disabled')
    cy.get('[data-cy="btn_cancel"]').should('not.be.disabled')

    // Create a DAC
    const dacCreate = cy.stub(DAC, 'create')

    cy.get('[data-cy="dac_name"]').type('New DAC Name')
    cy.get('[data-cy="dac_description"]').type('New DAC Description')
    cy.get('[data-cy="dac_email"]').type('New DAC Email')
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('have.been.called')
  })

  it('Chairs cannot create a DAC', () => {
    cy.viewport(600, 600)
    Storage.clearStorage()
    setUserRoleStatuses(chair, Storage)
    const dacCreate = cy.stub(DAC, 'create')
    cy.mount(<BrowserRouter><ManageEditDac /></BrowserRouter>)
    cy.get('[data-cy="dac_name"]').type('New DAC Name')
    cy.get('[data-cy="dac_description"]').type('New DAC Description')
    cy.get('[data-cy="dac_email"]').type('New DAC Email')
    cy.get('[data-cy="btn_save"]').click()
    cy.wrap(dacCreate).should('not.have.been.called')
  })
})
