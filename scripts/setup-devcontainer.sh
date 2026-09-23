#!/bin/sh

set -eu

# The dev container makes no local config. render-configs.sh makes all of it on
# the host (certs from the dev cluster, .env.local, config.json, site.conf),
# and the workspace bind mount carries those files into the container.
WORKSPACE=/workspaces/duos-ui
CONFIG_FILES="server.crt server.key ca-bundle.crt .env.local public/config.json site.conf"

missing=""
for file in $CONFIG_FILES; do
  [ -f "$WORKSPACE/$file" ] || missing="$missing $file"
done

if [ -z "$missing" ]; then
  echo "All local config files are present."
  exit 0
fi

printf "\n"
echo "Missing local config files:$missing"
echo "On the host, on the non-split Broad VPN, run:"
echo "  ./scripts/render-configs.sh --write_env true --write_config true --write_site_conf true"
echo "See DEVNOTES.md for details."
