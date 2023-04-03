## Generating Schemas

To generate schemas, you need to use the `ajv` CLI tool with the `ajv-formats` extension.

For the Dataset Registration schema, the call looks like:

```
ajv compile -s consent/src/main/resources/dataset-registration-schema_v1.json -o duos-ui/src/utils/schemas/DatasetRegistrationSchemaValidation.js --spec draft2019 -c ajv-formats --strict false --all-errors
``` 

`-s` refers to the input file. `-o` refers to the output file. `--spec` specifies the specification version. `-c` adds formats such as "date", "uri", etc. `--strict false` is needed as our schema has some unknown metadata fields. `--all-errors` is needed because, by default, the validate function only returns one error at a time.

Once generated, the file needs to have the `/* eslint-disable */` flag on the first line, or it will create many linting errors.