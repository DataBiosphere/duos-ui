#!/bin/bash
# Renders site.conf, the local httpd proxy config, into the project root from
# the duos chart template in terra-helmfile. Local dev then sends the same
# security headers as the deployed proxy. Do not copy site.conf from a bucket
# or edit it by hand: that copy drifts from the deployed config.
#
# You MUST have git credentials with read access to the private
# broadinstitute/terra-helmfile repo.
#
# Usage: scripts/render-site-conf.sh

set -eu
set -o pipefail

# The output path is relative to this script's directory, so the script
# behaves the same whether invoked from the repo root or from scripts/.
cd "$(dirname "$0")"

SITE_CONF_FILE="../site.conf"
# The template's only helm value is proxyLogLevel; everything else is ${VAR}
# syntax that httpd resolves at start.
TERRA_HELMFILE_REPO="https://github.com/broadinstitute/terra-helmfile.git"
SITE_CONF_TEMPLATE_PATH="charts/duos/templates/_site.conf.tpl"
PROXY_LOG_LEVEL="warn"

error() {
    echo "ERROR: $1" >&2
    exit 1
}

echo "Rendering site.conf from the terra-helmfile duos chart template"
# Run a shallow clone of terra-helmfile to fetch the necessary template file.
helmfile_dir=$(mktemp -d)
trap 'rm -rf "$helmfile_dir"' EXIT
GIT_TERMINAL_PROMPT=0 git clone --quiet --depth 1 --filter=blob:none --no-checkout \
    --branch master "$TERRA_HELMFILE_REPO" "$helmfile_dir" \
  || error "Could not clone terra-helmfile. Check that your git credentials can read broadinstitute/terra-helmfile."
template=$(git -C "$helmfile_dir" show "HEAD:$SITE_CONF_TEMPLATE_PATH") \
  || error "Could not read $SITE_CONF_TEMPLATE_PATH from terra-helmfile."
# Drop the define/end wrapper lines and fill in the one helm value.
rendered=$(echo "$template" \
  | grep -vE '^\{\{-? *(define|end)[ "-]' \
  | sed "s/{{ *\.Values\.proxyLogLevel *}}/$PROXY_LOG_LEVEL/")
# Any helm syntax left over means the template gained a value this script
# does not know about. Fail rather than hand httpd a broken config.
if grep -q '{{' <<< "$rendered"; then
  error "_site.conf.tpl has helm syntax that this script cannot render. Update scripts/render-site-conf.sh."
fi
echo "$rendered" > "$SITE_CONF_FILE"
