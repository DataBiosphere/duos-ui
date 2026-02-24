#!/bin/sh

set -eu

cypress_requirements() {
  sudo apt update
  sudo apt install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
}

gcloud_cli_requirements() {
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
}

install_gcloud_cli() {
  sudo apt update
  sudo apt install -y google-cloud-cli
}

install_duos_cypress() {
  npm install
  npx cypress install
}

install_duos_config() {
  printf "\n"
  gcloud auth login
  gcloud config set project broad-duos-dev
  gsutil -m cp \
    "gs://consent-confgis/duos/.env.local" \
    "gs://consent-confgis/duos/site.conf" \
    "gs://consent-confgis/ca-bundle.crt" \
    "gs://consent-confgis/server.crt" \
    "gs://consent-confgis/server.key" \
    /workspaces/duos-ui
  gsutil -m cp \
    "gs://consent-confgis/duos/config.json" \
    /workspaces/duos-ui/public
}

dev_container() {
  cypress_requirements
  gcloud_cli_requirements
  install_gcloud_cli
  install_duos_cypress
  install_duos_config
}

dev_container
