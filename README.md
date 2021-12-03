DUOS UI
=======
![](https://github.com/databiosphere/duos-ui/workflows/cypress%20tests/badge.svg)
![](https://github.com/databiosphere/duos-ui/workflows/npm%20audit/badge.svg)
![](https://github.com/databiosphere/duos-ui/workflows/dsp-appsec-trivy/badge.svg)
[![CircleCI](https://circleci.com/gh/DataBiosphere/duos-ui.svg?style=svg)](https://circleci.com/gh/DataBiosphere/duos-ui)

## Data Use Oversight System
A semi-automated management service for compliant secondary use of human genomics data.
There are restrictions on researching human genomics data. For example: 
"Data can only be used for breast cancer research with non-commercial purpose".
The Data Use Oversight system ensures that researchers using genomics data honor these restrictions.

### What is DUOS?
* Interfaces to transform data use restrictions to machine readable codes
* A matching algorithm that checks if a data access request is compatible with the restrictions on the data
* Interfaces for the data access committee (DAC) to evaluate data access requests requiring manual review

![What is DUOS](https://github.com/DataBiosphere/duos-ui/blob/develop/public/images/what_is_duos.svg)

### Developers

Deployments are currently run in CircleCI.

1. We use node@16 On Darwin with Homebrew:

```
brew install node@16
```
2. Update npm:

```
npm install -g npm@7
```
3. Install deps:

```
npm install
```
4. Install configs for an environment. This is for the perf environment, but you can use values from any environment by looking at the deployed configs in https://duos-k8s.dsde-{%ENV%}.broadinstitute.org/config.json where {%ENV%} is any of [dev, staging, perf, alpha, prod] 

```
cp config/perf.json public/config.json
```
5. Start development server:

```
npm start
```
### Running under Docker

Update your local environment configuration file and mount that to `/usr/share/nginx/html/config.json`

```
docker build . -t duos
docker run -v ${PWD}/path/to/config.json:/usr/share/nginx/html/config.json:ro -p 80:8080 duos:latest
```
