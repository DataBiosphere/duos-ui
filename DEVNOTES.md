# Local Development

1. We use [node@16](https://github.com/nvm-sh/nvm#installing-and-updating):

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 16
```
2. Install deps:

```
npm install
```

3. Install configs for an environment. This example is for the perf environment, but you can use values from any environment by looking at the deployed configs in https://duos-k8s.dsde-{%ENV%}.broadinstitute.org/config.json where {%ENV%} is any of `dev`, `staging`, `perf`, `alpha`, or `prod` 
Remember to set the `env` value appropriately. We use `local` for running via npm, but under docker, we use a real env like `dev` 
```
cp config/perf.json public/config.json
```

Ensure that your `/etc/hosts` file has an entry for `local.broadinstitute.org`
```properties
127.0.0.1	local.broadinstitute.org
```

Download cert files from vault (requires vault access):
```shell
vault login -method=github token=$(cat ~/.github-token)
vault read --format=json <vault path>/server.key | jq -r .data.value > server.key
vault read --format=json <vault path>/server.crt | jq -r .data.value > server.crt
vault read --format=json <vault path>/ca-bundle.crt | jq -r .data.chain > ca-bundle.crt
```

Create a `site.conf` file in the project root directory using https://github.com/broadinstitute/terra-helmfile/blob/master/charts/duos/templates/_site.conf.tpl as a model. 

Create a local environment file, `.env.local`
```properties
HOST=local.broadinstitute.org
HTTPS=true
SSL_CRT_FILE=server.crt
SSL_KEY_FILE=server.key
```

4. Start development server:

```shell
npm start
```
### Running under Docker

Update your local `docker-compose.yaml` file to mount the preferred `config.json` file in app volumes.
Remember to set the `env` value appropriately in `config.json`. We use `local` for running via npm, but under docker, we use a real env like `dev`

```dockerfile
    volumes:
      - ./public/config.json:/usr/share/nginx/html/config.json
``` 

Build and run:

```shell
docker build . -t duos
docker compose up
```
