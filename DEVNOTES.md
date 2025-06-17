# Local Development

1. We use node LTS at time of writing, but check the [version of Node declared in the Dockerfile](https://github.com/DataBiosphere/duos-ui/blob/develop/Dockerfile#L2) and install that when setting up.  You can install it with [Volta](https://docs.volta.sh/guide/understanding) or NVM.

```
volta install node@22.16.0
```

2. Install deps:

```
npm install
```

3. Generate configuration files and populate certificates by running the [render-configs.sh](scripts/render-configs.sh) script. This requires
connection to the Broad VPN. By default, this points the DUOS UI to the dev environment.

```
cd scripts
./render-configs.sh --write_env true --write_config true
```

#### Notes on render-configs:
* Ensure that HOST is not set in your shell environment, as it will override the value in `.env.local`.  You can check like so: `env | grep HOST=`.
* **Development against other envs**: If you want to point to other envs, you can populate public/config.json with the values from any
environment by looking at the deployed configs in https://duos-k8s.dsde-{%ENV%}.broadinstitute.org/config.json where
{%ENV%} is any of `dev`, `staging`, `alpha`, or `prod`. Remember to set the `env` value appropriately, for example,
`dev`. Certain features are available only in specific environments. Setting the `env` value to the desired environment
will simulate it for local development.
* **Refresh certs on rotation**: render-config.sh populates local certificate files. The certificates are rotated every
3 months and can be repopulated by re-running the script. Again, you'll need to be on the broad VPN.

```shell
cd scripts
./render-configs.sh
```

4. Ensure that your `/etc/hosts` file has an entry for `local.dsde-dev.broadinstitute.org`

```properties
127.0.0.1	local.dsde-dev.broadinstitute.org
```

5. Create a `site.conf` file in the project root directory using https://github.com/broadinstitute/terra-helmfile/blob/master/charts/duos/templates/_site.conf.tpl as a model.



6. Start development server:

```shell
npm start
```
### Running under Docker

Update your local `docker-compose.yaml` file to mount the preferred `config.json` file in app volumes. Remember to set
the `env` value appropriately, for example, `dev`. Certain features are available only in specific environments. Setting
the `env` value to the desired environment will simulate it for local development.

```yaml
    volumes:
      - ./public/config.json:/usr/share/nginx/html/config.json
```

Build and run:

```shell
docker build . -t duos
docker compose up -d
```

Visit https://local.dsde-dev.broadinstitute.org/ to see the instance running under docker.

# Testing

## Cypress Tests

We use Cypress for all component and integration testing. Each suite
of tests is run separately for all PRs via github actions. Local
testing can be run headless or viewed interactively.

Cypress integration (e2e) tests run locally require a different `baseUrl` than those
run in GitHub Actions. Create a `cypress.env.json` file in the root of your
local repo that looks like this:

```json
{
  "baseUrl": "https://local.dsde-dev.broadinstitute.org:3000/"
}
```
Cypress will use these values in `cypress.config.js` and `cypress/support/commands.js`
files instead of the default values.

### Headless
To run cypress integration tests, first start up the app in one terminal
and in another terminal window, spin up the tests headless:

```shell
npm start
npm run cypress:run
```

To run cypress component tests headless:

```shell
npm run cypress:run:component
```

### Interactive
To run cypress integration tests, first start up the app in one terminal
and in another terminal window, spin up the tests for viewing:

```shell
npm start
npm run cypress:open
```

To run cypress component tests in a browser:

```shell
npm run cypress:open:component
```

To run a single test suite:

```shell
npm run cypress:open:component --spec "**/data_access_governance.spec.js"
```
