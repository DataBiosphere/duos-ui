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

# On failure, tell the developer how to recover. Most failures come from a
# missing VPN connection, which blocks kubectl.
on_exit() {
  local status=$?
  if (( status != 0 )); then
    echo >&2
    echo "Dev container setup failed. Are you connected to the non-split Broad VPN?" >&2
    echo "Fix the issue, then rebuild the container or run: ./scripts/setup-devcontainer.sh" >&2
  fi
}
trap on_exit EXIT

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
