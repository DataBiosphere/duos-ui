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
  sudo corepack enable
  corepack prepare pnpm@11.1.2 --activate
  pnpm install
  pnpm exec cypress install
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

# Clone the consent backend repo as a sibling of duos-ui so the multi-root
# workspace (.devcontainer/duos-fullstack.code-workspace) can include both
# projects in a single VS Code window. Idempotent: skipped if already present.
clone_consent_repo() {
  if [ -d "/workspaces/consent/.git" ]; then
    echo "consent repo already present at /workspaces/consent; skipping clone."
    return 0
  fi
  # /workspaces is root-owned by default; ensure the target dir is writable by
  # the non-root devcontainer user before cloning.
  if [ ! -d /workspaces/consent ]; then
    sudo mkdir -p /workspaces/consent
    sudo chown "$(id -u):$(id -g)" /workspaces/consent
  fi
  # Ensure github.com host key is trusted for non-interactive SSH clone.
  mkdir -p "$HOME/.ssh"
  if ! grep -q "github.com" "$HOME/.ssh/known_hosts" 2>/dev/null; then
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
  fi
  if ! git clone git@github.com:DataBiosphere/consent.git /workspaces/consent; then
    echo "WARNING: failed to clone consent via SSH. Ensure SSH agent forwarding is enabled" >&2
    echo "         (see https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)." >&2
    return 0
  fi
}

dev_container() {
  cypress_requirements
  gcloud_cli_requirements
  install_gcloud_cli
  install_duos_cypress
  install_duos_config
  clone_consent_repo
}

dev_container
