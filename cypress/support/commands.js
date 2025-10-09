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
