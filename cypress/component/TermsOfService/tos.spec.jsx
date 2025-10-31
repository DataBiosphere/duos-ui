import React from 'react'
import { mount } from 'cypress/react'
import TermsOfService from 'src/pages/TermsOfService'
import { ToS } from 'src/libs/ajax/ToS'
import { BrowserRouter } from 'react-router-dom'

const text = 'TOS Text'

describe('Terms of Service Page', function () {
  it('Standard text loads correctly', function () {
    cy.viewport(600, 300)
    cy.stub(ToS, 'getDUOSText').returns(text)
    mount(<BrowserRouter><TermsOfService /></BrowserRouter>)
    cy.contains(text).should('exist')
  })

  it('Markdown text loads correctly', function () {
    cy.viewport(600, 300)
    const rawMarkdown = '# ' + text
    cy.stub(ToS, 'getDUOSText').returns(rawMarkdown)
    mount(<BrowserRouter><TermsOfService /></BrowserRouter>)
    cy.contains(text).should('exist')
    cy.contains(rawMarkdown).should('not.exist')
  })
})
