#!/bin/bash

set -eux

ENV=${ENV:-dev}
PROJECT=${PROJECT:-duos-ui}
VAULT_TOKEN=${VAULT_TOKEN:-$(cat /etc/vault-token-dsde)}

GIT_COMMIT=$(git rev-parse --short=12 HEAD)
SVCACCT_FILE="dspci-wb-gcr-service-account.json"
GCR_SVCACCT_VAULT="secret/dsde/dsp-techops/common/${SVCACCT_FILE}"
GCR_REPO_PROJ="broad-dsp-gcr-public"

# Generate SA
docker run --rm  -e VAULT_TOKEN="${VAULT_TOKEN}" \
   broadinstitute/dsde-toolbox:latest vault read --format=json ${GCR_SVCACCT_VAULT} \
   | jq .data > "${SVCACCT_FILE}"

# Build
docker build -t "${PROJECT}" .
docker tag "${PROJECT}" gcr.io/"${GCR_REPO_PROJ}"/"${PROJECT}":"${GIT_COMMIT}"
docker tag "${PROJECT}" gcr.io/"${GCR_REPO_PROJ}"/"${PROJECT}":"${ENV}"

# Push to GCR
gcloud auth activate-service-account --key-file="${SVCACCT_FILE}"
docker push gcr.io/"${GCR_REPO_PROJ}"/"${PROJECT}":"${GIT_COMMIT}"
docker push gcr.io/"${GCR_REPO_PROJ}"/"${PROJECT}":"${ENV}"

# Clean up
rm -f "${SVCACCT_FILE}"