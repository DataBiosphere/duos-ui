import { mount } from 'cypress/react'
import React from 'react'
import AIAssistantButton from 'src/components/ai/AIAssistantButton'

describe('AIAssistantButton', () => {
  it('renders the button', () => {
    const onClick = cy.stub()
    mount(<AIAssistantButton onClick={onClick} />)

    cy.get('button[aria-label="Open AI Assistant"]').should('exist')
  })

  it('calls onClick when clicked', () => {
    const onClick = cy.stub()
    mount(<AIAssistantButton onClick={onClick} />)

    cy.get('button[aria-label="Open AI Assistant"]').click()
    cy.wrap(onClick).should('be.calledOnce')
  })

  it('is disabled when disabled prop is true', () => {
    const onClick = cy.stub()
    mount(<AIAssistantButton onClick={onClick} disabled={true} />)

    cy.get('button[aria-label="Open AI Assistant"]').should('be.disabled')
  })

  it('shows tooltip on hover', () => {
    const onClick = cy.stub()
    mount(<AIAssistantButton onClick={onClick} />)

    cy.get('button[aria-label="Open AI Assistant"]').trigger('mouseenter')
    cy.contains('AI Assistant').should('be.visible')
  })
})
