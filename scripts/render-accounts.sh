#!/usr/bin/env bash
set -e

## Run from root
##    ./scripts/render-accounts.sh [optional vault token]
## Pulls service account files for Cypress tests
## Log into vault first:
##    vault login -method=github token=$(cat ~/.github-token)
## Requires jq:
##    brew install jq

# Defaults
WORKING_DIR=$PWD
VAULT_TOKEN=$(cat ~/.vault-token)

VAULT_TOKEN=${1:-$VAULT_TOKEN}

docker pull broadinstitute/dsde-toolbox:dev

# render role service account credential files

listOfRoles="admin
chair
member
researcher
signing-official"

secretPath="/secret/dsde/firecloud/dev/consent/automation"
outputPath="cypress/fixtures"

for role in $listOfRoles; do
  echo "Writing $role file from $secretPath/duos-automation-$role.json"
  docker run -it --rm \
    -v "$HOME":/root \
    broadinstitute/dsde-toolbox:dev vault read \
    --format=json \
    "$secretPath"/duos-automation-"$role".json |
    jq .data \
    >"$outputPath"/duos-automation-"$role".json
done
