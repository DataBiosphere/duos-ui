#!/bin/bash
# Populates configurations necessary for local development.
# Certs are regenerated on a 3-month rotation so this script is optimized for that task.
# You MUST be on the Non-Split Broad VPN to have a whitelisted Broad IP.
# You MUST have jq, gcloud, kubectl and openssl installed to run this script.
# You MUST authenticate via gcloud
#
# See usage section below for more details. All arguments are optional.

set -eu
set -o pipefail

# All output paths below are relative to this script's directory, so the
# script behaves the same whether invoked from the repo root or from scripts/.
cd "$(dirname "$0")"

usage() {
    cat <<EOF
Usage: $0 [OPTION]...
Generate cert files for local development
  --project PROJECT     Google project where cert files are stored
  --write_env WRITE_ENV             Write an .env.local file to project root, including the BFF
                                    env vars (fetches the Azure B2C client secret and consent DB
                                    credentials from the dev cluster and generates a session
                                    secret). Values already set in an existing .env.local are
                                    carried forward, and the old file is backed up to
                                    .env.local.bak. true|false. Defaults to false
  --write_config WRITE_CONFIG       Write a config.json file in public. true|false. Defaults to false
  --help                Display this help and exit
EOF
    exit 0
}

error() {
    echo "ERROR: $1" >&2
    exit 1
}

# default values that may be overridden by command line arguments
PROJECT="broad-dsde-dev"
WRITE_ENV="false"
WRITE_CONFIG="false"

ENV_FILE="../.env.local"

# Dev-environment defaults for the BFF block written by --write_env. Only used
# when the variable has no value in an existing .env.local — existing values
# always carry forward. See .env.example for what each variable means.
# The client ID is the hand-created dev app registration (B2C sign-in only
# works with app registrations created by hand, not the terraform-created
# ones); it is not secret.
AZURE_CLIENT_ID_DEFAULT="a0e99acd-7b8d-400d-a1d3-60e497495806"
# The consent database is named `consent` in every environment.
DB_NAME_DEFAULT="consent"
AZURE_ISSUER_URL_DEFAULT="https://terradevb2c.b2clogin.com/terradevb2c.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=b2c_1a_signup_signin_duos_dev"
# Both redirect URIs are registered in B2C: this one (with :3000) matches the
# pnpm-start dev server; drop the port when running under docker compose.
OAUTH_REDIRECT_URI_DEFAULT="http://local.dsde-dev.broadinstitute.org:3000/auth/callback"
API_URL_DEFAULT="https://consent.dsde-dev.broadinstitute.org"

parse_cli_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --project)
                PROJECT=$2
                shift 2
                ;;
            --write_env)
                WRITE_ENV=$2
                shift 2
                ;;
            --write_config)
                WRITE_CONFIG=$2
                shift 2
                ;;
            --help)
                usage
                ;;
            *)
                error "Unknown option: $1. Try --help to see a list of all options."
                ;;
        esac
    done
}

auth_gcloud() {
  echo "Getting cluster credentials"
  gcloud container clusters get-credentials --zone us-central1-a --project "$PROJECT" terra-dev
}

write_certs() {
  echo "Writing cert files"
  kubectl -n local-dev get secrets local-dev-cert -o 'go-template={{ index .data "tls.crt" | base64decode }}' > ../server.crt
  kubectl -n local-dev get secrets local-dev-cert -o 'go-template={{ index .data "tls.key" | base64decode }}' > ../server.key
  kubectl -n local-dev get configmaps kube-root-ca.crt -o 'go-template={{ index .data "ca.crt" }}' > ../ca-bundle.crt
}

# Echo the current value of a variable from an existing .env.local, if any.
existing_env() {
  if [ -f "$ENV_FILE" ]; then
    grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true
  fi
}

fetch_azure_client_secret() {
  echo "Fetching Azure B2C client secret from the terra-dev namespace"
  # kubectl's .data values are base64-wrapped, so the decode is mandatory:
  # writing the wrapped value into .env.local produces AADB2C90081
  # ("client_secret does not match") at the token exchange. The real value is
  # a 40-char string like Xxx8Q~…
  AZURE_CLIENT_SECRET=$(kubectl get secret duos-azure-client-secret -n terra-dev \
    -o jsonpath='{.data.azure-client-secret}' | base64 --decode)
  if [ -z "$AZURE_CLIENT_SECRET" ]; then
    error "Could not read azure-client-secret from the terra-dev namespace. Are you on the non-split VPN?"
  fi
}

