#!/usr/bin/env bash
#
# Pulls the role service-account keys the signed-in e2e specs need
# (test/e2e/support/auth.ts) and writes them as an environment file.
# Requires gcloud and jq.
#
# USAGE:
#   ./scripts/render-accounts.sh
#   set -a; source test/e2e/fixtures/duos-automation.env; set +a
#   pnpm run test:e2e
#
# The file holds live credentials and is gitignored. It is written with
# owner-only permissions.
#

set -eu
set -o pipefail

LIST_OF_ROLES="admin
chair
member
researcher
signing-official"

PROJECT="broad-dsde-qa"
OUTPUT_DIR="test/e2e/fixtures"
OUTPUT_FILE="$OUTPUT_DIR/duos-automation.env"

mkdir -p "$OUTPUT_DIR"
umask 077

# Built in a temporary file and moved into place only after every role
# succeeds, so a failed fetch — expired login, wrong project, no VPN — leaves
# a working set of credentials intact.
TMP_FILE=$(mktemp "$OUTPUT_DIR/.duos-automation.XXXXXX")
trap 'rm -f "$TMP_FILE"' EXIT

for ROLE in $LIST_OF_ROLES; do
  # The fixture reads one variable per role, upper-cased, with dashes as
  # underscores: signing-official becomes DUOS_AUTOMATION_SIGNING_OFFICIAL_SA.
  VAR="DUOS_AUTOMATION_$(echo "$ROLE" | tr 'a-z-' 'A-Z_')_SA"
  echo "Writing $ROLE key to $OUTPUT_FILE as $VAR"
  # Compact, so the value is one line a shell can source. Single quotes are
  # safe: JSON escapes its own quotes and carries no apostrophes.
  KEY=$(gcloud secrets versions access latest --project="$PROJECT" --secret="duos-automation-${ROLE}-sa" | jq -c .)
  # gcloud failing is caught by pipefail; an empty or null body is not.
  if [ -z "$KEY" ] || [ "$KEY" = 'null' ]; then
    echo "No key returned for $ROLE — $OUTPUT_FILE is unchanged" >&2
    exit 1
  fi
  printf "%s='%s'\n" "$VAR" "$KEY" >> "$TMP_FILE"
done

mv "$TMP_FILE" "$OUTPUT_FILE"
trap - EXIT

echo
echo "Load them with: set -a; source $OUTPUT_FILE; set +a"
