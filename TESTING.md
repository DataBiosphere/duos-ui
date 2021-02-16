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
Then open Cypress:
```
npm cypress:open
```
