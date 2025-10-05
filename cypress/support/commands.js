// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('auth', async (roleName) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { auth } = require('google-auth-library')
  const keys = Cypress.env(roleName)
  const client = auth.fromJSON(keys)
  client.scopes = ['email', 'profile']
  const url = Cypress.env('baseUrl')
  await client.request({ url })
  return client.credentials
})

// Custom command for keyboard navigation testing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab', code: 'Tab', keyCode: 9 })
})

// Custom command to check accessibility attributes
Cypress.Commands.add('checkAccessibility', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).then(($el) => {
    const tagName = $el.prop('tagName').toLowerCase()
    const id = $el.attr('id')
    const ariaLabel = $el.attr('aria-label')
    const ariaLabelledby = $el.attr('aria-labelledby')

    // Check for form elements
    if (['input', 'textarea', 'select'].includes(tagName)) {
      const hasLabel = Cypress.$(`label[for="${id}"]`).length > 0
      const hasAccessibleName = ariaLabel || ariaLabelledby || hasLabel

      if (!hasAccessibleName) {
        throw new Error(`Form element ${tagName}${id ? '#' + id : ''} lacks accessible name`)
      }
    }

    // Check for buttons
    if (tagName === 'button' || $el.attr('role') === 'button') {
      const textContent = $el.text().trim()
      const hasIcon = $el.find('svg, img').length > 0

      if (hasIcon && !textContent && !ariaLabel) {
        throw new Error(`Icon button lacks accessible name`)
      }
    }

    // Check for images
    if (tagName === 'img') {
      const alt = $el.attr('alt')
      if (alt === undefined) {
        throw new Error(`Image lacks alt attribute`)
      }
    }

    return cy.wrap(subject)
  })
})

Cypress.Commands.add('initApplicationConfig', () => {
  cy.intercept({
    method: 'GET',
    url: '/config.json',
    hostname: 'localhost',
  }, {
    env: 'ci',
    hash: '',
    tag: '',
    bardApiUrl: '',
    apiUrl: '',
    ontologyApiUrl: '',
    terraUrl: '',
    tdrApiUrl: '',
    ecmApiUrl: '',
    errorApiKey: '',
    profileUrl: '',
    nihUrl: '',
    gaId: '',
    features: {},
  })
})
