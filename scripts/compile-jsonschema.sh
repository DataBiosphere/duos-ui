APIURL=https://consent.dsde-dev.broadinstitute.org/
if test -f "./public/config.json"; then
  APIURL=$(jq '.apiUrl' ./public/config.json -r)
fi


curl -s -S -X 'GET'  "$APIURL/schemas/dataset-registration/v1"  -H 'accept: application/json' -o ./src/assets/schemas/DataRegistrationV1.json

ajv compile -s ./src/assets/schemas/DataRegistrationV1.json -o ./src/assets/schemas/DataRegistrationV1Validation.js --spec draft2019 -c ajv-formats --strict false --all-errors

echo "/* eslint-disable */ $(cat ./src/assets/schemas/DataRegistrationV1Validation.js)" > ./src/assets/schemas/DataRegistrationV1Validation.js
