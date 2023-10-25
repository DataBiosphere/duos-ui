# Data Submission Schema Validation Tests

Schema Validation relies on a copy of what is stored in Consent:https://consent.dsde-dev.broadinstitute.org/schemas/dataset-registration/v1
If there are changes there, they need to be copied to this file for UI code to reflect the same back end validation rules.

From project root, run:
```shell
curl -s -S -X 'GET'  "https://consent.dsde-dev.broadinstitute.org/schemas/dataset-registration/v1"  -H 'accept: application/json' -o ./src/assets/schemas/dataset-registration-schema_v1.json
```
