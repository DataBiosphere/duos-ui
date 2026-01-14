import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { actionsCellData } from 'src/components/manage_dac_table/ManageDacTableCellData'
import { Storage } from 'src/libs/storage'

// Mock the Storage and environment utilities
const mockDac = {
  dacId: 123,
  name: 'Test DAC',
  datasets: [],
}

// Wrapper for components that contain `Link` components
const WrappedActionCell = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>
}

describe('ManageDacTableCellData Actions Tests', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  describe('RADAR Action Visibility', () => {
    it('should show RADAR action in dev environment', () => {
      // Mock the environment to return 'dev'
      cy.stub(Storage, 'getEnv').returns('dev')

      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should show RADAR icon in dev environment
      cy.get('img.radar-icon').should('exist')
      cy.get('img.radar-icon').should('have.attr', 'alt', 'Edit rule automation')
    })

    it('should show RADAR action in local environment', () => {
      // Mock the environment to return 'local'
      cy.stub(Storage, 'getEnv').returns('local')

      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should show RADAR icon in local environment
      cy.get('img.radar-icon').should('exist')
      cy.get('img.radar-icon').should('have.attr', 'alt', 'Edit rule automation')
    })

    it('should show RADAR action in staging environment', () => {
      // Mock the environment to return 'staging'
      cy.stub(Storage, 'getEnv').returns('staging')

      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should show RADAR icon in local environment
      cy.get('img.radar-icon').should('exist')
      cy.get('img.radar-icon').should('have.attr', 'alt', 'Edit rule automation')
    })

    it('should show RADAR action in prod environment', () => {
      // Mock the environment to return 'prod'
      cy.stub(Storage, 'getEnv').returns('prod')

      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should show RADAR icon in local environment
      cy.get('img.radar-icon').should('exist')
      cy.get('img.radar-icon').should('have.attr', 'alt', 'Edit rule automation')
    })

    it('should show RADAR action when environment is undefined', () => {
      // Mock the environment to return undefined
      cy.stub(Storage, 'getEnv').returns(undefined)

      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should show RADAR icon when environment is undefined
      cy.get('img.radar-icon').should('exist')

      // Should still show edit icon
      cy.get('img#edit-pencil-icon').should('exist')
    })
  })

  describe('RADAR Link Navigation', () => {
    it('should have correct link path', () => {
      const mockProps = {
        dac: mockDac,
        deleteDac: cy.stub(),
        userRole: 'Admin',
      }

      const cellData = actionsCellData(mockProps)

      cy.mount(
        <WrappedActionCell>
          {cellData.data}
        </WrappedActionCell>,
      )

      // Should have correct href for RADAR management
      cy.get('a[href*="/manage_radar/123"]').should('exist')
      cy.get('img.radar-icon').parent().should('have.attr', 'href').and('include', '/manage_radar/123')
    })
  })

  it('should show all actions', () => {
    const mockProps = {
      dac: mockDac,
      deleteDac: cy.stub(),
      userRole: 'Admin',
    }

    const cellData = actionsCellData(mockProps)

    cy.mount(
      <WrappedActionCell>
        {cellData.data}
      </WrappedActionCell>,
    )

    // Should have RADAR icon
    cy.get('img.radar-icon').should('exist')

    // Should have edit icon
    cy.get('img#edit-pencil-icon').should('exist')

    // Both should be within the flex container
    cy.get('div[style*="display: flex"]').should('exist')
  })
})
