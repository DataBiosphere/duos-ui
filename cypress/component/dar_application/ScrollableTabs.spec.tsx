import React from 'react'
import { mount } from 'cypress/react'
import { ScrollableTabs } from 'src/pages/dar_application/ScrollableTabs'

// Mock application tabs for testing
const mockApplicationTabs = [
  { id: 'section1', name: 'Summary', showStep: true },
  { id: 'section2', name: 'Datasets', showStep: true }
]

describe('ScrollableTabs - Basic Tests', () => {
  it('should render without crashing', () => {
    mount(<ScrollableTabs applicationTabs={mockApplicationTabs} />)

    // Check that the component renders
    cy.get('.multi-step-buttons-container').should('exist')
  })

  it('should render the correct number of tabs', () => {
    mount(<ScrollableTabs applicationTabs={mockApplicationTabs} />)

    cy.get('[role="tab"]').should('have.length', 2)
  })
})
