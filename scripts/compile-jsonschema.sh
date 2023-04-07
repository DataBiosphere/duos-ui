#!/usr/bin/env bash
#
# Compiles the json schemas needed for the frontend; output is at
# ./src/assets/schemas. The schemas downloaded are based on the
# backend configured in ./public/config.json.
#
# You MUST have jq and ajv installed to be able to use this script.
#
# USAGE: ./compile-jsonschema.sh 
#

set -eu
set -o pipefail

check_jq_installed() {
    if ! jq --version 1>/dev/null 2>&1; then
        abort "jq v1.6 or above is required; install jq to continue"
    fi
}

check_ajv_installed() {
    if ! ajv help 1>/dev/null 2>&1; then
        abort "ajv v5.0.0 or above is required; install ajv via 'npm install' to continue"
    fi
}

prepend_text() {
  echo "$1 $(cat $2)" > $2
}

check_jq_installed
check_ajv_installed

APIURL=https://consent.dsde-dev.broadinstitute.org/
if test -f "./public/config.json"; then
  APIURL=$(jq '.apiUrl' ./public/config.json -r)
fi


curl -s -S -X 'GET'  "$APIURL/schemas/dataset-registration/v1"  -H 'accept: application/json' -o ./src/assets/schemas/DataRegistrationV1.json

ajv compile -s ./src/assets/schemas/DataRegistrationV1.json -o ./src/assets/schemas/DataRegistrationV1Validation.js --spec draft2019 -c ajv-formats --strict false --all-errors

prepend_text "/* eslint-disable */" ./src/assets/schemas/DataRegistrationV1Validation.js
