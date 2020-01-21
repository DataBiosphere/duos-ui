DUOS UI
=======
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

Builds, tests, and deployments are handled by CircleCI.

1. We use node@8 (the current LTS). On Darwin with Homebrew:

    ```sh
    brew install node@8; brew link --overwrite node@8 --force
    ```
2. Update npm:

    ```sh
    npm install -g npm@6
    ```
3. Install deps:

    ```sh
    npm install
    ```
4. Install configs for an environment:

    ```sh
    cp config/dev.json public/config.json
    ```
5. Start development server:

    ```sh
    npm start
    ```
