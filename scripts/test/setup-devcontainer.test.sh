#!/bin/bash
# Tests scripts/setup-devcontainer.sh with stub programs. No network, no login.
set -u

REPO=$(cd "$(dirname "$0")/../.." && pwd)
SETUP=$REPO/scripts/setup-devcontainer.sh
ALL_FLAGS="--write_env true --write_config true --write_site_conf true"
FAILS=0

new_workspace() {
  WS=$(mktemp -d)
  mkdir -p "$WS/scripts" "$WS/public" "$WS/bin" "$WS/home"
  export LOG=$WS/calls.log
  : > "$LOG"
  cat > "$WS/scripts/render-configs.sh" <<'EOF'
#!/bin/bash
echo "render-configs $*" >> "$LOG"
[ "${STUB_RENDER_FAIL:-0}" = 1 ] && exit 1
ws=$(dirname "$0")/..
touch "$ws/server.crt" "$ws/server.key" "$ws/ca-bundle.crt" \
  "$ws/.env.local" "$ws/public/config.json" "$ws/site.conf"
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

all_files() {
  touch "$WS/server.crt" "$WS/server.key" "$WS/ca-bundle.crt" \
    "$WS/.env.local" "$WS/public/config.json" "$WS/site.conf"
}

run_setup() {
  OUT=$(PATH="$WS/bin:$PATH" HOME="$WS/home" DUOS_WORKSPACE="$WS" bash "$SETUP" "$@" 2>&1)
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
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "none present: one call, all flags" $?

# 4. gcloud not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GCLOUD_OK=0 run_setup
expect "no gcloud login: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gcloud login: no render call" $?
grep -q "gcloud auth login --no-launch-browser" <<< "$OUT"; expect "no gcloud login: prints command" $?

# 5. gh not logged in: skip the call, print the command, exit 0.
new_workspace; STUB_GH_OK=0 run_setup
expect "no gh login: exit 0" "$CODE"
[ ! -s "$LOG" ]; expect "no gh login: no render call" $?
grep -q "gh auth login" <<< "$OUT"; expect "no gh login: prints command" $?

# 6. --refresh: call even when all files exist.
new_workspace; all_files; run_setup --refresh
grep -qx "render-configs $ALL_FLAGS" "$LOG"; expect "refresh: one call, all flags" $?

# 7. render-configs.sh fails: warn and exit 0.
new_workspace; STUB_RENDER_FAIL=1 run_setup
expect "render fails: exit 0" "$CODE"
grep -q "WARNING" <<< "$OUT"; expect "render fails: prints warning" $?

[ "$FAILS" = 0 ] && echo "All tests passed." || echo "$FAILS test(s) failed."
exit "$FAILS"
