#!/bin/bash
# Populates local cert files necessary for local development.
# Certs are regenerated on a 3-month rotation so this script is optimized for that task.
# You MUST be on the Broad VPN
# You MUST have jq, gcloud and kubectl installed to run this script.
# You MUST authenticate via gcloud
#
# See usage section below for more details. All arguments are optional.

set -eu
set -o pipefail

usage() {
    cat <<EOF
Usage: $0 [OPTION]...
Generate cert files for local development
  --project PROJECT     Google project where cert files are stored
  --env ENV             Write an .env.local file to project root. true|false. Defaults to false
  --config CONFIG       Write a config.json file in public. true|false. Defaults to false
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
ENV="false"
CONFIG="false"

parse_cli_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --project)
                PROJECT=$2
                shift 2
                ;;
            --env)
                ENV=$2
                shift 2
                ;;
            --config)
                CONFIG=$2
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

write_env() {
  echo "Generating .env.local file"
  echo "
HOST=local.dsde-dev.broadinstitute.org
HTTPS=true
SSL_CRT_FILE=server.crt
SSL_KEY_FILE=server.key" > ../.env.local
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
if [ "$ENV" == "true" ]
then
  write_env
fi
if [ "$CONFIG" == "true" ]
then
  write_config
fi
