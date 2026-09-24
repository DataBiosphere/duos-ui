# E2E role fixture deployment

For local setup, see [TESTING.md](../../TESTING.md#path-b-full-suite).

After BFF cutover, add these under `secrets.envSecrets` in terra-helmfile's
`values/app/duos/live/dev.yaml` or `values/app/duos/bee.yaml.gotmpl`:

```yaml
test_signin_enabled:
  envVarName: DUOS_TEST_SIGNIN_ENABLED
  value: "true"
test_signin_emails:
  envVarName: DUOS_TEST_SIGNIN_EMAILS
  value: "<comma-separated client_email values for the five DUOS_AUTOMATION accounts>"
```

Requires `env: "dev"` (also used by BEEs), `bffEnabled: true` and a session DB;
otherwise startup fails. Keep these variables out of shared, staging and production values.
CI configures its own server.

The limit defaults to 300 requests/min/IP; override with `DUOS_RATE_LIMIT_TEST_SIGNIN_MAX`.
