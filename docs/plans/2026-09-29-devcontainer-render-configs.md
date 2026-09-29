# Dev Container Config Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a new dev container starts, `scripts/setup-devcontainer.sh` runs `render-configs.sh` with every write option, so the container makes all local config files.

**Architecture:** The setup script stays the `postCreateCommand`. It becomes a thin wrapper. If any config file is missing, it calls `render-configs.sh --write_env true --write_config true --write_site_conf true` as one child process. The user logs in once by hand inside the container (approved: option 1). Docker volumes keep the `gcloud` and `gh` logins across rebuilds. Developers who do not use dev containers run `render-configs.sh` alone, as they do now.

**Tech Stack:** Bash, dev container features, `gcloud`, `kubectl`, `gh`, `jq`.

**Spec:** The brainstorming conversation of 2026-09-29. This plan reverses the DT-4180 rule that the host makes all config.

## Global Constraints

- `render-configs.sh` MUST NOT change. Its flags and output files stay the same for host use.
- The setup script MUST exit 0 when config is missing or a login is missing. A non-zero exit shows a recovery prompt in VS Code.
- The setup script MUST NOT print secret values.
- Every PR is a draft. Use `gh pr create --draft`.
- Two approvals are required. Report review state as N/2.
- The PR description is a markdown code block with Title, Addresses, Summary, Test plan, and the contributing-guide footer.

## Workflows

| Developer | Steps |
|---|---|
| Dev container | 1. Connect the host to the non-split Broad VPN. 2. Reopen the project in the container. 3. `postCreateCommand` runs the setup script. 4. On the first start, log in with `gcloud auth login --no-launch-browser` and `gh auth login`. 5. Run `./scripts/setup-devcontainer.sh` again. |
| Container rebuild | The volumes keep the logins. The bind mount keeps the files. The script finds nothing missing and does nothing. |
| No dev container | Run `./scripts/render-configs.sh --write_env true --write_config true --write_site_conf true`. No change from today. |
| Cert rotation in the container | Run `./scripts/setup-devcontainer.sh --refresh`. |

## What the review found

| Item | Finding | Effect on the plan |
|---|---|---|
| `render-configs.sh` main block | It runs at once when sourced. There is no source guard. | Call it as a child process. Do not source it. |
| `render-configs.sh` `write_site_conf` | It already calls `render-site-conf.sh`. | One call with `--write_site_conf true` covers `site.conf`. |
| `render-configs.sh` `write_env` | It keeps old values and backs up `.env.local` to `.env.local.bak`. | A repeat run is safe. |
| `render-configs.sh` `auth_gcloud` | Needs `gcloud`, `kubectl`, and a `gcloud` login. A GKE cluster also needs `gke-gcloud-auth-plugin`. | Add these to the image. |
| `render-configs.sh` header | Needs `jq`, `openssl`, `curl`, and `gh` (for `site.conf`). | Confirm all are in the image (Task 1). |
| `setup-devcontainer.sh` | It only checks files. It hard-codes `/workspaces/duos-ui`. | Rewrite it. Add an env override for tests. |
| Both `.devcontainer` files | The image has Java and Node. It has no `gh`, `gcloud`, or `kubectl`. | Add features and volumes. |
| Repo | No shell test harness exists. | Add one plain-Bash test with stub programs. |

Out of scope: `write_config` in `render-configs.sh` (lines 245-247) sends the `jq` output to `/dev/null`. It never sets `env`, `tag`, or `hash` in `config.json`. File a separate ticket.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `scripts/setup-devcontainer.sh` | Rewrite | Find missing files. Check logins. Call `render-configs.sh`. Print next steps. |
| `scripts/test/setup-devcontainer.test.sh` | Create | Test the setup script with stub programs. |
| `.devcontainer/devcontainer.json` | Modify | Add features and login volumes. |
| `.devcontainer/uber/devcontainer.json` | Modify | Same as above. |
| `DEVNOTES.md` | Modify | Rewrite the "Dev Container" section. |

---

### Task 1: Check the image and the network (spike)

This task makes no commit. It gives facts that Task 3 needs.

- [ ] **Step 1: Build the container with the current config**

```bash
npx @devcontainers/cli up --workspace-folder /Users/grushton/develop/duos-ui
```

Expected: JSON that ends with `"outcome":"success"`.

