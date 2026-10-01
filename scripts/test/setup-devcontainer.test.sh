#!/bin/bash
# Tests scripts/setup-devcontainer.sh with stub programs. No network, no login.
set -u

REPO=$(cd "$(dirname "$0")/../.." && pwd)
SETUP=$REPO/scripts/setup-devcontainer.sh
ALL_FLAGS="--write_env true --write_config true --write_site_conf true"
FAILS=0
WORKSPACES=()
CHECKS=0

# The external programs setup-devcontainer.sh and the stub render script run.
# The missing-binary tests give the script only these and the stubs.
BASH_BIN=$(command -v bash)
NEEDED_TOOLS=()
for tool in tr dirname id sudo; do
  if command -v "$tool" > /dev/null; then
    NEEDED_TOOLS+=("$tool")
  fi
done

cleanup() {
  local d
  for d in "${WORKSPACES[@]}"; do
    rm -rf "$d"
  done
  return 0
}
trap cleanup EXIT

new_workspace() {
  WS=$(mktemp -d)
  WORKSPACES+=("$WS")
  mkdir -p "$WS/scripts" "$WS/public" "$WS/bin" "$WS/home"
  export LOG=$WS/calls.log
  : > "$LOG"
  cat > "$WS/scripts/render-configs.sh" <<'EOF'
#!/bin/bash
echo "render-configs $*" >> "$LOG"
ws=$(dirname "$0")/..
if [[ "${STUB_RENDER_FAIL:-0}" == 1 ]]; then
  exit 1
fi
for f in server.crt server.key ca-bundle.crt .env.local public/config.json site.conf; do
  echo x > "$ws/$f"
done
EOF
  cat > "$WS/bin/gh" <<'EOF'
#!/bin/bash
[[ "${STUB_GH_OK:-1}" == 1 ]]
EOF
  cat > "$WS/bin/gcloud" <<'EOF'
#!/bin/bash
[[ "${STUB_GCLOUD_OK:-1}" == 1 ]] && echo "user@example.org"
exit 0
EOF
  printf '#!/bin/bash\nexit 0\n' > "$WS/bin/kubectl"
  chmod +x "$WS"/scripts/*.sh "$WS"/bin/*
  return 0
}

# Present files have content. An empty file counts as missing.
all_files() {
  local f
  for f in server.crt server.key ca-bundle.crt .env.local public/config.json site.conf; do
    echo x > "$WS/$f"
  done
  return 0
}

# Set TEST_PATH to change PATH, for example to leave the stub programs out.
run_setup() {
  OUT=$(PATH="${TEST_PATH:-$WS/bin:$PATH}" HOME="$WS/home" DUOS_WORKSPACE="$WS" "$BASH_BIN" "$SETUP" "$@" 2>&1)
  CODE=$?
  return 0
}

# Make $WS/iso: symlinks to the real tools the script needs, plus the stubs
# in $WS/bin except the ones named in the arguments. Use it as TEST_PATH.
# Nothing else on the host, such as a real gh, can be found.
isolate_without() {
  local tool stub hide
  mkdir -p "$WS/iso"
  for tool in "${NEEDED_TOOLS[@]}"; do
    ln -s "$(command -v "$tool")" "$WS/iso/$tool"
  done
  for stub in "$WS"/bin/*; do
    for hide in "$@"; do
      [[ "$(basename "$stub")" == "$hide" ]] && continue 2
    done
    ln -s "$stub" "$WS/iso/$(basename "$stub")"
  done
  return 0
}

expect() {
  local name=$1 status=$2
  CHECKS=$((CHECKS + 1))
  if [[ "$status" == 0 ]]; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    FAILS=$((FAILS + 1))
  fi
  return 0
}

# 1. All files present: call nothing.
new_workspace; all_files; run_setup
expect "all present: exit 0" "$CODE"
[[ ! -s "$LOG" ]]; expect "all present: no render call" $?

# 2. One file missing, logged in: one call with all three write options.
new_workspace; all_files; rm "$WS/site.conf"; run_setup
expect "one missing: exit 0" "$CODE"
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "one missing: one call, all flags" $?
[[ "$(wc -l < "$LOG")" -eq 1 ]]; expect "one missing: exactly one call" $?
grep -q "All local config files are present." <<< "$OUT"; expect "one missing: reports success" $?

# 3. No config files at all, logged in: same single call.
new_workspace; run_setup
expect "none present: exit 0" "$CODE"
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "none present: one call, all flags" $?

# 4. gcloud not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GCLOUD_OK=0 run_setup
expect "no gcloud login: exit 0" "$CODE"
[[ ! -s "$LOG" ]]; expect "no gcloud login: no render call" $?
grep -q "gcloud auth login --no-launch-browser" <<< "$OUT"; expect "no gcloud login: prints command" $?
! grep -q "gh auth login" <<< "$OUT"; expect "no gcloud login: no gh message" $?

# 5. gh not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GH_OK=0 run_setup
expect "no gh login: exit 0" "$CODE"
[[ ! -s "$LOG" ]]; expect "no gh login: no render call" $?
grep -q "gh auth login" <<< "$OUT"; expect "no gh login: prints command" $?
! grep -q "gcloud auth login" <<< "$OUT"; expect "no gh login: no gcloud message" $?

# 6. --refresh: call even when all files exist.
new_workspace; all_files; run_setup --refresh
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "refresh: one call, all flags" $?

# 7. render-configs.sh fails: warn and exit 0.
new_workspace; STUB_RENDER_FAIL=1 run_setup
expect "render fails: exit 0" "$CODE"
grep -q "WARNING" <<< "$OUT"; expect "render fails: prints warning" $?
! grep -q -- "--refresh" <<< "$OUT"; expect "render fails: plain hint without --refresh" $?

# 8. Workspace default: the script's own repo root.
new_workspace; all_files; rm "$WS/site.conf"
cp "$SETUP" "$WS/scripts/setup-devcontainer.sh"
OUT=$(env -u DUOS_WORKSPACE PATH="$WS/bin:$PATH" HOME="$WS/home" "$BASH_BIN" "$WS/scripts/setup-devcontainer.sh" 2>&1)
CODE=$?
expect "default workspace: exit 0" "$CODE"
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "default workspace: calls the render script beside it" $?

# 9. An empty file counts as missing.
new_workspace; all_files; : > "$WS/server.crt"; run_setup
grep -q "Missing local config files: server.crt" <<< "$OUT"; expect "empty file: reported missing" $?
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "empty file: render call" $?

# 10. Failed --refresh: the hint says to rerun with --refresh.
new_workspace; all_files; STUB_RENDER_FAIL=1 run_setup --refresh
expect "refresh fails: exit 0" "$CODE"
grep -q "run ./scripts/setup-devcontainer.sh --refresh" <<< "$OUT"; expect "refresh fails: hint has --refresh" $?

# 11. Missing binaries: name only the missing tools, do not print its login hint.
# TEST_PATH is an isolated dir, so a real gh or gcloud on the host is not seen.
new_workspace; isolate_without gcloud; TEST_PATH="$WS/iso" run_setup
expect "no gcloud binary: exit 0" "$CODE"
[[ ! -s "$LOG" ]]; expect "no gcloud binary: no render call" $?
grep -q "Missing tools: gcloud\. " <<< "$OUT"; expect "no gcloud binary: names only gcloud" $?
! grep -q "kubectl" <<< "$OUT"; expect "no gcloud binary: does not name kubectl" $?
! grep -q "gcloud auth login" <<< "$OUT"; expect "no gcloud binary: no login hint" $?

new_workspace; isolate_without kubectl; TEST_PATH="$WS/iso" run_setup
expect "no kubectl binary: exit 0" "$CODE"
grep -q "Missing tools: kubectl\. " <<< "$OUT"; expect "no kubectl binary: names only kubectl" $?
! grep -q "gcloud" <<< "$OUT"; expect "no kubectl binary: does not name gcloud" $?
! grep -q "gcloud auth login" <<< "$OUT"; expect "no kubectl binary: no login hint" $?

new_workspace; isolate_without gh; TEST_PATH="$WS/iso" run_setup
expect "no gh binary: exit 0" "$CODE"
[[ ! -s "$LOG" ]]; expect "no gh binary: no render call" $?
grep -q "Missing tools: gh\. " <<< "$OUT"; expect "no gh binary: names only gh" $?
! grep -q "gcloud\|kubectl" <<< "$OUT"; expect "no gh binary: does not name gcloud or kubectl" $?
! grep -q "gh auth login" <<< "$OUT"; expect "no gh binary: no login hint" $?

new_workspace; isolate_without gcloud gh; TEST_PATH="$WS/iso" run_setup
expect "two binaries missing: exit 0" "$CODE"
grep -q "Missing tools: gcloud, gh\. " <<< "$OUT"; expect "two binaries missing: names both" $?

# 12. Every tool installed and logged in: no tool is named as missing.
new_workspace; isolate_without; TEST_PATH="$WS/iso" run_setup
expect "nothing wrong: exit 0" "$CODE"
! grep -q "Missing tools" <<< "$OUT"; expect "nothing wrong: names no tool" $?
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "nothing wrong: render call" $?

if [[ "$FAILS" == 0 ]]; then
  echo "All tests passed. ($CHECKS checks)"
else
  echo "$FAILS test(s) failed. ($CHECKS checks)"
fi
exit "$FAILS"
