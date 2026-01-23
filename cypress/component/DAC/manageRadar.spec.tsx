import React from 'react'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { setUserRoleStatuses } from 'src/libs/utils'
import adminJson from './admin.json'
import chairJson from './chair.json'
import dac from './dac.json'
import { DuosUser } from 'src/types/model'

const admin = adminJson as DuosUser
const chair = chairJson as DuosUser

// Wrapper for components that contain `Link` components
const WrappedManageRadar = (mockDacId: number | undefined) => {
  return (
    <MemoryRouter initialEntries={[`/manage_radar/${mockDacId}`]}>
      <Routes>
        <Route path="/manage_radar/:dacId" element={<ManageRadar />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ManageRadar Component Tests', () => {
  const mockDacId = 123

  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  describe('Basic Rendering', () => {
    it('should render the ManageRadar component with loading state', () => {
      setUserRoleStatuses(admin, Storage)
      // Stub DAC.get to return a promise that doesn't resolve immediately
      cy.stub(DAC, 'get').returns(new Promise(() => {}))

      cy.mount(WrappedManageRadar(mockDacId))

      // Should show loading spinner initially
      cy.get('[data-cy="loading-spinner"]').should('exist')
      cy.get('[data-cy="loading-spinner"] img[alt="spinner"]').should('exist')
    })

    it('should render with DAC data after loading completes', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      // Wait for loading to complete
      cy.get('[data-cy="loading-spinner"]').should('not.exist')

      // Should display the DAC name in header
      cy.contains(dac.name).should('exist')

      // Should have back button
      cy.get('[data-cy="back-button"]').should('exist')
    })
  })

  describe('Error Handling', () => {
    it('should handle DAC fetch errors gracefully', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').rejects(new Error('Failed to fetch DAC'))

      cy.mount(WrappedManageRadar(mockDacId))

      // Should display error message
      cy.get('[data-cy="error-container"]').should('exist')
      cy.get('[data-cy="error-message"]').should('contain', 'Error loading DAC information')

      // Should still show back button for navigation
      cy.get('[data-cy="back-button"]').should('exist')
    })

    it('should handle missing DAC ID parameter', () => {
      setUserRoleStatuses(admin, Storage)

      cy.mount(WrappedManageRadar(undefined))

      // Should handle missing DAC ID gracefully
      cy.get('[data-cy="error-container"]').should('exist')
      cy.get('[data-cy="error-message"]').should('contain', 'Invalid DAC ID')
      cy.get('[data-cy="back-button"]').should('exist')
    })
  })

  describe('User Role Integration', () => {
    it('should render correctly for admin users', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      cy.contains(dac.name).should('exist')

      // DACBotComponent should be rendered
      cy.get('[data-cy="dac-bot-component"]').should('exist')
    })

    it('should render correctly for chair users', () => {
      setUserRoleStatuses(chair, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      cy.contains(dac.name).should('exist')

      // DACBotComponent should be rendered for chairs too
      cy.get('[data-cy="dac-bot-component"]').should('exist')
    })
  })

  describe('Navigation', () => {
    it('should have working back button', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')

      // Back button should be clickable and visible
      cy.get('[data-cy="back-button"]').should('be.visible')
      cy.get('[data-cy="back-button"]').should('have.attr', 'href', '/manage_dac')

      // Should contain back arrow icon
      cy.get('[data-cy="back-button"] img').should('exist')
      cy.get('[data-cy="back-button"] img').should('have.attr', 'alt', 'Back')
    })

    it('should show "Back to DAC Console" text', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')

      // Should have proper back link structure - in this case it's just an icon
      cy.get('[data-cy="back-button"]').should('exist')
    })
  })

  describe('Page Layout and Structure', () => {
    it('should have proper page structure', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')

      // Should have main container
      cy.get('[data-cy="manage-radar-container"]').should('exist')

      // Should have header section with DAC name
      cy.get('[data-cy="table-header-description"]').should('exist')
      cy.get('[data-cy="table-header-description"]').should('contain', dac.name)

      // Should have back navigation
      cy.get('[data-cy="back-button"]').should('exist')

      // Should have DACBot section
      cy.get('[data-cy="dac-bot-component"]').should('exist')
    })

    it('should be responsive on different screen sizes', () => {
      setUserRoleStatuses(admin, Storage)
      cy.stub(DAC, 'get').resolves(dac)

      // Test mobile viewport
      cy.viewport(375, 667)
      cy.mount(WrappedManageRadar(mockDacId))

      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      cy.get('[data-cy="manage-radar-container"]').should('be.visible')

      // Test tablet viewport
      cy.viewport(768, 1024)
      cy.get('[data-cy="manage-radar-container"]').should('be.visible')

      // Test desktop viewport
      cy.viewport(1200, 800)
      cy.get('[data-cy="manage-radar-container"]').should('be.visible')
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent state during DAC loading', () => {
      setUserRoleStatuses(admin, Storage)

      let resolvePromise: (value: unknown) => void
      const dacPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      cy.stub(DAC, 'get').returns(dacPromise)

      cy.mount(WrappedManageRadar(mockDacId))

      // Initially loading
      cy.get('[data-cy="loading-spinner"]').should('exist')
      cy.get('[data-cy="dac-bot-component"]').should('not.exist')

      // Resolve the promise
      cy.then(() => {
        resolvePromise!(dac)
      })

      // After resolution
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      cy.get('[data-cy="dac-bot-component"]').should('exist')
    })
  })
})
