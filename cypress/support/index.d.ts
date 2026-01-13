declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to mount React components
     * @example cy.mount(<MyComponent />)
     */
    mount: typeof import('cypress/react')['mount']
    /**
         * Custom command to auth as a specific role service account
         * @example cy.auth('admin')
         */
    auth(roleName: string): Chainable<Element>
    /**
         * Custom command to initialize application configuration
         * @example cy.initApplicationConfig()
         */
    initApplicationConfig(): Chainable<void>
  }
}
