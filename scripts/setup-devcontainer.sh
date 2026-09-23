#!/bin/sh

set -eu

gcloud_cli_requirements() {
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
}

install_gcloud_cli() {
  sudo apt update
  sudo apt install -y google-cloud-cli
}

# Only the certs and config.json come from the bucket. render-configs.sh makes
# .env.local and site.conf on the host (see host_config_reminder), so neither
# can drift from what the app needs.
install_duos_config() {
  printf "\n"
  gcloud auth login
  gcloud config set project broad-duos-dev
  gsutil -m cp \
    "gs://consent-confgis/ca-bundle.crt" \
    "gs://consent-confgis/server.crt" \
    "gs://consent-confgis/server.key" \
    /workspaces/duos-ui
  gsutil -m cp \
    "gs://consent-confgis/duos/config.json" \
    /workspaces/duos-ui/public
}

# The workspace is a bind mount, so files that the host writes show up here.
host_config_reminder() {
  printf "\n"
  echo "This script does not write .env.local or site.conf. On the host, on the"
  echo "non-split Broad VPN, run:"
  echo "  ./scripts/render-configs.sh --write_env true --write_config true --write_site_conf true"
  echo "See DEVNOTES.md for details."
}

dev_container() {
  gcloud_cli_requirements
  install_gcloud_cli
  install_duos_config
  host_config_reminder
}

dev_container
