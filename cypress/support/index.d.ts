/* eslint-disable no-undef */

declare namespace Cypress {
    interface Chainable {
        /**
         * Custom command to auth as a specific role service account
         * @example cy.auth('admin')
         */
        auth(roleName: string): Chainable<Element>
    }
}
