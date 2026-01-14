import React from 'react'
import AILLMWarningBanner from 'src/components/AILLMWarningBanner'

describe('AILLMWarningBanner Component', () => {
  it('should not render when aiLlmUse is false', () => {
    cy.mount(<AILLMWarningBanner darInfo={{ aiLlmUse: false }} />)
    cy.get('[data-cy="ai-llm-warning-banner"]').should('not.exist')
  })

  it('should not render when aiLlmUse is undefined in darInfo', () => {
    cy.mount(<AILLMWarningBanner darInfo={{}} />)
    cy.get('[data-cy="ai-llm-warning-banner"]').should('not.exist')
  })

  it('should not render when darInfo is undefined', () => {
    cy.mount(<AILLMWarningBanner />)
    cy.get('[data-cy="ai-llm-warning-banner"]').should('not.exist')
  })

  it('should render warning banner when aiLlmUse is true', () => {
    cy.mount(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    cy.get('[data-cy="ai-llm-warning-banner"]').should('exist')
    cy.contains('This Data Access Request involves Artificial Intelligence (AI) or Large Language Model (LLM) research').should('be.visible')
    cy.contains('Please carefully review this request for compliance and ethical considerations before granting approval').should('be.visible')
  })

  it('should have proper styling for warning banner', () => {
    cy.mount(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    cy.get('[data-cy="ai-llm-warning-banner"]')
      .should('have.css', 'background-color', 'rgb(255, 243, 205)')
      .should('have.css', 'border', '2px solid rgb(255, 107, 53)')
      .should('have.css', 'border-radius', '8px')
  })

  it('should display warning icon', () => {
    cy.mount(<AILLMWarningBanner darInfo={{ aiLlmUse: true }} />)

    cy.get('[data-cy="ai-llm-warning-banner"]').within(() => {
      cy.get('svg').should('exist')
    })
  })
})
