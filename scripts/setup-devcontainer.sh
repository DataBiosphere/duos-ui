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

install_openjdk_25() {
  sudo apt update
  sudo apt install -y openjdk-25-jdk

  java_bin="$(readlink -f "$(command -v javac)")"
  java_home="${java_bin%/bin/javac}"

  # Set JAVA_HOME in /etc/profile.d so it's available to all users in all shells
  echo "export JAVA_HOME=\"$java_home\"" | sudo tee /etc/profile.d/java-home.sh >/dev/null
  sudo chmod 644 /etc/profile.d/java-home.sh
  
  # Also update /etc/environment for non-interactive shells
  if sudo grep -q '^JAVA_HOME=' /etc/environment; then
    sudo sed -i "s|^JAVA_HOME=.*|JAVA_HOME=\"$java_home\"|" /etc/environment
  else
    echo "JAVA_HOME=\"$java_home\"" | sudo tee -a /etc/environment >/dev/null
  fi
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
  install_openjdk_25
  install_duos_cypress
  install_duos_config
}

dev_container
