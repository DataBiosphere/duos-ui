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

### Local Development
See [DEVNOTES.md](DEVNOTES.md) for instructions on setting up an environment for local development.