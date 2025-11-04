import React from 'react'
import ManageCookies from 'src/components/ManageCookies'
import { mount } from 'cypress/react'
import { CookieUtils } from 'src/utils/CookieUtils'
import { BrowserRouter } from 'react-router-dom'

describe('ManageCookies', () => {
  beforeEach(() => {
    cy.stub(CookieUtils, 'getAnalyticsControl').returns(false)
    cy.stub(CookieUtils, 'setAnalyticsControl')
  })

  it('renders cookie preferences accordion', () => {
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
    cy.contains('Cookie Preferences').should('exist')
    cy.contains('Strictly Necessary').should('exist')
    cy.contains('Performance').should('exist')
  })

  it('shows performance switch unchecked by default', () => {
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
    cy.get('input[type="checkbox"]').eq(1).should('not.be.checked')
  })

  it('calls setAnalyticsControl(true) when Accept All is clicked', () => {
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
    cy.contains('Accept All').click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', true)
  })

  it('calls setAnalyticsControl(false) when Essential Only is clicked', () => {
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
    cy.contains('Essential Only').click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', false)
  })

  it('toggles performance switch and calls setAnalyticsControl', () => {
    mount(<BrowserRouter><ManageCookies /></BrowserRouter>)
    cy.get('input[type="checkbox"]').eq(1).click()
    cy.wrap(CookieUtils.setAnalyticsControl).should('be.calledWith', true)
  })
})
