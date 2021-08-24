/* eslint-disable no-undef */

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



// Manually run tests with Cypress env vars:
// CYPRESS_ADMIN=$(cat cypress/fixtures/duos-automation-admin.json) npm run cypress:open

Cypress.Commands.add("auth", async (roleName) => {
  const {auth} = require('google-auth-library');

  const keys = Cypress.env('ADMIN');
  console.log(keys);

  const client = auth.fromJSON(keys);
  client.scopes = ['email', 'profile'];
  console.log(JSON.stringify(client));

  const url = `https://dns.googleapis.com/dns/v1/projects/${keys.project_id}`;
  const res = await client.request({url});
  console.log(res.data);
});
