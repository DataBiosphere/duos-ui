import React from 'react'
import { ToastNotifications, ToastPosition } from 'src/libs/ToastNotifications'

describe('ToastNotifications', () => {
  beforeEach(() => {
    cy.get('body').then(($body) => {
      $body.find('[data-cy="notification-alert"]').closest('div[style*="position"]').each((_, el) => {
        el.remove()
      })
      // Also clean up any MuiSnackbar portals
      $body.find('.MuiSnackbar-root').each((_, el) => {
        const root = el.closest('[style*="z-index"]') ?? el.parentElement
        root?.remove()
      })
    })
  })

  afterEach(() => {
    cy.get('body').then(($body) => {
      $body.find('[data-cy="notification-alert"]').closest('div[style*="position"]').each((_, el) => {
        el.remove()
      })
      $body.find('.MuiSnackbar-root').each((_, el) => {
        const root = el.closest('[style*="z-index"]') ?? el.parentElement
        root?.remove()
      })
    })
  })

  describe('showNotification', () => {
    it('should display a notification with default props', () => {
      ToastNotifications.showNotification({ text: 'Test notification' })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Test notification')

      cy.get('[data-cy="notification-alert"]')
        .should('have.class', 'MuiAlert-colorInfo')
    })

    it('should display notification with custom severity', () => {
      ToastNotifications.showNotification({
        text: 'Warning message',
        severity: 'warning',
      })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Warning message')
        .and('have.class', 'MuiAlert-colorWarning')
    })

    it('should display notification with React node as text', () => {
      const reactText = <span data-testid="react-text">React notification</span>
      ToastNotifications.showNotification({ text: reactText })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .find('[data-testid="react-text"]')
        .should('contain.text', 'React notification')
    })

    it('should position notification using string layout', () => {
      ToastNotifications.showNotification({
        text: 'Top left notification',
        layout: 'topLeft',
      })

      cy.get('.MuiSnackbar-root')
        .should('have.class', 'MuiSnackbar-anchorOriginTopLeft')
    })

    it('should position notification using SnackbarOrigin layout', () => {
      ToastNotifications.showNotification({
        text: 'Custom position notification',
        layout: { vertical: 'top', horizontal: 'center' },
      })

      cy.get('.MuiSnackbar-root')
        .should('have.class', 'MuiSnackbar-anchorOriginTopCenter')
    })

    it('should close notification when close button is clicked', () => {
      ToastNotifications.showNotification({ text: 'Closeable notification' })

      cy.get('[data-cy="notification-alert"]').should('be.visible')
      cy.get('[data-cy="notification-alert"] .MuiAlert-action button').click()
      cy.get('[data-cy="notification-alert"]', { timeout: 350 }).should('not.exist')
    })

    it('should apply custom styling with sx prop', () => {
      ToastNotifications.showNotification({
        text: 'Styled notification',
        sx: { backgroundColor: 'red' },
      })

      cy.get('.MuiSnackbar-root')
        .should('have.css', 'background-color', 'rgb(255, 0, 0)')
    })

    it('should handle multiple notifications', () => {
      ToastNotifications.showNotification({ text: 'First notification' })
      ToastNotifications.showNotification({ text: 'Second notification' })

      cy.get('[data-cy="notification-alert"]').should('have.length', 2)
      cy.get('[data-cy="notification-alert"]').first().should('contain.text', 'First notification')
      cy.get('[data-cy="notification-alert"]').last().should('contain.text', 'Second notification')
    })
  })

  describe('showError', () => {
    it('should display error notification', () => {
      ToastNotifications.showError({ text: 'Error message' })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Error message')
        .and('have.class', 'MuiAlert-colorError')
    })

    it('should override severity prop for error notifications', () => {
      ToastNotifications.showError({
        text: 'Error message',
        severity: 'success', // This should be overridden
      })

      cy.get('[data-cy="notification-alert"]')
        .should('have.class', 'MuiAlert-colorError')
        .and('not.have.class', 'MuiAlert-colorSuccess')
    })
  })

  describe('showSuccess', () => {
    it('should display success notification', () => {
      ToastNotifications.showSuccess({ text: 'Success message' })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Success message')
        .and('have.class', 'MuiAlert-colorSuccess')
    })

    it('should accept custom layout for success notifications', () => {
      ToastNotifications.showSuccess({
        text: 'Success message',
        layout: 'topRight',
      })

      cy.get('.MuiSnackbar-root')
        .should('have.class', 'MuiSnackbar-anchorOriginTopRight')
    })
  })

  describe('showWarning', { retries: 3 }, () => {
    it('should display warning notification', () => {
      ToastNotifications.showWarning({ text: 'Warning message' })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Warning message')
        .and('have.class', 'MuiAlert-colorWarning')
    })
  })

  describe('showInformation', () => {
    it('should display info notification', () => {
      ToastNotifications.showInformation({ text: 'Info message' })

      cy.get('[data-cy="notification-alert"]')
        .should('be.visible')
        .and('contain.text', 'Info message')
        .and('have.class', 'MuiAlert-colorInfo')
    })
  })

  describe('Layout positioning', () => {
    const positions = [
      { layout: 'topLeft', expectedClass: 'MuiSnackbar-anchorOriginTopLeft' },
      { layout: 'topRight', expectedClass: 'MuiSnackbar-anchorOriginTopRight' },
      { layout: 'bottomLeft', expectedClass: 'MuiSnackbar-anchorOriginBottomLeft' },
      { layout: 'bottomRight', expectedClass: 'MuiSnackbar-anchorOriginBottomRight' },
    ]

    positions.forEach(({ layout, expectedClass }) => {
      it(`should position notification at ${layout}`, () => {
        ToastNotifications.showNotification({
          text: `${layout} notification`,
          layout: layout as ToastPosition,
        })

        cy.get('.MuiSnackbar-root')
          .should('have.class', expectedClass)
      })
    })
  })

  describe('Styling and constraints', () => {
    it('should respect maximum width constraint', () => {
      ToastNotifications.showNotification({
        text: 'This is a very long notification message that should be constrained by the maximum width setting to ensure it does not overflow off the page and remains readable within the viewport boundaries',
      })

      cy.get('.MuiSnackbar-root')
        .should('be.visible')
        .then(($snackbar) => {
          const snackbarWidth = $snackbar.outerWidth()
          const viewportWidth = Cypress.config('viewportWidth')
          expect(snackbarWidth).to.be.lessThan(viewportWidth)
        })
    })

    it('should have appropriate width for content', () => {
      ToastNotifications.showNotification({
        text: 'Short text',
      })

      cy.get('.MuiSnackbar-root')
        .should('be.visible')
        .then(($snackbar) => {
          const snackbarWidth = $snackbar.outerWidth()
          const viewportWidth = Cypress.config('viewportWidth')
          expect(snackbarWidth).to.be.lessThan(viewportWidth)
        })
    })
  })
})
