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
