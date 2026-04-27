import React from 'react'
import { DacUsers } from 'src/pages/manage_dac/DacUsers'
import { DacObject } from 'src/types/model'
import dac from './dac.json'

// TypeScript type casting for test data - the JSON structure matches DacObject
const dacData = dac as unknown as DacObject

describe('DacUsers Component Tests', () => {
  it('Should display DAC members with correct roles', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    // Check headers
    cy.contains('User').should('exist')
    cy.contains('Role').should('exist')

    // Check chairpersons are displayed
    dacData.chairpersons?.forEach((u) => {
      cy.contains(u.displayName).should('exist')
      cy.contains(u.email).should('exist')
      cy.contains('Chairperson').should('exist')
    })

    // Check members are displayed
    dacData.members?.forEach((u) => {
      cy.contains(u.displayName).should('exist')
      cy.contains(u.email).should('exist')
    })
  })

  it('Should display remove buttons when removeButton prop is true', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    // Check that remove buttons are displayed
    dacData.chairpersons?.forEach((u) => {
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('exist')
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('contain', 'Remove')
    })

    dacData.members?.forEach((u) => {
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('exist')
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('contain', 'Remove')
    })
  })

  it('Should hide remove buttons when removeButton prop is false', () => {
    cy.viewport(600, 800)
    const props = {
      dac: dacData,
      removeButton: false,
      removeHandler: (): void => {},
    }
    cy.mount(<DacUsers {...props} />)

    // Check that remove buttons are not displayed
    dacData.chairpersons?.forEach((u) => {
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('not.exist')
    })

    dacData.members?.forEach((u) => {
      cy.get(`[data-cy="remove_button_${u.userId}"]`).should('not.exist')
    })
  })

  it('Should call removeHandler when remove button is clicked', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    const firstChairperson = dacData.chairpersons?.[0]
    if (firstChairperson) {
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).click()
      cy.wrap(removeHandler).should('have.been.called')
    }
  })

  it('Should toggle pending removal state when remove button is clicked twice', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    const firstChairperson = dacData.chairpersons?.[0]
    if (firstChairperson) {
      // First click - mark for removal
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).click()
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).should('contain', 'Pending Removal')

      // Second click - cancel removal
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).click()
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).should('contain', 'Remove')
    }
  })

  it('Should display pending removal styling when marked for removal', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    const firstChairperson = dacData.chairpersons?.[0]
    if (firstChairperson) {
      // Get the row before removal
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`)
        .parents('.row')
        .should('have.css', 'background-color')
        .and('not.equal', 'rgba(211, 211, 211, 0.5)') // lightgray with opacity

      // Click remove button
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`).click()

      // Check that row has removal styling (lightgray background with opacity)
      cy.get(`[data-cy="remove_button_${firstChairperson.userId}"]`)
        .parents('.row')
        .should('have.css', 'background-color', 'rgba(211, 211, 211, 0.5)')
    }
  })

  it('Should display all chairpersons and members separately', () => {
    cy.viewport(600, 800)
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler: () => {},
    }
    cy.mount(<DacUsers {...props} />)

    // Count chairperson rows
    if (dacData.chairpersons && dacData.chairpersons.length > 0) {
      dacData.chairpersons.forEach((chairperson) => {
        cy.contains(chairperson.displayName).should('exist')
        cy.contains('Chairperson').should('exist')
      })
    }

    // Count member rows
    if (dacData.members && dacData.members.length > 0) {
      dacData.members.forEach((member) => {
        cy.contains(member.displayName).should('exist')
        cy.contains('Member').filter(`:contains("${member.displayName}")`).should('exist')
      })
    }
  })

  it('Should handle multiple user removals independently', () => {
    cy.viewport(600, 800)
    const removeHandler = cy.stub()
    const props = {
      dac: dacData,
      removeButton: true,
      removeHandler,
    }
    cy.mount(<DacUsers {...props} />)

    if (
      dacData.chairpersons
      && dacData.chairpersons.length > 0
      && dacData.members
      && dacData.members.length > 0
    ) {
      const chairUserId = dacData.chairpersons[0].userId
      const memberUserId = dacData.members[0].userId

      // Mark chairperson for removal
      cy.get(`[data-cy="remove_button_${chairUserId}"]`).click()
      cy.get(`[data-cy="remove_button_${chairUserId}"]`).should('contain', 'Pending Removal')

      // Member should not be affected
      cy.get(`[data-cy="remove_button_${memberUserId}"]`).should('contain', 'Remove')

      // Mark member for removal
      cy.get(`[data-cy="remove_button_${memberUserId}"]`).click()
      cy.get(`[data-cy="remove_button_${memberUserId}"]`).should('contain', 'Pending Removal')

      // Chairperson should still be marked
      cy.get(`[data-cy="remove_button_${chairUserId}"]`).should('contain', 'Pending Removal')
    }
  })

  it('Should display user emails along with display names', () => {
    cy.viewport(600, 800)
    const props = {
      dac: dacData,
      removeButton: false,
    }
    cy.mount(<DacUsers {...props} />)

    if (dacData.chairpersons && dacData.chairpersons.length > 0) {
      const firstChairperson = dacData.chairpersons[0]
      const expectedText = `${firstChairperson.displayName} ${firstChairperson.email}`
      cy.contains(expectedText).should('exist')
    }
  })

  it('Should correctly handle empty members or chairpersons', () => {
    cy.viewport(600, 800)
    const emptyDac: DacObject = {
      ...dacData,
      chairpersons: [],
      members: [],
    }
    const props = {
      dac: emptyDac,
      removeButton: true,
      removeHandler: (): void => {},
    }
    cy.mount(<DacUsers {...props} />)

    // Should only show headers
    cy.contains('User').should('exist')
    cy.contains('Role').should('exist')
  })

  it('Should display correct role labels for chairpersons and members', () => {
    cy.viewport(600, 800)
    const props = {
      dac: dacData,
      removeButton: false,
    }
    cy.mount(<DacUsers {...props} />)

    // Check chairperson role is displayed correctly
    if (dacData.chairpersons && dacData.chairpersons.length > 0) {
      const chairpersonCount = dacData.chairpersons.length
      for (let i = 0; i < chairpersonCount; i++) {
        cy.contains('Chairperson').should('exist')
      }
    }

    // Check member role is displayed correctly
    if (dacData.members && dacData.members.length > 0) {
      const memberCount = dacData.members.length
      for (let i = 0; i < memberCount; i++) {
        cy.contains('Member').should('exist')
      }
    }
  })
})
