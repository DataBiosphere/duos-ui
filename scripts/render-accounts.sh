#!/usr/bin/env bash
#
# Pulls service account credentials for Cypress tests. Requires gcloud and jq.
#
# USAGE: ./scripts/render-accounts.sh
#

set -eu
set -o pipefail

LIST_OF_ROLES="admin
chair
member
researcher
signing-official"

PROJECT="broad-dsde-qa"
OUTPUT_DIR="cypress/fixtures"

for ROLE in $LIST_OF_ROLES; do
  FILE="$OUTPUT_DIR/duos-automation-$ROLE.json"
  echo "Writing $ROLE secret to $FILE"
  gcloud secrets versions access latest --project="$PROJECT" --secret="duos-automation-${ROLE}-sa" | jq . > "$FILE"
done
