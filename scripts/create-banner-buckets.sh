#!/bin/bash
# DT-4063: stand up duos-banners-<env> in broad-dsde-<env> and copy the current
# feed across. Idempotent enough to re-run: an existing bucket is left as is.
# Usage: ./migrate-banner-buckets.sh [dev staging prod]
set -euo pipefail
ENVS=("${@:-dev staging prod}")
[[ $# -eq 0 ]] && ENVS=(dev staging prod)

CORS=$(mktemp)
cat > "$CORS" <<'JSON'
[{"origin": ["*"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 300}]
JSON

for ENV in "${ENVS[@]}"; do
  BUCKET="gs://duos-banners-$ENV"
  echo "== $ENV -> $BUCKET (project broad-dsde-$ENV)"
  if ! gcloud storage buckets describe "$BUCKET" >/dev/null 2>&1; then
    gcloud storage buckets create "$BUCKET" --project="broad-dsde-$ENV" --location=US --uniform-bucket-level-access
  fi
  gcloud storage buckets update "$BUCKET" --cors-file="$CORS"
  gcloud storage buckets add-iam-policy-binding "$BUCKET" --member=allUsers --role=roles/storage.objectViewer >/dev/null
  gcloud storage cp --cache-control="no-cache,max-age=0" \
    "gs://broad-duos-banners/${ENV}_notifications.json" "$BUCKET/${ENV}_notifications.json"
  echo "-- verify"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "Origin: https://duos.org" \
    "https://storage.googleapis.com/duos-banners-$ENV/${ENV}_notifications.json"
  curl -s -D - -o /dev/null "https://storage.googleapis.com/duos-banners-$ENV/${ENV}_notifications.json" \
    | grep -iE "^(cache-control|access-control-allow-origin):"
done
rm -f "$CORS"
echo "Done. Leave gs://broad-duos-banners in place until the new UI is deployed everywhere."
