# E2E role fixture deployment configuration

For local setup, credentials, CI behavior, and troubleshooting, see the
[role-based E2E testing instructions](../../TESTING.md#path-b-full-suite).

## Deployment configuration in terra-helmfile

Deployment values are maintained in the separate `terra-helmfile` repository.
CI runs its own BFF server and needs no deployment changes. After dev or a BEE has switched
to the BFF as part of the separate rollout, add these entries under
`secrets.envSecrets` in the corresponding environment file
(`values/app/duos/live/dev.yaml` or `values/app/duos/bee.yaml.gotmpl`):

```yaml
test_signin_enabled:
  envVarName: DUOS_TEST_SIGNIN_ENABLED
  value: "true"
test_signin_emails:
  envVarName: DUOS_TEST_SIGNIN_EMAILS
  value: "<comma-separated client_email values for the five DUOS_AUTOMATION accounts>"
```

Both configs already render `env: "dev"`. Enabling `bffEnabled`
for an environment is a separate rollout decision. Leave the
fixture variables unset until that cutover is complete; the server refuses to
boot if the fixture is enabled without session infrastructure or BFF mode.
Do not add the variables to shared, staging, or production values.
Enabling the fixture outside `env=dev` is a startup error, including before BFF
cutover. `NODE_ENV` does not control this decision.

The per-IP limiter defaults to 300 requests per minute and uses the same error
marker and response contract as login. Override with
`DUOS_RATE_LIMIT_TEST_SIGNIN_MAX` if measured parallelism requires it.
