import { handleSignIn } from 'src/libs/signInUtils'

describe('signInUtils', () => {
  describe('handleSignIn', () => {
    beforeEach(() => {
      // Reset window.location
      cy.window().then((win) => {
        win.history.replaceState({}, '', '/')
      })
    })

    it('should set redirectTo parameter in URL', () => {
      cy.window().then((win) => {
        cy.spy(win.history, 'replaceState').as('replaceState')
        handleSignIn('/datalibrary')
        cy.get('@replaceState').should('be.called')
      })
      cy.location('search').should('include', 'redirectTo=%2Fdatalibrary')
    })

    it('should find and click the Sign In button if it exists', () => {
      cy.window().then((win) => {
        // Create a mock sign-in button
        const button = win.document.createElement('button')
        button.textContent = 'Sign In'
        button.id = 'test-sign-in-button'
        const clickSpy = cy.spy()
        button.addEventListener('click', clickSpy)
        win.document.body.appendChild(button)

        handleSignIn('/datalibrary')

        // Verify the button was clicked
        cy.wrap(clickSpy).should('be.called')

        // Clean up
        button.remove()
      })
    })

    it('should scroll to top if Sign In button is not found (fallback)', () => {
      cy.window().then((win) => {
        // Ensure no Sign In button exists
        const buttons = win.document.querySelectorAll('button')
        for (const button of buttons) {
          if (button.textContent?.trim() === 'Sign In') {
            button.textContent = 'Other Button'
          }
        }

        cy.spy(win, 'scrollTo').as('scrollTo')
        handleSignIn('/dashboard')
        cy.get('@scrollTo').should('be.calledWith', { top: 0, behavior: 'smooth' })
      })
    })

    it('should handle different redirect paths', () => {
      const paths = ['/datalibrary', '/dashboard', '/profile', '/datasets']

      for (const path of paths) {
        cy.window().then((win) => {
          win.history.replaceState({}, '', '/')
          handleSignIn(path)
          cy.location('search').should('include', `redirectTo=${encodeURIComponent(path)}`)
        })
      }
    })

    it('should preserve existing query parameters when setting redirectTo', () => {
      cy.window().then((win) => {
        // Set an initial query parameter
        win.history.replaceState({}, '', '/?existingParam=value')
        handleSignIn('/datalibrary')
        cy.location('search').should('include', 'existingParam=value')
        cy.location('search').should('include', 'redirectTo=%2Fdatalibrary')
      })
    })

    it('should find Sign In button with extra whitespace', () => {
      cy.window().then((win) => {
        // Create a mock sign-in button with extra whitespace
        const button = win.document.createElement('button')
        button.textContent = '  Sign In  '
        button.id = 'test-sign-in-button-whitespace'
        const clickSpy = cy.spy()
        button.addEventListener('click', clickSpy)
        win.document.body.appendChild(button)

        handleSignIn('/datalibrary')

        // Verify the button was clicked
        cy.wrap(clickSpy).should('be.called')

        // Clean up
        button.remove()
      })
    })
  })
})