# Fetches the consent DB user/password from the consent-secrets k8s secret in
# the terra-dev namespace. Values are base64-decoded, same as the Azure secret.
fetch_db_credentials() {
  echo "Fetching consent DB credentials from the terra-dev namespace"
  DB_USER_FETCHED=$(kubectl get secret consent-secrets -n terra-dev \
    -o jsonpath='{.data.databaseUser}' | base64 --decode)
  DB_PASSWORD_FETCHED=$(kubectl get secret consent-secrets -n terra-dev \
    -o jsonpath='{.data.databasePassword}' | base64 --decode)
  if [ -z "$DB_USER_FETCHED" ] || [ -z "$DB_PASSWORD_FETCHED" ]; then
    error "Could not read databaseUser/databasePassword from consent-secrets in the terra-dev namespace. Are you on the non-split VPN?"
  fi
}

write_env() {
  fetch_azure_client_secret

  # Per-setup values carry forward from an existing .env.local so a re-run
  # (e.g. on cert rotation) never loses hand-filled configuration.
  SESSION_SECRET=$(existing_env DUOS_SESSION_SECRET)
  if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" == "change-me-to-a-random-32-plus-char-string" ]; then
    SESSION_SECRET=$(openssl rand -base64 32)
  fi
  DB_HOST=$(existing_env DUOS_DB_HOST)
  DB_NAME=$(existing_env DUOS_DB_NAME)
  DB_PORT=$(existing_env DUOS_DB_PORT)
  DB_USER=$(existing_env DUOS_DB_USER)
  DB_PASSWORD=$(existing_env DUOS_DB_PASSWORD)
  if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    fetch_db_credentials
    DB_USER=${DB_USER:-$DB_USER_FETCHED}
    DB_PASSWORD=${DB_PASSWORD:-$DB_PASSWORD_FETCHED}
  fi
  AZURE_CLIENT_ID=$(existing_env DUOS_AZURE_CLIENT_ID)
  ISSUER_URL=$(existing_env DUOS_AZURE_ISSUER_URL)
  REDIRECT_URI=$(existing_env DUOS_OAUTH_REDIRECT_URI)
  API_URL=$(existing_env DUOS_API_URL)

  if [ -f "$ENV_FILE" ]; then
    echo "Backing up existing .env.local to .env.local.bak"
    cp "$ENV_FILE" "${ENV_FILE}.bak"
  fi

  echo "Generating .env.local file"
  {
    cat <<EOF
# Generated by scripts/render-configs.sh --write_env true. Values already
# present in a previous .env.local are carried forward; see .env.example for
# what each variable means.
HOST=local.dsde-dev.broadinstitute.org
HTTPS=true
SSL_CRT_FILE=server.crt
SSL_KEY_FILE=server.key

DUOS_SESSION_SECRET=$SESSION_SECRET

# DB values must match whichever Postgres is being used — see DEVNOTES.md.
# User/password default to the dev cluster's consent-secrets values.
EOF
    if [ -n "$DB_HOST" ]; then
      echo "DUOS_DB_HOST=$DB_HOST"
    fi
    cat <<EOF
DUOS_DB_NAME=${DB_NAME:-$DB_NAME_DEFAULT}
DUOS_DB_PORT=${DB_PORT:-5432}
DUOS_DB_USER=$DB_USER
DUOS_DB_PASSWORD=$DB_PASSWORD

# The client secret below was fetched fresh (and base64-decoded) from the
# duos-azure-client-secret secret in the terra-dev namespace by this run.
DUOS_AZURE_CLIENT_ID=${AZURE_CLIENT_ID:-$AZURE_CLIENT_ID_DEFAULT}
DUOS_AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET
DUOS_AZURE_ISSUER_URL=${ISSUER_URL:-$AZURE_ISSUER_URL_DEFAULT}
DUOS_OAUTH_REDIRECT_URI=${REDIRECT_URI:-$OAUTH_REDIRECT_URI_DEFAULT}
DUOS_API_URL=${API_URL:-$API_URL_DEFAULT}
EOF
  } > "$ENV_FILE"
}

write_config() {
  echo "Generating public/config.json file"
  JSON=$(curl https://duos-k8s.dsde-dev.broadinstitute.org/config.json)
  echo "$JSON" > ../public/config.json
  jq '.env = "local"' ../public/config.json > /dev/null
  jq '.tag = "dev"' ../public/config.json > /dev/null
  jq '.hash = "dev"' ../public/config.json > /dev/null
}

parse_cli_args "$@"
auth_gcloud
write_certs
if [ "$WRITE_ENV" == "true" ]
then
  write_env
fi
if [ "$WRITE_CONFIG" == "true" ]
then
  write_config
fi
