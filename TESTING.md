# Testing
We use [Cypress](https://docs.cypress.io/) for testing.

Update an environment config file to test against:
```
cp config/dev.json public/config.json
``` 

## Run All Tests
```
npm test
```

## Local Test Development
Start a local server:
```
npm start
```

Generate configs locally (copy automation SAs to `cypress/fixtures`)

Start Cypress with SA environment variables:
```
CYPRESS_ADMIN=$(cat cypress/fixtures/duos-automation-admin.json) \
    CYPRESS_CHAIR=$(cat cypress/fixtures/duos-automation-chair.json) \
    CYPRESS_MEMBER=$(cat cypress/fixtures/duos-automation-member.json) \
    CYPRESS_RESEARCHER=$(cat cypress/fixtures/duos-automation-researcher.json) \
    CYPRESS_SIGNING_OFFICIAL=$(cat cypress/fixtures/duos-automation-signing-official.json) \
    npm run cypress:open
```

See also: 
* https://www.npmjs.com/package/google-auth-library
* https://github.com/googleapis/google-auth-library-nodejs
* https://docs.cypress.io/guides/testing-strategies/google-authentication
* https://developers.google.com/identity/protocols/oauth2/scopes