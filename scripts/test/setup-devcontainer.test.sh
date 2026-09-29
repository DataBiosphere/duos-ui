#!/bin/bash
# Tests scripts/setup-devcontainer.sh with stub programs. No network, no login.
set -u

REPO=$(cd "$(dirname "$0")/../.." && pwd)
SETUP=$REPO/scripts/setup-devcontainer.sh
ALL_FLAGS="--write_env true --write_config true --write_site_conf true"
FAILS=0
WORKSPACES=()

cleanup() {
  local d
  for d in "${WORKSPACES[@]}"; do
    rm -rf "$d"
  done
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
[ "${STUB_RENDER_FAIL:-0}" = 1 ] && exit 1
ws=$(dirname "$0")/..
for f in server.crt server.key ca-bundle.crt .env.local public/config.json site.conf; do
  echo x > "$ws/$f"
done
EOF
  cat > "$WS/bin/gh" <<'EOF'
#!/bin/bash
[ "${STUB_GH_OK:-1}" = 1 ]
EOF
  cat > "$WS/bin/gcloud" <<'EOF'
#!/bin/bash
[ "${STUB_GCLOUD_OK:-1}" = 1 ] && echo "user@example.org"
exit 0
EOF
  printf '#!/bin/bash\nexit 0\n' > "$WS/bin/kubectl"
  chmod +x "$WS"/scripts/*.sh "$WS"/bin/*
}

# Present files have content. An empty file counts as missing.
all_files() {
  local f
  for f in server.crt server.key ca-bundle.crt .env.local public/config.json site.conf; do
    echo x > "$WS/$f"
  done
}

# Set TEST_PATH to change PATH, for example to leave the stub programs out.
run_setup() {
  OUT=$(PATH="${TEST_PATH:-$WS/bin:$PATH}" HOME="$WS/home" DUOS_WORKSPACE="$WS" bash "$SETUP" "$@" 2>&1)
  CODE=$?
}

expect() {
  if [ "$2" = 0 ]; then echo "PASS: $1"; else echo "FAIL: $1"; FAILS=$((FAILS + 1)); fi
}

# 1. All files present: call nothing.
new_workspace; all_files; run_setup
expect "all present: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "all present: no render call" $?

# 2. One file missing, logged in: one call with all three write options.
new_workspace; all_files; rm "$WS/site.conf"; run_setup
expect "one missing: exit 0" "$CODE"
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "one missing: one call, all flags" $?
[ "$(wc -l < "$LOG")" -eq 1 ]; expect "one missing: exactly one call" $?
grep -q "All local config files are present." <<< "$OUT"; expect "one missing: reports success" $?

# 3. No config files at all, logged in: same single call.
new_workspace; run_setup
expect "none present: exit 0" "$CODE"
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "none present: one call, all flags" $?

# 4. gcloud not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GCLOUD_OK=0 run_setup
expect "no gcloud login: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gcloud login: no render call" $?
grep -q "gcloud auth login --no-launch-browser" <<< "$OUT"; expect "no gcloud login: prints command" $?
! grep -q "gh auth login" <<< "$OUT"; expect "no gcloud login: no gh message" $?

# 5. gh not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GH_OK=0 run_setup
expect "no gh login: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gh login: no render call" $?
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
OUT=$(env -u DUOS_WORKSPACE PATH="$WS/bin:$PATH" HOME="$WS/home" bash "$WS/scripts/setup-devcontainer.sh" 2>&1)
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

# 11. Missing binaries: say so, do not print the login hint.
new_workspace; rm "$WS/bin/gcloud"; TEST_PATH="$WS/bin:/usr/bin:/bin" run_setup
expect "no gcloud binary: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gcloud binary: no render call" $?
grep -q "gcloud and kubectl are not installed" <<< "$OUT"; expect "no gcloud binary: install message" $?
! grep -q "gcloud auth login" <<< "$OUT"; expect "no gcloud binary: no login hint" $?

new_workspace; rm "$WS/bin/kubectl"; TEST_PATH="$WS/bin:/usr/bin:/bin" run_setup
grep -q "gcloud and kubectl are not installed" <<< "$OUT"; expect "no kubectl binary: install message" $?
! grep -q "gcloud auth login" <<< "$OUT"; expect "no kubectl binary: no login hint" $?

new_workspace; rm "$WS/bin/gh"; TEST_PATH="$WS/bin:/usr/bin:/bin" run_setup
expect "no gh binary: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gh binary: no render call" $?
grep -q "gh is not installed" <<< "$OUT"; expect "no gh binary: install message" $?
! grep -q "gh auth login" <<< "$OUT"; expect "no gh binary: no login hint" $?

[ "$FAILS" = 0 ] && echo "All tests passed." || echo "$FAILS test(s) failed."
exit "$FAILS"
