import React, { useState } from 'react'
import { mount } from 'cypress/react'
import { ScrollableTabs } from 'src/pages/dar_application/ScrollableTabs'
import { BrowserRouter } from 'react-router-dom'

// Mock application tabs for testing
const mockApplicationTabs = [
  { id: 'researcher-info', name: 'Researcher Information', showStep: true },
  { id: 'data-access-request', name: 'Data Access Request', showStep: true },
  { id: 'research-purpose-statement', name: 'Research Purpose Statement', showStep: true },
]

// Wrapped ScrollableTabs
const WrappedScrollableTabs = ({ initialTabId }: { initialTabId?: string }) => {
  const [selectedTab, setSelectedTab] = useState(initialTabId)
  return (
    <ScrollableTabs
      applicationTabs={mockApplicationTabs}
      formSelectedTabId={selectedTab}
      onTabChange={setSelectedTab}
    />
  )
}

describe('ScrollableTabs - Basic Tests', () => {
  it('should render without crashing', () => {
    mount(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={mockApplicationTabs} />
      </BrowserRouter>,
    )

    // Check that the component renders
    cy.get('.multi-step-buttons-container').should('exist')
  })

  it('should render the correct number of tabs', () => {
    mount(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={mockApplicationTabs} />
      </BrowserRouter>,
    )

    cy.get('[role="tab"]').should('have.length', 3)
  })
})

describe('ScrollableTabs Component - Integration Tests', () => {
  beforeEach(() => {
    mount(
      <BrowserRouter>
        <div style={{ display: 'inline-flex' }}>
          <WrappedScrollableTabs />
          <div>
            <div id="researcher-info" style={{ height: '1000px', backgroundColor: 'red' }}>Researcher Info</div>
            <div id="data-access-request" style={{ height: '1000px', backgroundColor: 'blue' }}>Data Access Request</div>
            <div id="research-purpose-statement" style={{ height: '1000px', backgroundColor: 'purple' }}>Research Purpose Statement</div>
          </div>
        </div>
      </BrowserRouter>,
    )
  })

  it('Case 1 - change tabs based on formSelectedTabId', () => {
    mount(
      <BrowserRouter>
        <WrappedScrollableTabs initialTabId="data-access-request" />
      </BrowserRouter>,
    )
    cy.get('.Mui-selected').contains('Data Access Request').should('exist')
    cy.get('.Mui-selected').contains('Researcher Information').should('not.exist')

    mount(
      <BrowserRouter>
        <WrappedScrollableTabs initialTabId="research-purpose-statement" />
      </BrowserRouter>,
    )
    cy.get('.Mui-selected').contains('Research Purpose Statement').should('exist')
  })

  it('Case 2 - Auto-scroll to section on scroll', () => {
    cy.get('#research-purpose-statement').then(($el) => {
      cy.window().then((win) => {
        win.scrollTo(0, $el[0].offsetTop)
      })
    })
    cy.get('.Mui-selected').contains('Research Purpose Statement', { timeout: 2000 }).should('exist')
  })

  it('Case 3 - First tab selected by default and can click and select another tab', () => {
    cy.get('.Mui-selected').contains('Researcher Information').should('exist')
    cy.get('.Mui-selected').contains('Data Access Request').should('not.exist')

    cy.get('[role="tab"]').contains('Data Access Request').click()
    cy.get('.Mui-selected').contains('Data Access Request', { timeout: 2000 }).should('exist')
  })

  it('should handle tab structure with step numbers', () => {
    mockApplicationTabs.forEach((tab, index) => {
      cy.get('[role="tab"]').eq(index).within(() => {
        cy.get('.step').should('contain', `Step ${index + 1}`)
        cy.get('.title').should('contain', tab.name)
      })
    })
  })

  it('should handle tabs without step numbers', () => {
    const tabsWithoutSteps = mockApplicationTabs.map(tab => ({ ...tab, showStep: false }))
    mount(
      <BrowserRouter>
        <ScrollableTabs applicationTabs={tabsWithoutSteps} />
      </BrowserRouter>,
    )

    cy.get('.step').should('not.exist')
    cy.get('.title').should('have.length', 3)
  })
})
