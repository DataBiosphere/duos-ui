#!/bin/bash
# Runs after the dev container is created. Installs gcloud, asks for a gcloud
# login, then makes the local config files by calling render-configs.sh with
# every write option. Each step can run again safely, so run this script again
# after a failure or when the certs rotate.
#
# Developers who do not use the dev container run render-configs.sh directly.

set -eu
set -o pipefail

# The main config sets no workspaceFolder, so the path depends on the folder name.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

gcloud_cli_requirements() {
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg \
    | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/cloud.google.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
    | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list > /dev/null
}

install_gcloud_cli() {
  sudo apt-get update
  sudo apt-get install -y google-cloud-cli google-cloud-cli-gke-gcloud-auth-plugin
}

install_duos_config() {
  printf "\n"
  gcloud auth login
  ./scripts/render-configs.sh --write_env true --write_config true --write_site_conf true
}

dev_container() {
  gcloud_cli_requirements
  install_gcloud_cli
  install_duos_config
}

dev_container
