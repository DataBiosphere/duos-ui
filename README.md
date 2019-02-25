# DUOS UI
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

Builds/deploys handled by CircleCI.

### Developing

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
4. Start development server, which will report any lint violations as well:

    ```sh
    npm start
    ```
5. Testing:
    
    ```sh
    npm test
    ```
    
### TODO

- Testing documentation
- Description    

### Deployment

Builds are deployed with every merge to `develop` and `master`

To execute a deploy manually, generate a "Personal API Token" documented here:

* https://circleci.com/account/api

And use the documentation here: 

* https://circleci.com/docs/2.0/api-job-trigger/

An example run:
```
curl -u <token>: -d build_parameters[CIRCLE_JOB]=deploy_dev \
    https://circleci.com/api/v1.1/project/github/DataBiosphere/duos-ui/tree/develop
```