- [ ] **Step 2: Check which tools exist**

```bash
npx @devcontainers/cli exec --workspace-folder /Users/grushton/develop/duos-ui bash -c 'for t in jq openssl curl base64 gh gcloud kubectl gke-gcloud-auth-plugin; do printf "%s: " $t; command -v $t || echo MISSING; done'
```

Expected: `gh`, `gcloud`, `kubectl`, and `gke-gcloud-auth-plugin` show MISSING. Record the state of `jq`.

- [ ] **Step 3: Check that the container can reach the VPN**

Connect the host to the non-split Broad VPN. Then run:

```bash
npx @devcontainers/cli exec --workspace-folder /Users/grushton/develop/duos-ui curl -sS -o /dev/null -w '%{http_code}\n' https://duos-k8s.dsde-dev.broadinstitute.org/config.json
```

Expected: `200`. If it fails, stop and report to Greg. The rest of the plan needs a route through the VPN.

- [ ] **Step 4: Pick the feature names**

Find a `gcloud` feature that can install `gke-gcloud-auth-plugin`. Record the exact feature IDs and option names for Task 3. Candidates:
`ghcr.io/devcontainers/features/github-cli:1`,
`ghcr.io/devcontainers/features/kubectl-helm-minikube:1` (set `helm` and `minikube` to `"none"`),
`ghcr.io/dhoeric/features/google-cloud-cli:1`.

---

### Task 2: Rewrite the setup script (TDD)

**Files:**
- Create: `scripts/test/setup-devcontainer.test.sh`
- Modify: `scripts/setup-devcontainer.sh` (full rewrite)

**Interfaces:**
- Consumes: `scripts/render-configs.sh --write_env true --write_config true --write_site_conf true`.
- Produces: `scripts/setup-devcontainer.sh [--refresh]`. Env `DUOS_WORKSPACE` sets the workspace (default `/workspaces/duos-ui`). It always exits 0.

- [ ] **Step 1: Write the failing test**

Create `scripts/test/setup-devcontainer.test.sh` and run `chmod +x` on it:

```bash
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
[ "$(wc -l < "$LOG")" = 1 ]; expect "one missing: exactly one call" $?
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
bash scripts/test/setup-devcontainer.test.sh
```

Expected: FAIL lines. The old script calls no render script.

- [ ] **Step 3: Write the implementation**

Replace `scripts/setup-devcontainer.sh` with:

```bash
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
bash scripts/test/setup-devcontainer.test.sh
```

Expected: every line starts with `PASS` and the last line is `All tests passed.`

- [ ] **Step 5: Check the shell syntax**

```bash
bash -n scripts/setup-devcontainer.sh && shellcheck scripts/setup-devcontainer.sh scripts/test/setup-devcontainer.test.sh
```

Expected: no output. Fix any finding.

- [ ] **Step 6: Commit**

```bash
git add scripts/setup-devcontainer.sh scripts/test/setup-devcontainer.test.sh
git commit -m "[DT-XXXX] Render local config from the setup script inside the dev container"
```

Replace `DT-XXXX` with the real ticket number.

---

### Task 3: Add tools and login volumes to both containers

**Files:**
- Modify: `.devcontainer/devcontainer.json`
- Modify: `.devcontainer/uber/devcontainer.json`

**Interfaces:**
- Consumes: the feature IDs from Task 1 Step 4.
- Produces: `gh`, `gcloud`, `gke-gcloud-auth-plugin`, `kubectl`, and `jq` on the `PATH`. Volumes at `/home/node/.config/gcloud` and `/home/node/.config/gh`.

- [ ] **Step 1: Edit `.devcontainer/devcontainer.json`**

Add this key:

```json
    "mounts": [
        "source=duos-gcloud-config,target=/home/node/.config/gcloud,type=volume",
        "source=duos-gh-config,target=/home/node/.config/gh,type=volume"
    ],
```

Add to `features` (use the IDs and options from Task 1):

```json
        "ghcr.io/devcontainers/features/github-cli:1": {},
        "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
            "helm": "none",
            "minikube": "none"
        },
        "ghcr.io/dhoeric/features/google-cloud-cli:1": {}
```

If Task 1 shows that `jq` is missing, add a feature that installs it. If the `gcloud` feature lacks `gke-gcloud-auth-plugin`, add the option or feature that installs it.

