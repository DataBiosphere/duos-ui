import React from 'react'
import { DacUsers } from 'src/pages/manage_dac/DacUsers.jsx'
import dac from './dac.json'

describe('Dac User Tests', () => {
  it('Shows a DAC Members', () => {
    cy.viewport(600, 800)
    const props = {
      dac: dac,
      removeButton: true,
      removeHandler: () => { console.log('Remove Button Clicked') },
    }
    cy.mount(<DacUsers {...props} />)
    dac.chairpersons.forEach((u) => {
      cy.contains(u.displayName)
      cy.get('[data-cy="remove_button_' + u.userId + '"]').click()
      cy.contains('Pending Removal')
      cy.get('[data-cy="remove_button_' + u.userId + '"]').click()
      cy.get('Pending Removal').should('not.exist')
    })
    dac.members.forEach((u) => {
      cy.contains(u.displayName)
      cy.get('[data-cy="remove_button_' + u.userId + '"]').click()
      cy.contains('Pending Removal')
      cy.get('[data-cy="remove_button_' + u.userId + '"]').click()
      cy.get('Pending Removal').should('not.exist')
    })
  })
})
