import React from 'react'
import { Storage } from '../../../src/libs/storage'
import { User } from '../../../src/libs/ajax/User'
import { Institution } from '../../../src/libs/ajax/Institution'
import UserProfile from '../../../src/pages/user_profile/UserProfile'
import { BrowserRouter } from 'react-router-dom'

const duosUser = {
  isSigningOfficial: false,
}

describe('User Profile', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.intercept('GET', '**api/user/**', (req) => {
      req.reply({
        delay: 0,
        body: duosUser,
      })
    }).as('getSelf')
    cy.intercept('GET', '**api/user/signing-officials', (req) => {
      req.reply({
        delay: 0,
        body: [],
      })
    }).as('getSigningOfficials')
  })

  it('Renders the user profile page', () => {
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    cy.stub(Institution, 'list').returns([])
    cy.stub(User, 'getApprovedDatasets').returns([])
    cy.stub(User, 'getAcknowledgements').returns({})
    cy.mount(<BrowserRouter><UserProfile /></BrowserRouter>)
    cy.wait('@getSelf')
    cy.wait('@getSigningOfficials')
    cy.get('h2').should('contain', 'Your Profile')
  })

  it('Updates the user email preferences', () => {
    cy.stub(Storage, 'getCurrentUser').returns(duosUser)
    cy.stub(Institution, 'list').returns([])
    cy.stub(User, 'getApprovedDatasets').returns([])
    cy.stub(User, 'getAcknowledgements').returns({})
    cy.intercept(
      { method: 'PUT', url: '**/user' },
      { statusCode: 200, body: duosUser },
    ).as('updateSelf')
    cy.mount(<BrowserRouter><UserProfile /></BrowserRouter>)
    cy.wait('@getSelf')
    cy.wait('@getSigningOfficials')
    cy.get('input[id="profileEmailEnabled_yes"]').check()
    cy.wait('@updateSelf').then(() => {
      cy.get('div').contains('Email preference updated successfully!')
    })
  })
})