- [ ] **Step 2: Edit `.devcontainer/uber/devcontainer.json`**

Add the same three features. Add the two volume strings to its existing `mounts` array. Keep the `consent` bind mount.

- [ ] **Step 3: Rebuild and check the tools**

```bash
npx @devcontainers/cli up --workspace-folder /Users/grushton/develop/duos-ui --remove-existing-container
npx @devcontainers/cli exec --workspace-folder /Users/grushton/develop/duos-ui bash -c 'gh --version && gcloud --version | head -1 && kubectl version --client && gke-gcloud-auth-plugin --version && jq --version'
```

Expected: a version line for each tool.

- [ ] **Step 4: Commit**

```bash
git add .devcontainer/devcontainer.json .devcontainer/uber/devcontainer.json
git commit -m "[DT-XXXX] Add gh, gcloud, and kubectl to the dev containers"
```

---

### Task 4: Update the documentation

**Files:**
- Modify: `DEVNOTES.md` (section "Dev Container", lines 3-15)

- [ ] **Step 1: Replace the section**

Replace the text from `## Dev Container` up to `## Local Setup` with:

````markdown
## Dev Container

If you use Visual Studio Code (VSCode) and Docker, you can use the Dev Container configuration. The container makes the local config files for you. On start, it runs `scripts/setup-devcontainer.sh`, which runs [render-configs.sh](scripts/render-configs.sh) with all write options.

1. Connect the host to the non-split Broad VPN.

2. Open the project in VSCode. When the notification in the bottom right corner asks about the Dev Container, click "Reopen in container".

3. On the first start, the script asks for two logins. Run the commands it prints in the container terminal, then run the script again:

   ```sh
   gcloud auth login --no-launch-browser
   gh auth login
   ./scripts/setup-devcontainer.sh
   ```

   Your logins stay in Docker volumes, so a rebuild does not ask again.

4. Every 3 months the certs rotate. Run `./scripts/setup-devcontainer.sh --refresh` to make all files again.

If you do not use the Dev Container, follow [Local Setup](#local-setup) and run `render-configs.sh` yourself.

````

- [ ] **Step 2: Commit**

```bash
git add DEVNOTES.md
git commit -m "[DT-XXXX] Document config rendering in the dev container"
```

---

### Task 5: Verify in a real container and open a draft PR

- [ ] **Step 1: Test a clean first start**

Delete `server.crt`, `server.key`, `ca-bundle.crt`, `.env.local`, `public/config.json`, and `site.conf` from the project root. Rebuild the container. Expected: the script prints both login commands and exits 0. The container still starts.

- [ ] **Step 2: Test after login**

In the container terminal, run `gcloud auth login --no-launch-browser`, then `gh auth login`, then `./scripts/setup-devcontainer.sh`. Expected: the last line is `All local config files are present.` Check the files:

```bash
ls -l server.crt server.key ca-bundle.crt .env.local public/config.json site.conf
```

- [ ] **Step 3: Test that logins survive a rebuild**

Rebuild with `--remove-existing-container`. Delete `site.conf`. Expected: the script makes all files with no new login.

- [ ] **Step 4: Run the app**

Run `pnpm install && pnpm start`. Expected: the dev server starts with HTTPS and no ENOENT error.

- [ ] **Step 5: Open a draft PR**

```bash
git push -u origin HEAD
gh pr create --draft
```

Use the PR description format from the constraints. Add the results of Steps 1-4 to the Test plan.

---

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| The container has no route to the VPN | Certs and secrets cannot be fetched | Task 1 Step 3 checks this first. Stop if it fails. |
| A community `gcloud` feature lacks the GKE auth plugin | `get-credentials` fails | Task 1 Step 4 and Task 3 Step 3 check it. |
| Volume ownership is root | `gcloud auth login` cannot write | `fix_volume_owner` runs `sudo chown`. Task 5 Step 2 checks it. |
| `postCreateCommand` has no terminal | The first start makes no file | The script prints the commands. Greg runs it a second time. |
| A run with one missing file re-runs everything | `.env.local` is rewritten | `render-configs.sh` keeps old values and backs up the file. |
| Secrets in `.env.local` | Same risk as on the host | The file stays gitignored and mode 600. The script prints no secret. |
