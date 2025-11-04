import React from 'react'
import ManageCookies from 'src/components/ManageCookies'
import { mount } from 'cypress/react'
import { CookieUtils } from 'src/utils/CookieUtils'
import { BrowserRouter } from 'react-router-dom'

describe('ManageCookies', () => {
  beforeEach(() => {
    cy.stub(CookieUtils, 'getAnalyticsControl').returns(false)
    cy.stub(CookieUtils, 'setAnalyticsControl')
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
  })

  it('renders cookie preferences accordion', () => {
    cy.contains('Cookie Preferences').should('exist')
    cy.contains('Strictly Necessary').should('exist')
    cy.contains('Performance').should('exist')
  })

  it('shows performance switch unchecked by default', () => {
    cy.get('input[type="checkbox"]').eq(1).should('not.be.checked')
  })

  it('calls setAnalyticsControl(true) when Accept All is clicked', () => {
    cy.contains('Accept All').click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', true)
  })

  it('calls setAnalyticsControl(false) when Essential Only is clicked', () => {
    cy.contains('Essential Only').click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', false)
  })

  it('toggles performance switch and calls setAnalyticsControl', () => {
    cy.get('input[type="checkbox"]').eq(1).click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', true)
  })
})
