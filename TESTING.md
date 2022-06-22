# Testing
We use [Cypress](https://docs.cypress.io/) for testing.

Update an environment config file to test against:
```
cp config/perf.json public/config.json
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

Generate configs locally
```
./scripts/render-accounts.sh
```

Open Cypress' interactive view:
```
    npm run cypress:open
```

Run Cypress headless:
```
    npm run cypress:run
```

## Component Testing

See https://www.cypress.io/blog/2021/04/06/introducing-the-cypress-component-test-runner/ for more detailed information

This command opens a browser window with component tests visible. 
You don't need to have a running server started, this will do that for you.
(Note that specifying any port with `open-ct` will default to 3000, this seems to be a cypress bug) 
```
    npx cypress open
```

This runs component tests headless:
```
    npx cypress run --component
```
