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

# Only the certs come from the bucket. site.conf is rendered from terra-helmfile
# (see render_site_conf), and .env.local comes from render-configs.sh, so
# neither can drift from what the app needs.
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

# gh comes from the github-cli feature in devcontainer.json.
render_site_conf() {
  printf "\n"
  gh auth status > /dev/null 2>&1 || gh auth login
  /workspaces/duos-ui/scripts/render-site-conf.sh
}

env_local_reminder() {
  printf "\n"
  echo "This script does not write .env.local. On the non-split Broad VPN, run:"
  echo "  ./scripts/render-configs.sh --write_env true"
  echo "See DEVNOTES.md for details."
}

dev_container() {
  gcloud_cli_requirements
  install_gcloud_cli
  install_duos_config
  render_site_conf
  env_local_reminder
}

dev_container
