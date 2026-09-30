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

# The main config sets no workspaceFolder, so the path depends on the folder name.
WORKSPACE=${DUOS_WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}
CONFIG_FILES=(server.crt server.key ca-bundle.crt .env.local public/config.json site.conf)
REFRESH=false
RERUN="./scripts/setup-devcontainer.sh"
if [[ "${1:-}" == "--refresh" ]]; then
  REFRESH=true
  RERUN="./scripts/setup-devcontainer.sh --refresh"
fi

# Docker makes named volumes owned by root. Give them to this user.
fix_volume_owner() {
  local dir
  for dir in "$HOME/.config" "$HOME/.config/gcloud" "$HOME/.config/gh"; do
    if [[ -d "$dir" && ! -w "$dir" ]]; then
      sudo -n chown "$(id -u):$(id -g)" "$dir" || true
    fi
  done
  return 0
}

missing_files() {
  local f
  for f in "${CONFIG_FILES[@]}"; do
    # -s: an empty file (a failed render) counts as missing.
    if [[ ! -s "$WORKSPACE/$f" ]]; then
      echo "$f"
    fi
  done
  return 0
}

# Print the tools that are not installed, joined with ", ".
missing_tools() {
  local tool list=""
  for tool in gcloud kubectl gh; do
    if ! command -v "$tool" > /dev/null; then
      list="${list:+$list, }$tool"
    fi
  done
  echo "$list"
  return 0
}

# Print what is wrong. Return 1 if a tool or a login is missing.
# A login hint is printed only for an installed tool. The gcloud login check
# also needs kubectl, so it is skipped when either one is missing.
check_logins() {
  local ok=0 absent
  absent=$(missing_tools)
  if [[ -n "$absent" ]]; then
    echo "Missing tools: $absent. Rebuild the container."
    ok=1
  fi
  if command -v gcloud > /dev/null && command -v kubectl > /dev/null \
    && [[ -z "$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2> /dev/null)" ]]; then
    echo "Google Cloud is not ready. Connect the host to the non-split Broad VPN. Then run:"
    echo "  gcloud auth login --no-launch-browser"
    ok=1
  fi
  if command -v gh > /dev/null && ! gh auth status > /dev/null 2>&1; then
    echo "GitHub is not ready. Use an account that can read broadinstitute/terra-helmfile. Run:"
    echo "  gh auth login"
    ok=1
  fi
  return "$ok"
}

# render-configs.sh truncates each file before it fills it. A failed run
# (for example, no VPN) would leave a valid file empty. Keep a copy of every
# existing file and put it back if the run fails.
backup_configs() {
  local f
  for f in "${CONFIG_FILES[@]}"; do
    if [[ -e "$WORKSPACE/$f" ]]; then
      mkdir -p "$BACKUP/$(dirname "$f")"
      cp -p "$WORKSPACE/$f" "$BACKUP/$f"
    fi
  done
  return 0
}

# Put back the saved files. Remove a file that did not exist before the run.
restore_configs() {
  local f
  for f in "${CONFIG_FILES[@]}"; do
    if [[ -e "$BACKUP/$f" ]]; then
      cp -p "$BACKUP/$f" "$WORKSPACE/$f"
    else
      rm -f "$WORKSPACE/$f"
    fi
  done
  return 0
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
  echo "After you fix this, run: $RERUN"
  echo "See DEVNOTES.md for details."
  exit 0
fi

BACKUP=$(mktemp -d)
trap 'rm -rf "$BACKUP"' EXIT
backup_configs
if ! "$WORKSPACE/scripts/render-configs.sh" --write_env true --write_config true --write_site_conf true; then
  restore_configs
  echo "WARNING: render-configs.sh failed. Your earlier files are back. Fix the cause above and run $RERUN again."
  exit 0
fi

missing=$(missing_files | tr '\n' ' ')
if [[ -z "$missing" ]]; then
  echo "All local config files are present."
else
  echo "Still missing: $missing"
fi
