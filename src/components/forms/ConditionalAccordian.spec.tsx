import { mount } from 'cypress/react'
import React from 'react'
import { ConditionalAccordion } from './ConditionalAccordion'
import { BrowserRouter } from 'react-router-dom'

describe('ConditionalAccordion Component - Tests', () => {
  it('should render an accordion with children', () => {
    mount(<BrowserRouter><ConditionalAccordion condition={true} title="hello world"><div><h1>Child component</h1></div></ConditionalAccordion></BrowserRouter>)
    cy.get('h3').contains('hello world')
    cy.get('h1').contains('Child component')
    cy.get('[id=root]').find('[data-testid=ExpandMoreIcon]').should('exist')
  })
  it('condition is false, should NOT render an accordion, but still render children', () => {
    mount(<BrowserRouter><ConditionalAccordion condition={false} title="hello world"><div><h1>Child component</h1></div></ConditionalAccordion></BrowserRouter>)
    cy.get('h2').contains('hello world')
    cy.get('h1').contains('Child component')
    cy.get('[id=root]').find('[data-testid=ExpandMoreIcon]').should('not.exist')
  })
})
