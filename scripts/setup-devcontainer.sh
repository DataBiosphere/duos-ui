#!/bin/bash
# Runs after the dev container is created. Makes the local config files by
# calling render-configs.sh with every write option, from inside the container.
#
#   scripts/setup-devcontainer.sh            run only when a config file is missing
#   scripts/setup-devcontainer.sh --refresh  run always (for cert rotation)
#
# The script always exits 0. A missing login is not a container error.
# It prints the command that fixes the problem. Run this script again after.
#
# Developers who do not use the dev container run render-configs.sh directly.

set -eu

WORKSPACE=${DUOS_WORKSPACE:-/workspaces/duos-ui}
CONFIG_FILES=(server.crt server.key ca-bundle.crt .env.local public/config.json site.conf)
REFRESH=false
if [[ "${1:-}" == "--refresh" ]]; then
  REFRESH=true
fi

# Docker makes named volumes owned by root. Give them to this user.
fix_volume_owner() {
  local dir
  for dir in "$HOME/.config" "$HOME/.config/gcloud" "$HOME/.config/gh"; do
    if [[ -d "$dir" && ! -w "$dir" ]]; then
      sudo chown "$(id -u):$(id -g)" "$dir" || true
    fi
  done
}

missing_files() {
  local f
  for f in "${CONFIG_FILES[@]}"; do
    if [[ ! -f "$WORKSPACE/$f" ]]; then
      echo "$f"
    fi
  done
}

# Print the login commands that are needed. Return 1 if any login is missing.
check_logins() {
  local ok=0
  if ! command -v gcloud > /dev/null || ! command -v kubectl > /dev/null \
    || [[ -z "$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2> /dev/null)" ]]; then
    echo "Google Cloud is not ready. Connect the host to the non-split Broad VPN. Then run:"
    echo "  gcloud auth login --no-launch-browser"
    ok=1
  fi
  if ! command -v gh > /dev/null || ! gh auth status > /dev/null 2>&1; then
    echo "GitHub is not ready. Use an account that can read broadinstitute/terra-helmfile. Run:"
    echo "  gh auth login"
    ok=1
  fi
  return "$ok"
}

fix_volume_owner

missing=$(missing_files | tr '\n' ' ')
if [[ -z "$missing" && "$REFRESH" == "false" ]]; then
  echo "All local config files are present."
  exit 0
fi

if [[ -n "$missing" ]]; then
  echo "Missing local config files: $missing"
fi

if ! check_logins; then
  echo
  echo "After you log in, run: ./scripts/setup-devcontainer.sh"
  echo "See DEVNOTES.md for details."
  exit 0
fi

if ! "$WORKSPACE/scripts/render-configs.sh" --write_env true --write_config true --write_site_conf true; then
  echo "WARNING: render-configs.sh failed. Fix the cause above and run ./scripts/setup-devcontainer.sh again."
  exit 0
fi

missing=$(missing_files | tr '\n' ' ')
if [[ -z "$missing" ]]; then
  echo "All local config files are present."
else
  echo "Still missing: $missing"
fi
