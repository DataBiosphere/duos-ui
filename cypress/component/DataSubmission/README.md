# Data Submission Schema Validation Tests

Validation tests here rely on the fixture: `cypress/fixtures/dataset-registration-schema_v1.json` which is a copy of
what is stored in Consent: https://consent.dsde-dev.broadinstitute.org/schemas/dataset-registration/v1
If there are changes there, they need to be copied to this file for tests to reflect back end validation.

From project root, run:
```shell
curl -s -S -X 'GET'  "https://consent.dsde-dev.broadinstitute.org/schemas/dataset-registration/v1"  -H 'accept: application/json' -o ./cypress/fixtures/dataset-registration-schema_v1.json
```
