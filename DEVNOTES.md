# Local Development

1. We use [node@22.6.0](https://github.com/nvm-sh/nvm#installing-and-updating):

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 22.6.0
```
2. Install deps:

```
npm install
```

3. Install configs for an environment. This example is for the `alpha` environment, but you can use values from any 
environment by looking at the deployed configs in https://duos-k8s.dsde-{%ENV%}.broadinstitute.org/config.json where 
{%ENV%} is any of `dev`, `staging`, `alpha`, or `prod`. Remember to set the `env` value appropriately, for example,
`dev`. Certain features are available only in specific environments. Setting the `env` value to the desired environment 
will simulate it for local development. The installation steps outlined in this step can also be completed using the 
[render-configs.sh](scripts/render-configs.sh) script which can generate all required files for local development.
```
cp config/base_config.json public/config.json
```

Ensure that your `/etc/hosts` file has an entry for `local.dsde-dev.broadinstitute.org`
```properties
127.0.0.1	local.dsde-dev.broadinstitute.org
```

Download cert files from dev project (requires access to correct project - see [DUOS team members](https://github.com/orgs/DataBiosphere/teams/duos) for more specifics). Cert files are regenerated on a 3-month rotation so these will need to be updated when they are expired:
```shell
gcloud container clusters get-credentials --zone us-central1-a --project <project> terra-dev
kubectl -n local-dev get secrets local-dev-cert -o 'go-template={{ index .data "tls.crt" | base64decode }}' > server.crt
kubectl -n local-dev get secrets local-dev-cert -o 'go-template={{ index .data "tls.key" | base64decode }}' > server.key
kubectl -n local-dev get configmaps kube-root-ca.crt -o 'go-template={{ index .data "ca.crt" }}' > ca-bundle.crt
```

Create a `site.conf` file in the project root directory using https://github.com/broadinstitute/terra-helmfile/blob/master/charts/duos/templates/_site.conf.tpl as a model. 

Create a local environment file, `.env.local`
```properties
HOST=local.dsde-dev.broadinstitute.org
HTTPS=true
SSL_CRT_FILE=server.crt
SSL_KEY_FILE=server.key
```

4. Start development server:

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
 
